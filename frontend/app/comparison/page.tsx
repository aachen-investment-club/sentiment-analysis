'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';
import ArticleUploader from '../components/ArticleUploader';
import ArticleSelectorComparison from '../components/ArticleSelectorComparison';
import CollapsibleSection from '../components/CollapsibleSection';

interface Article {
  title: string;
  date: string;
  source: string;
  assets: string[];
  commodities: string[];
  markets: string[];
  DocumentID?: string;
}

interface Filters {
  assets?: string[];
  markets?: string[];
  commodities?: string[];
}

export default function ComparisonPage() {
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

  // Upload step state
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Selection step state
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [startAnalysis, setStartAnalysis] = useState(false);

  // Analysis step state
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [articlesWithSentiment, setArticlesWithSentiment] = useState<Article[]>([]);
  const [showSentimentPlots, setShowSentimentPlots] = useState(false);

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
    }, 3000);
  };

  const handleStartAnalysis = (articles: Article[], selectedFilters: Filters) => {
    if (articles.length === 0) {
      alert('Please select at least one article');
      return;
    }

    setSelectedArticles(articles);
    setFilters(selectedFilters);
    setStartAnalysis(true);
    
    // TODO: Call API endpoint for sentiment analysis
    // For now, simulate analysis
    setTimeout(() => {
      setArticlesWithSentiment(articles);
      setAnalysisComplete(true);
    }, 1000);
  };

  const handleResetExportData = () => {
    // TODO: Reset export data
    console.log('Reset export data');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Header Section */}
      <header className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all duration-300 ${sidebarWidth}`}>
        <div className="w-full px-4 sm:px-6 py-8 sm:py-12">
          <div className="mx-auto text-center max-w-full lg:max-w-4xl xl:max-w-5xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Asset sentiment comparison mode
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Compare the sentiments of multiple assets. Analyze relative sentiment performance.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full px-4 sm:px-6 py-8 sm:py-16 transition-all duration-300 ${sidebarWidth}`}>
        <div className="mx-auto space-y-8 sm:space-y-12 max-w-full lg:max-w-4xl xl:max-w-5xl">
          
          {/* Upload Step */}
          <CollapsibleSection
            title="Upload Documents"
            summary={uploadSuccess ? "Article saved successfully!" : "Click to upload a new document"}
          >
            {uploadSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                Article saved successfully!
              </div>
            )}

            <ArticleUploader onUploadSuccess={handleUploadSuccess} />
          </CollapsibleSection>

          {/* Selection Step */}
          <CollapsibleSection
            title="Select Articles for Comparison"
            summary={
              startAnalysis && selectedArticles.length > 0
                ? `${selectedArticles.length} article(s) selected for comparison`
                : "Choose articles by selecting a date range and optionally applying filters"
            }
          >
            <p className="text-gray-600 mb-6">
              Select articles by choosing a date range and optionally applying filters. Articles matching any selected filter category will be included.
            </p>
            
            <ArticleSelectorComparison
              onStartAnalysis={handleStartAnalysis}
              analysisStarted={startAnalysis}
            />
          </CollapsibleSection>

          {/* Analysis Step */}
          <CollapsibleSection
            title="Analysis Results"
            summary={
              analysisComplete
                ? "Analysis complete! Click to view results and visualizations"
                : startAnalysis
                ? "Running analysis..."
                : "Start analysis to view results"
            }
          >
            {!startAnalysis ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
                Please select articles and start analysis to view results.
              </div>
            ) : (
              <div>
                {!analysisComplete ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-md">
                    Running sentiment analysis...
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                      Analysis complete!
                    </div>

                    {/* Show active filters if any */}
                    {filters && Object.keys(filters).length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Comparison Filters:</p>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {filters.assets && filters.assets.length > 0 && (
                            <li>• Assets: {filters.assets.join(', ')}</li>
                          )}
                          {filters.markets && filters.markets.length > 0 && (
                            <li>• Markets: {filters.markets.join(', ')}</li>
                          )}
                          {filters.commodities && filters.commodities.length > 0 && (
                            <li>• Commodities: {filters.commodities.join(', ')}</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Sentiment Plots */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Sentiment Comparison Visualizations</h3>
                      <button
                        onClick={() => setShowSentimentPlots(!showSentimentPlots)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        {showSentimentPlots ? 'Hide Sentiment Plots' : 'Draw Sentiment Plots'}
                      </button>
                    </div>

                    {showSentimentPlots && (
                      <div className="space-y-6">
                        {/* Sentiment by Assets - Time Series */}
                        {filters?.assets && filters.assets.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Sentiment by Assets - Time Series</h4>
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <p className="text-sm">Line chart showing sentiment over time for: {filters.assets.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sentiment by Markets - Time Series */}
                        {filters?.markets && filters.markets.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Sentiment by Markets - Time Series</h4>
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <p className="text-sm">Line chart showing sentiment over time for: {filters.markets.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sentiment by Commodities - Time Series */}
                        {filters?.commodities && filters.commodities.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Sentiment by Commodities - Time Series</h4>
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <p className="text-sm">Line chart showing sentiment over time for: {filters.commodities.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Average Sentiment Comparison - Assets */}
                        {filters?.assets && filters.assets.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Average Sentiment Comparison - Assets</h4>
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <p className="text-sm">Bar chart comparing average sentiment for: {filters.assets.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Average Sentiment Comparison - Markets */}
                        {filters?.markets && filters.markets.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Average Sentiment Comparison - Markets</h4>
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <p className="text-sm">Bar chart comparing average sentiment for: {filters.markets.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Average Sentiment Comparison - Commodities */}
                        {filters?.commodities && filters.commodities.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Average Sentiment Comparison - Commodities</h4>
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <p className="text-sm">Bar chart comparing average sentiment for: {filters.commodities.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show message if no filters selected */}
                        {(!filters || Object.keys(filters).length === 0) && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <p className="text-sm">No filters selected. Select assets, markets, or commodities to see comparison charts.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* Export Step */}
          <CollapsibleSection
            title="Export Results"
            summary="Click to export your analysis results as a PDF report"
          >
            <p className="text-gray-600 mb-4">
              Download your analysis results as a PDF report.
            </p>
          </CollapsibleSection>

        </div>
      </main>
    </div>
  );
}
