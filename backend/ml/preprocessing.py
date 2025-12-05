from typing import List, Tuple
from pathlib import Path
from collections import defaultdict
import fitz  # PyMuPDF for text extraction
import pdfplumber  # For table extraction and complex layouts
import re # For regular expressions
import nltk
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI()

for resource in ("punkt", "punkt_tab"):
    try:
        nltk.data.find(f"tokenizers/{resource}")
    except LookupError:
        nltk.download(resource)

def preprocess_text(raw_text:str) -> List[str]:
    """
    Take raw text and return a list of cleaned sentences/chunks ready for sentiment analysis.
    Performs basic cleaning and sentence splitting.
    """
    
    return nltk.sent_tokenize(raw_text) 

def preprocess_pdf(pdf_path: str) -> str:
    """
    Extract text from PDF bytes and return cleaned text.
    Handles multi-column layouts by reading each column completely
    before moving to the next (left-to-right, top-to-bottom).
    """

    # Convert to Path object for better path handling
    pdf_path = Path(pdf_path)
    
    # Open PDF and extract text with correct reading order
    doc = fitz.open(str(pdf_path))
    text_parts = []
    
    for page in doc:
        page_text = extract_page_text_with_columns(page)
        if page_text:
            text_parts.append(page_text)
    
    doc.close()
    
    # Combine all pages
    full_text = "\n\n".join(text_parts)
    cleaned_text = clean_pdf_text(full_text)
    return cleaned_text

def llm_fine_clean(first_pass: str) -> str:
    """
    Cleaned text through regular expression is cleaned in a second round through LLM to identify unidentified leackage of table elements etc.
    """
    response = client.responses.create(
        model="gpt-5-nano",
        input="""You are a text cleaning assistant. Your task is to identify and remove ONLY:
        - Table data and chart elements that leaked into the text
        - Article metadata (dates, author lines, section headers) that are NOT part of the narrative
        - Clearly nonsensical sentence fragments or insertions

        IMPORTANT RULES:

        1. Remove ONLY these elements:
            A) Table / chart artifacts:
                - Table header rows (e.g., "Name Kürzel Marktkap. in Mrd. US-$ Kurs...")
                - Table data rows (e.g., "Bitcoin 73, 1, -0, -0, Solana 23, 2.646...")
                - Chart axis labels (e.g., "N D F M A M J J A S O N")
                - Fragmented numerical rows that resemble financial tables
                - Random isolated symbols or leftover CSV-like structures

            B) Article metadata that is NOT narrative content:
                - Publication dates at the beginning of the text (e.g., "am Sonntag, 22./23. November 2025 |")
                - Section headers or page headers (e.g., "No", "Wochenende")
                - Author attribution lines (e.g., "von M. Fischer")
                - Magazine/page labels (e.g., "Politik", "Wirtschaft", "Seite 3")

            C) Sentence fragments that are clearly incomplete or nonsensical:
                - Broken words or half-sentences caused by bad scraping
                - Inserted phrases that break grammatical flow

        2. DO NOT remove or modify:
            - Narrative text belonging to the article
            - Dates that occur *inside* a sentence or paragraph as part of reporting
            - Financial terminology or numbers used in story context
            - Quotes, proper nouns, company names
            - Any content that reads as a coherent part of the article

        3. VERY IMPORTANT:
            If unsure whether something is a table/chart artifact or metadata,
            KEEP IT. Only remove elements that are CLEARLY not narrative text.

        4. Output the cleaned text with ONLY the unwanted fragments removed.
        Do not rewrite, summarize, or edit the remaining text.

        Text to clean:
        """ + first_pass
    )
    return response.output_text


def detect_columns(blocks: List[Tuple], page_width: float, tolerance: float = 30) -> List[List[Tuple]]:
    """
    Detect columns in a page by clustering blocks based on their x-position.
    """

    if not blocks:
        return []
    
    # Filter to only text blocks (block_type == 0)
    text_blocks = [b for b in blocks if len(b) >= 6 and b[6] == 0]
    
    if not text_blocks:
        return []
    
    # Group blocks by their left edge (x0), with tolerance
    # Sort by x0 first to process left-to-right
    sorted_by_x = sorted(text_blocks, key=lambda b: b[0])
    
    columns = []
    current_column = [sorted_by_x[0]]
    current_x = sorted_by_x[0][0]
    
    for block in sorted_by_x[1:]:
        block_x = block[0]
        
        # Check if this block is in the same column (similar x0)
        if abs(block_x - current_x) <= tolerance:
            current_column.append(block)
        else:
            # New column detected
            columns.append(current_column)
            current_column = [block]
            current_x = block_x
    
    # Don't forget the last column
    if current_column:
        columns.append(current_column)
    
    # Sort each column's blocks top-to-bottom (by y0)
    for column in columns:
        column.sort(key=lambda b: b[1])
    
    return columns


