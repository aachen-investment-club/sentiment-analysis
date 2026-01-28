from langdetect import detect, detect_langs, LangDetectException
from typing import Optional


def detect_language(text: str, default: str = "en") -> str:
    """
    Detect language of text using Google's langdetect library.
    
    This function uses the langdetect library which is based on Google's
    language detection algorithm. It's more accurate than simple pattern matching.
    
    Args:
        text: Text to analyze (typically article title or content)
        default: Default language code if detection fails ("en" or "de")
        
    Returns:
        Language code: "en" for English or "de" for German
        
    Note:
        - If text is empty or None, returns default
        - If detection fails (LangDetectException), returns default
        - Only detects "de" (German) or defaults to "en" (English)
    """
    if not text or not text.strip():
        return default
    
    try:
        detected = detect(text)
        return "de" if detected == "de" else "en"
    except LangDetectException:
        return default


def is_article_german(article_title: Optional[str] = None, article_text: Optional[str] = None) -> bool:
    """
    Detect if an article is in German based on title and/or text.
    
    This function combines title and text for better detection accuracy.
    Langdetect works better with longer text, so we combine both when available.
    Uses probability-based detection for more reliable results.
    
    Args:
        article_title: Article title
        article_text: Article text content
        
    Returns:
        True if German, False if English
        
    Note:
        - Defaults to German (True) if no text is provided
        - This matches the behavior in prototyping code
        - Combines title + text for better accuracy on short titles
    """
    # Combine title and text for better detection (langdetect works better with more text)
    text_parts = []
    
    if article_title and article_title.strip():
        text_parts.append(article_title.strip())
    
    if article_text and article_text.strip():
        # Use first 500 characters of article text for detection (enough for accurate detection)
        text_parts.append(article_text.strip()[:500])
    
    text_to_analyze = " ".join(text_parts) if text_parts else None
    
    if not text_to_analyze or not text_to_analyze.strip():
        # Default to German if no text available (matches prototyping behavior)
        return True
    
    # Check minimum length - langdetect needs at least a few words
    if len(text_to_analyze.strip()) < 10:
        # Too short for reliable detection, default to German
        return True
    
    try:
        # Use detect_langs to get probabilities for better accuracy
        # This helps when text is ambiguous or short
        languages = detect_langs(text_to_analyze)
        
        # Check probabilities - German needs >0.4, English needs >0.6 for confidence
        german_prob = 0.0
        english_prob = 0.0
        
        for lang_prob in languages:
            if lang_prob.lang == "de":
                german_prob = lang_prob.prob
            elif lang_prob.lang == "en":
                english_prob = lang_prob.prob
        
        # If German probability is higher or significant, return True
        if german_prob > 0.4:
            return True
        # If English has very high confidence (>0.7), return False
        if english_prob > 0.7 and german_prob < 0.3:
            return False
        
        # Fallback to simple detect if probabilities don't give clear answer
        detected_lang = detect(text_to_analyze)
        return detected_lang == "de"
        
    except LangDetectException:
        # Default to German on error (matches prototyping behavior)
        return True


if __name__ == "__main__":
    # Test the language detection (runs silently)
    test_cases = [
        ("Bitcoin price surges to new all-time high", "en"),
        ("Bitcoin-Preis steigt auf neues Allzeithoch", "de"),
        ("Der Markt zeigt positive Signale", "de"),
        ("The market shows positive signals", "en"),
        ("", "en"),  # Empty string
    ]
    for text, expected in test_cases:
        detected = detect_language(text)
        assert detected == expected, f"Text: {text[:50]!r}, expected {expected}, got {detected}"
