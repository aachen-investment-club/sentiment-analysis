'use client';

import DataInput from '../components/DataInput';
import OverallSentiment from '../components/OverallSentiment';
import DetailedSentimentBreakdown from '../components/DetailedSentimentBreakdown';
import DownloadButtons from '../components/DownloadButtons';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';

export default function AnalyzePage() {
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Header Section with Subtle Background */}
      <header className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all duration-300 ${sidebarWidth}`}>
        <div className="w-full px-4 sm:px-6 py-8 sm:py-12">
          <div className="mx-auto text-center max-w-full lg:max-w-4xl xl:max-w-5xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Financial Sentiment Analyzer
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Quickly analyze of sentiment of documents, news articles, or text snippets.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full px-4 sm:px-6 py-8 sm:py-16 transition-all duration-300 ${sidebarWidth}`}>
        <div className="mx-auto space-y-6 sm:space-y-8 max-w-full lg:max-w-4xl xl:max-w-5xl">
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
        </div>
      </main>
    </div>
  );
}