def extract_page_text_with_columns(page) -> str:
    """
    Extract text from a page, respecting multi-column layout.
    Reads each column completely before moving to the next.
    """

    blocks = page.get_text("blocks")
    page_width = page.rect.width
    
    if not blocks:
        return ""
    
    # Separate header blocks (full-width elements at top) from column blocks
    # Header blocks typically span > 70% of page width
    header_threshold = page_width * 0.7
    
    headers = []
    column_blocks = []
    
    for block in blocks:
        if len(block) < 6 or block[6] != 0:  # Skip non-text blocks
            continue
            
        x0, y0, x1, y1 = block[0], block[1], block[2], block[3]
        block_width = x1 - x0
        
        # Check if it's a full-width header/footer
        if block_width >= header_threshold:
            headers.append(block)
        else:
            column_blocks.append(block)
    
    # Sort headers by y position (top to bottom)
    headers.sort(key=lambda b: b[1])
    
    # Detect columns in remaining blocks
    columns = detect_columns(column_blocks, page_width)
    
    # Build output: headers first, then columns left-to-right
    text_parts = []
    
    # Add top headers (those above the main content)
    if column_blocks:
        first_column_y = min(b[1] for b in column_blocks) if column_blocks else float('inf')
        for header in headers:
            if header[1] < first_column_y:  # Header is above columns
                text = header[4].strip()
                if text:
                    text_parts.append(text)
    
    # Add column content (left to right, top to bottom within each column)
    for column in columns:
        for block in column:
            text = block[4].strip()
            if text:
                text_parts.append(text)
    
    # Add bottom elements (footers, tables that span full width)
    if column_blocks:
        last_column_y = max(b[3] for b in column_blocks) if column_blocks else 0
        for header in headers:
            if header[1] >= last_column_y:  # Footer is below columns
                text = header[4].strip()
                if text:
                    text_parts.append(text)
    
    return "\n".join(text_parts)

def clean_pdf_text(raw_text: str) -> str:
    """
    Clean raw PDF text extracted via PyMuPDF for NLP / FinBERT analysis.
    Steps:
        - remove headers/footers
        - remove page numbers
        - remove tables (lines that are mostly numbers or columns)
        - fix hyphenation
        - normalize spaces
    """

    text = raw_text

    # 1) Remove page numbers
    text = re.sub(r"\n?\s*Page\s*\d+\s*\n", " ", text, flags=re.I)
    text = re.sub(r"\n?\s*\d+\s*\n", " ", text)  # standalone numbers

    # 2) Remove headers with ALL CAPS
    text = re.sub(r"\b[A-ZÄÖÜ]{3,}(\s+[A-ZÄÖÜ]{3,})*\b", " ", text)

    # 3) Remove hyphenation at line breaks ("Krypto-währungen")
    text = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", text)

    # 4) Remove table-like lines: mostly numbers or multiple columns (BEFORE removing newlines!)
    cleaned_lines = []
    for line in text.split("\n"):
        if not is_table_line(line):
            cleaned_lines.append(line)
    
    text = "\n".join(cleaned_lines)

    # 5) Remove hard line breaks inside paragraphs
    text = re.sub(r"\n+", " ", text)

    # 6) Normalize spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text

def is_table_line(line: str) -> bool:
    """
    Heuristic to detect table lines:
    - lines with >40% digits
    - lines with many columns separated by spaces
    - lines with lots of punctuation but few words
    """
    line_stripped = line.strip()

    if len(line_stripped) == 0:
        return False

    # 1) % digits
    digit_ratio = sum(c.isdigit() for c in line_stripped) / len(line_stripped)
    if digit_ratio > 0.35:
        return True

    # 2) Multiple columns (e.g., "Bitcoin   BTC   1.630  -16.0")
    if len(line_stripped.split()) >= 6:  # many tokens = likely a table row
        # check if at least 3 tokens are numeric-ish
        numeric_like = sum(bool(re.match(r"^[\d\.,%-]+$", tok)) for tok in line_stripped.split())
        if numeric_like >= 3:
            return True

    return False


if __name__ == "__main__":
    sentences = preprocess_pdf("../../example_articles/bitcoin_article.pdf")
    print(sentences)
    sentences = llm_fine_clean(preprocess_pdf("../../example_articles/bitcoin_article.pdf"))
    print(sentences)