'use client';

interface OverallSentimentProps {
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence?: number;
  positivePercentage?: number;
  negativePercentage?: number;
}

export default function OverallSentiment({
  sentiment = 'POSITIVE',
  confidence = 88,
  positivePercentage = 40,
  negativePercentage = 60,
}: OverallSentimentProps) {
  // Calculate donut chart values
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const positiveLength = (positivePercentage / 100) * circumference;
  const negativeLength = (negativePercentage / 100) * circumference;

  const sentimentColor = 
    sentiment === 'POSITIVE' ? 'text-green-600' :
    sentiment === 'NEGATIVE' ? 'text-red-600' :
    'text-gray-600';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Overall Sentiment
      </h2>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Sentiment Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className={`text-6xl font-bold mb-3 ${sentimentColor}`}>
            {sentiment}
          </div>
          <div className="text-xl text-gray-600 font-medium">
            {confidence}% Confidence
          </div>
        </div>

        {/* Right: Donut Chart */}
        <div className="flex-shrink-0">
          <div className="relative w-48 h-48">
            <svg
              className="transform -rotate-90"
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
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-900">
                {positivePercentage}%
              </div>
              <div className="text-sm text-gray-500">Positive</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">
                {positivePercentage}% Positive
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">
                {negativePercentage}% Negative
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

