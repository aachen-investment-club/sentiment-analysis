'use client';

interface SentenceSentiment {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

interface DetailedSentimentBreakdownProps {
  sentences?: SentenceSentiment[];
}

export default function DetailedSentimentBreakdown({
  sentences = [
    {
      text: "The company reported record-breaking profits in Q3 quarter, significantly exceeding analyst expectations.",
      sentiment: 'positive',
      confidence: 92
    },
    {
      text: "Revenue growth was strong across all business segments, with particular strength in the technology division.",
      sentiment: 'positive',
      confidence: 88
    },
    {
      text: "However, concerns about future market volatility slightly impacted investor confidence.",
      sentiment: 'negative',
      confidence: 75
    },
    {
      text: "The management team remains optimistic about the upcoming fiscal year and has raised guidance.",
      sentiment: 'positive',
      confidence: 85
    },
    {
      text: "However, concerns about regulatory changes have slightly impacted future projections.",
      sentiment: 'negative',
      confidence: 70
    },
    {
      text: "The company's strategic investments in emerging markets show promising early results.",
      sentiment: 'positive',
      confidence: 82
    }
  ]
}: DetailedSentimentBreakdownProps) {
  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 border-l-4 border-green-500 text-green-900';
      case 'negative':
        return 'bg-red-100 border-l-4 border-red-500 text-red-900';
      default:
        return 'bg-gray-100 border-l-4 border-gray-400 text-gray-700';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Positive';
      case 'negative':
        return 'Negative';
      default:
        return 'Neutral';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Detailed Sentiment Breakdown
      </h2>

      <div className="space-y-4">
        {sentences.map((sentence, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-lg transition-all duration-200
              ${getSentimentStyles(sentence.sentiment)}
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="flex-1 text-sm leading-relaxed">
                {sentence.text}
              </p>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className={`
                  text-xs font-semibold px-2 py-1 rounded
                  ${sentence.sentiment === 'positive' 
                    ? 'bg-green-200 text-green-800' 
                    : sentence.sentiment === 'negative'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-gray-200 text-gray-800'
                  }
                `}>
                  {getSentimentLabel(sentence.sentiment)}
                </span>
                <span className="text-xs text-gray-600">
                  {sentence.confidence}% confidence
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {sentences.filter(s => s.sentiment === 'positive').length}
            </div>
            <div className="text-sm text-gray-600">Positive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {sentences.filter(s => s.sentiment === 'negative').length}
            </div>
            <div className="text-sm text-gray-600">Negative</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {sentences.filter(s => s.sentiment === 'neutral').length}
            </div>
            <div className="text-sm text-gray-600">Neutral</div>
          </div>
        </div>
      </div>
    </div>
  );
}

