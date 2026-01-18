'use client';

interface SentenceSentiment {
  text: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  score: number;
}

interface DetailedSentimentBreakdownProps {
  sentences?: SentenceSentiment[];
  topK?: number;
}

export default function DetailedSentimentBreakdown({
  sentences = [],
  topK = 5
}: DetailedSentimentBreakdownProps) {
  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-green-100 border-l-4 border-green-500 text-green-900';
      case 'NEGATIVE':
        return 'bg-red-100 border-l-4 border-red-500 text-red-900';
      default:
        return 'bg-gray-100 border-l-4 border-gray-400 text-gray-700';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'Positive';
      case 'NEGATIVE':
        return 'Negative';
      default:
        return 'Neutral';
    }
  };

  // Get top K most relevant sentences (highest confidence scores)
  const getTopKSentences = () => {
    if (!sentences || sentences.length === 0) {
      return [];
    }
    
    // Sort by absolute score (confidence) in descending order
    const sorted = [...sentences].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    return sorted.slice(0, topK);
  };

  const topSentences = getTopKSentences();

  if (sentences.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Detailed Sentiment Breakdown
        </h2>
        <p className="text-gray-500 text-center py-8">
          Enter text and analyze to see detailed sentiment breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Detailed Sentiment Breakdown
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Top {topK} most relevant sentences (sorted by relevance)
      </p>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {topSentences.map((sentence, index) => (
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
              <div className="flex-shrink-0">
                <span className={`
                  text-xs font-semibold px-2 py-1 rounded
                  ${sentence.sentiment === 'POSITIVE' 
                    ? 'bg-green-200 text-green-800' 
                    : sentence.sentiment === 'NEGATIVE'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-gray-200 text-gray-800'
                  }
                `}>
                  {getSentimentLabel(sentence.sentiment)}
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
              {sentences.filter(s => s.sentiment === 'POSITIVE').length}
            </div>
            <div className="text-sm text-gray-600">Positive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {sentences.filter(s => s.sentiment === 'NEGATIVE').length}
            </div>
            <div className="text-sm text-gray-600">Negative</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {sentences.filter(s => s.sentiment === 'NEUTRAL').length}
            </div>
            <div className="text-sm text-gray-600">Neutral</div>
          </div>
        </div>
      </div>
    </div>
  );
}

