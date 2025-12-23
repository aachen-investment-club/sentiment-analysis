'use client';

import Link from 'next/link';
import Sidebar from './components/Sidebar';
import { useSidebar } from './components/SidebarContext';

export default function Home() {
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />      

      {/* Header Section */}
      <header className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all duration-300 ${sidebarWidth}`}>
        <div className="w-full px-4 sm:px-6 py-8 sm:py-12">
          <div className="mx-auto text-center max-w-full lg:max-w-4xl xl:max-w-5xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              AIC Sentiment Analyzer
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              This application provides advanced sentiment analysis for financial documents using FinBERT models. 
              Select a mode from below to begin your analysis.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full px-4 sm:px-6 py-8 sm:py-16 transition-all duration-300 ${sidebarWidth}`}>
        <div className="mx-auto space-y-8 sm:space-y-12 max-w-full lg:max-w-4xl xl:max-w-5xl">
        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* Mode Selection Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Progression Mode Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 sm:p-6 hover:shadow-xl transition-shadow w-full min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Sentiment over time mode
            </h2>
            <p className="text-sm text-gray-600 mb-5 sm:mb-6">
              Track how the sentiment of an asset evolves over time. 
              Compare sentiment trends with market volatility (VIX).
            </p>
            <Link 
              href="/progression"
              className="block w-full text-center px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
            >
              Go to Progression Mode
            </Link>
          </div>

          {/* Comparison Mode Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 sm:p-6 hover:shadow-xl transition-shadow w-full min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Asset sentiment comparison mode
            </h2>
            <p className="text-sm text-gray-600 mb-5 sm:mb-6">
              Compare the sentiments of multiple assets. 
              Analyze relative sentiment performance.
            </p>
            <Link 
              href="/comparison"
              className="block w-full text-center px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
            >
              Go to Comparison Mode
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* Key Features Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6 text-center">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5 w-full min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Multi-Language Support
              </h3>
              <p className="text-sm text-gray-700">
                Analyze documents in English and German with automatic translation capabilities.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5 w-full min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Advanced AI Models
              </h3>
              <p className="text-sm text-gray-700">
                Powered by FinBERT models specifically trained for financial text analysis.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5 w-full min-w-0 sm:col-span-2 lg:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Export & Share
              </h3>
              <p className="text-sm text-gray-700">
                Download comprehensive PDF reports with your analysis results.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* What You Can Do Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6 text-center">
            What You Can Do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg p-4 sm:p-5 w-full min-w-0">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex flex-col">
                  <span className="font-semibold text-gray-900">• Track Market Sentiment:</span>
                  <span className="ml-4">Monitor how sentiment changes over time for specific assets</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold text-gray-900">• Compare Performance:</span>
                  <span className="ml-4">Analyze sentiment differences between multiple assets or markets</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold text-gray-900">• VIX Correlation:</span>
                  <span className="ml-4">Understand the relationship between sentiment and market volatility</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-5 w-full min-w-0">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex flex-col">
                  <span className="font-semibold text-gray-900">• Document Analysis:</span>
                  <span className="ml-4">Upload PDFs or select from existing documents</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold text-gray-900">• Filter & Search:</span>
                  <span className="ml-4">Use advanced filters to find specific articles or time periods</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-semibold text-gray-900">• Visual Insights:</span>
                  <span className="ml-4">Generate charts and visualizations of sentiment trends</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* Getting Started Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5 lg:p-6">
          <details className="group">
            <summary className="cursor-pointer text-lg sm:text-xl font-semibold text-gray-900 mb-3 list-none">
              <span className="flex items-center justify-between">
                Getting Started Guide
                <span className="text-gray-400 group-open:hidden">▼</span>
                <span className="text-gray-400 hidden group-open:inline">▲</span>
              </span>
            </summary>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-900">Step 1:</span> Choose an analysis mode from above or use the navigation.
              </div>
              <div>
                <span className="font-semibold text-gray-900">Step 2:</span> Upload documents or select from existing documents in the database.
              </div>
              <div>
                <span className="font-semibold text-gray-900">Step 3:</span> Apply filters to narrow down your selection (dates, assets, markets, etc.).
              </div>
              <div>
                <span className="font-semibold text-gray-900">Step 4:</span> Run the analysis and explore the results.
              </div>
              <div>
                <span className="font-semibold text-gray-900">Step 5:</span> Export your findings as a PDF report.
              </div>
            </div>
          </details>
          </div>
          
        {/* Technology Footer */}
        <div className="border-t border-gray-300 pt-6 sm:pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-center">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Powered by</p>
              <p className="text-xs sm:text-sm text-gray-500">FinBERT Models</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Languages</p>
              <p className="text-xs sm:text-sm text-gray-500">English • German</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Analysis Types</p>
              <p className="text-xs sm:text-sm text-gray-500">Classification • Regression</p>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
