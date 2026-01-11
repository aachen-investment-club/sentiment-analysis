'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';
import ArticleUploader from '../components/ArticleUploader';
import ArticleSelector from '../components/ArticleSelector';
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

export default function ProgressionPage() {
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

  // Upload step state
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Selection step state
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [selectionCommitted, setSelectionCommitted] = useState(false);

  // Analysis step state
  const [startAnalysis, setStartAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showSentimentPlot, setShowSentimentPlot] = useState(false);
  const [showVIXAnalysis, setShowVIXAnalysis] = useState(false);
  const [showSentimentVsAsset, setShowSentimentVsAsset] = useState(false);
  const [exportData, setExportData] = useState<any[]>([]);
  const [showExportToggle, setShowExportToggle] = useState(false);

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
    }, 3000);
  };

  const handleSelectionCommit = (articles: Article[], selectedFilters: Filters) => {
    setSelectedArticles(articles);
    setFilters(selectedFilters);
    setSelectionCommitted(true);
  };

  const handleStartAnalysis = async () => {
    if (selectedArticles.length === 0) {
      alert('Please select at least one article');
      return;
    }

    setStartAnalysis(true);
    // TODO: Call API endpoint for sentiment analysis
    // For now, mock data
    const mockData = {
      dates: ['2024-01-01', '2024-01-15', '2024-02-01'],
      sentiments: [0.5, 0.7, 0.3],
    };
    setAnalysisData(mockData);
  };

  const handleResetExportData = () => {
    setExportData([]);
  };

  const handleDownloadPDF = async () => {
    // TODO: Call API endpoint to generate PDF
    alert('PDF generation will be implemented with backend API');
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
              Sentiment over time mode
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Track how the sentiment of an asset evolves over time. Compare sentiment trends with market volatility (VIX).
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
            title="Select Articles for Analysis"
            summary={
              selectionCommitted && selectedArticles.length > 0
                ? `${selectedArticles.length} article(s) selected and committed`
                : "Choose articles by selecting a starting date and optionally applying filters"
            }
          >
            <p className="text-gray-600 mb-6">
              Choose articles by selecting a starting date and optionally applying filters. Articles must match ALL selected filter categories.
            </p>
            
            <ArticleSelector
              onSelectionCommit={handleSelectionCommit}
              selectionCommitted={selectionCommitted}
            />
          </CollapsibleSection>

          {/* Analysis Step */}
          <CollapsibleSection
            title="Analysis"
            summary={
              startAnalysis && analysisData
                ? "Analysis complete! Click to view results and visualizations"
                : !selectionCommitted || selectedArticles.length === 0
                ? "Select articles first to start analysis"
                : "Click to start sentiment analysis"
            }
          >
            {!selectionCommitted || selectedArticles.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
                Please select and commit articles before starting the analysis.
              </div>
            ) : (
              <div>
                {!startAnalysis ? (
                  <button
                    onClick={handleStartAnalysis}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start Analysis
                  </button>
                ) : (
                  <div className="space-y-6">
                    {analysisData && (
                      <>
                        {/* Sentiment Plot */}
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">Sentiment Progression</h3>
                          <button
                            onClick={() => setShowSentimentPlot(!showSentimentPlot)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            {showSentimentPlot ? 'Hide Sentiment Plot' : 'Show Sentiment Plot'}
                          </button>
                        </div>

                        {showSentimentPlot && analysisData && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <p className="text-lg font-medium mb-2">Sentiment Over Time Chart</p>
                                <p className="text-sm">Chart implementation will be added with backend integration</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-gray-300"></div>

                        {/* VIX Analysis */}
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">Market Volatility Comparison</h3>
                          <button
                            onClick={() => setShowVIXAnalysis(!showVIXAnalysis)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            {showVIXAnalysis ? 'Hide VIX Analysis' : 'Include VIX Analysis'}
                          </button>
                        </div>

                        {showVIXAnalysis && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-600 mb-4">Fetching VIX data...</p>
                            {/* TODO: Implement VIX chart component */}
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              VIX Chart Placeholder
                            </div>
                          </div>
                        )}

                        <div className="border-t border-gray-300"></div>

                        {/* Sentiment vs Asset Comparison */}
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">Sentiment vs Asset Comparison</h3>
                          <button
                            onClick={() => setShowSentimentVsAsset(!showSentimentVsAsset)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            {showSentimentVsAsset ? 'Hide Asset Comparison' : 'Compare Sentiment and Assets'}
                          </button>
                        </div>

                        {showSentimentVsAsset && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            {/* TODO: Implement sentiment vs asset chart component */}
                            <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                              Sentiment vs Asset Chart Placeholder
                            </div>
                          </div>
                        )}

                        <div className="border-t border-gray-300"></div>

                        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                          Analysis complete!
                        </div>
                      </>
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
