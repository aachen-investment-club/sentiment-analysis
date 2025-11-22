'use client';

interface DownloadButtonsProps {
  onDownloadCSV?: () => void;
  onDownloadPDF?: () => void;
}

export default function DownloadButtons({
  onDownloadCSV,
  onDownloadPDF,
}: DownloadButtonsProps) {
  const handleDownloadCSV = () => {
    if (onDownloadCSV) {
      onDownloadCSV();
      return;
    }

    // Mock CSV download functionality
    const csvContent = `Sentence,Sentiment,Confidence
"The company reported record-breaking profits in Q3 quarter, significantly exceeding analyst expectations.",Positive,92
"Revenue growth was strong across all business segments, with particular strength in the technology division.",Positive,88
"However, concerns about future market volatility slightly impacted investor confidence.",Negative,75
"The management team remains optimistic about the upcoming fiscal year and has raised guidance.",Positive,85
"However, concerns about regulatory changes have slightly impacted future projections.",Negative,70
"The company's strategic investments in emerging markets show promising early results.",Positive,82`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sentiment-analysis-results.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      return;
    }

    // Mock PDF download - in a real implementation, you'd generate a PDF
    // For now, we'll show an alert or create a simple text file
    alert('PDF Report download functionality will be implemented with a PDF generation library (e.g., jsPDF or pdfkit).');
    
    // Placeholder: Create a simple text report
    const reportContent = `Financial Sentiment Analysis Report
Generated: ${new Date().toLocaleString()}

OVERALL SENTIMENT: POSITIVE
Confidence: 88%

SENTIMENT DISTRIBUTION:
- Positive: 40%
- Negative: 60%

DETAILED BREAKDOWN:
1. "The company reported record-breaking profits in Q3 quarter, significantly exceeding analyst expectations."
   Sentiment: Positive | Confidence: 92%

2. "Revenue growth was strong across all business segments, with particular strength in the technology division."
   Sentiment: Positive | Confidence: 88%

3. "However, concerns about future market volatility slightly impacted investor confidence."
   Sentiment: Negative | Confidence: 75%

4. "The management team remains optimistic about the upcoming fiscal year and has raised guidance."
   Sentiment: Positive | Confidence: 85%

5. "However, concerns about regulatory changes have slightly impacted future projections."
   Sentiment: Negative | Confidence: 70%

6. "The company's strategic investments in emerging markets show promising early results."
   Sentiment: Positive | Confidence: 82%

SUMMARY:
- Total Sentences: 6
- Positive: 4
- Negative: 2
- Neutral: 0
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sentiment-analysis-report.txt');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Download Results
      </h2>

      <div className="space-y-4">
        <button
          onClick={handleDownloadCSV}
          className="
            w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
            hover:bg-blue-700 active:scale-95
            transition-all duration-200 shadow-md hover:shadow-lg
            flex items-center justify-center gap-2
          "
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Results (CSV)
        </button>

        <button
          onClick={handleDownloadPDF}
          className="
            w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
            hover:bg-blue-700 active:scale-95
            transition-all duration-200 shadow-md hover:shadow-lg
            flex items-center justify-center gap-2
          "
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Download Results (PDF Report)
        </button>
      </div>
    </div>
  );
}

