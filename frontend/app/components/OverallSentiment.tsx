'use client';

interface OverallSentimentProps {
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence?: number;
  positivePercentage?: number;
  negativePercentage?: number;
  neutralPercentage?: number;
}

export default function OverallSentiment({
  sentiment,
  confidence,
  positivePercentage,
  negativePercentage,
  neutralPercentage,
}: OverallSentimentProps) {
  // Default values if not provided
  const displaySentiment = sentiment || 'NEUTRAL';
  const displayPositive = positivePercentage ?? 0;
  const displayNegative = negativePercentage ?? 0;
  const displayNeutral = neutralPercentage ?? 0;
  
  // Calculate donut chart values
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const positiveLength = (displayPositive / 100) * circumference;
  const negativeLength = (displayNegative / 100) * circumference;
  const neutralLength = (displayNeutral / 100) * circumference;

  const sentimentColor = 
    displaySentiment === 'POSITIVE' ? 'text-green-600' :
    displaySentiment === 'NEGATIVE' ? 'text-red-600' :
    'text-gray-600';

  if (!sentiment) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Overall Sentiment
        </h2>
        <p className="text-gray-500 text-center py-8">
          Enter text and analyze to see overall sentiment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Overall Sentiment
      </h2>

      <div className="flex flex-col items-center">
        {/* Sentiment Text */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold mb-3 ${sentimentColor}`}>
            {displaySentiment}
          </div>
        </div>

        {/* Donut Chart - Centered below sentiment */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg
              className="transform -rotate-90 absolute"
              width="192"
              height="192"
              viewBox="0 0 192 192"
            >
              {/* Positive segment (green) - starts from top */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray={`${positiveLength} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              
              {/* Negative segment (red) - continues after positive */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                fill="none"
                stroke="#ef4444"
                strokeWidth="20"
                strokeDasharray={`${negativeLength} ${circumference}`}
                strokeDashoffset={-positiveLength}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              
              {/* Neutral segment (gray) - continues after negative */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                fill="none"
                stroke="#6b7280"
                strokeWidth="20"
                strokeDasharray={`${neutralLength} ${circumference}`}
                strokeDashoffset={-(positiveLength + negativeLength)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            {/* Center text - show dominant sentiment percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-gray-900">
                {displaySentiment === 'POSITIVE' ? displayPositive : 
                 displaySentiment === 'NEGATIVE' ? displayNegative : 
                 displayNeutral}%
              </div>
              <div className="text-sm text-gray-500">
                {displaySentiment}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">
                {displayPositive}% Positive
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">
                {displayNegative}% Negative
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span className="text-sm text-gray-600">
                {displayNeutral}% Neutral
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

