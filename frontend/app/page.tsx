'use client';

import Link from 'next/link';
import Sidebar from './components/Sidebar';
import { useSidebar } from './components/SidebarContext';

export default function Home() {
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <Sidebar />      

      {/* Header Section */}
      <header className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all duration-300 ${sidebarWidth}`}>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              AIC Sentiment Analyzer
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              This application provides advanced sentiment analysis for financial documents using FinBERT models. 
              Select a mode from below to begin your analysis.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`container mx-auto px-4 py-16 max-w-7xl space-y-12 transition-all duration-300 ${sidebarWidth}`}>
        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* Mode Selection Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Progression Mode Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Sentiment over time mode
            </h2>
            <p className="text-gray-600 mb-6">
              Track how sentiment evolves across selected documents over time. 
              Compare sentiment trends with market volatility (VIX).
            </p>
            <Link 
              href="/progression"
              className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Progression Mode
            </Link>
          </div>

          {/* Comparison Mode Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Asset sentiment comparison mode
            </h2>
            <p className="text-gray-600 mb-6">
              Compare sentiment across different assets, markets, or commodities. 
              Analyze relative sentiment performance.
            </p>
            <Link 
              href="/comparison"
              className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Go to Comparison Mode
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* Key Features Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Multi-Language Support
              </h3>
              <p className="text-gray-700">
                Analyze documents in English and German with automatic translation capabilities.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Advanced AI Models
              </h3>
              <p className="text-gray-700">
                Powered by FinBERT models specifically trained for financial text analysis.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Export & Share
              </h3>
              <p className="text-gray-700">
                Download comprehensive PDF reports with your analysis results.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* What You Can Do Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            What You Can Do
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">• Track Market Sentiment:</span>
                  <span>Monitor how sentiment changes over time for specific assets</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">• Compare Performance:</span>
                  <span>Analyze sentiment differences between multiple assets or markets</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">• VIX Correlation:</span>
                  <span>Understand the relationship between sentiment and market volatility</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">• Document Analysis:</span>
                  <span>Upload PDFs or select from existing documents</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">• Filter & Search:</span>
                  <span>Use advanced filters to find specific articles or time periods</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-gray-900 mr-2">• Visual Insights:</span>
                  <span>Generate charts and visualizations of sentiment trends</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300"></div>

        {/* Getting Started Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <details className="group">
            <summary className="cursor-pointer text-2xl font-semibold text-gray-900 mb-4 list-none">
              <span className="flex items-center justify-between">
                Getting Started Guide
                <span className="text-gray-400 group-open:hidden">▼</span>
                <span className="text-gray-400 hidden group-open:inline">▲</span>
              </span>
            </summary>
            <div className="mt-6 space-y-4 text-gray-700">
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
        <div className="border-t border-gray-300 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Powered by</p>
              <p className="text-sm text-gray-500">FinBERT Models</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Languages</p>
              <p className="text-sm text-gray-500">English • German</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Analysis Types</p>
              <p className="text-sm text-gray-500">Classification • Regression</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
