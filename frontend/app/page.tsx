import DataInput from './components/DataInput';
import OverallSentiment from './components/OverallSentiment';
import DetailedSentimentBreakdown from './components/DetailedSentimentBreakdown';
import DownloadButtons from './components/DownloadButtons';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section with Subtle Background */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Financial Sentiment Analyzer
            </h1>
            <p className="text-lg text-gray-600">
              Quickly analyze of sentiment of documents, news articles, or text snippets.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-16 max-w-7xl space-y-8">
        <DataInput />
        
        {/* Sentiment Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Overall Sentiment + Download Buttons */}
          <div className="flex flex-col gap-8">
            <OverallSentiment />
            <DownloadButtons />
          </div>
          
          {/* Right Column: Detailed Sentiment Breakdown */}
          <DetailedSentimentBreakdown />
        </div>
      </main>
    </div>
  );
}
