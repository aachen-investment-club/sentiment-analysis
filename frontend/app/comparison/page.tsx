'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';
import ArticleUploader from '../components/ArticleUploader';
import ArticleSelectorComparison from '../components/ArticleSelectorComparison';
import CollapsibleSection from '../components/CollapsibleSection';
import LinesCompare from '../components/LinesCompare';
import BarsCompare from '../components/BarsCompare';

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



interface AnalysisData{
  dates: Date[]; 
  sentiments: number[]; 
}




type CompareSeries = {
  dates: string[];
  sentiments: number[];
};

type CompareCategoryData = Record<string, CompareSeries>;

type CompareDataResponse = {
  assets: CompareCategoryData;
  commodities: CompareCategoryData;
  markets: CompareCategoryData;
};



export default function ComparisonPage() {
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
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [articlesWithSentiment, setArticlesWithSentiment] = useState<Article[]>([]);
  const [showSentimentPlots, setShowSentimentPlots] = useState(false);




  const [compareDataResponse, setCompareDataResponse] = useState<CompareDataResponse | null>(null);

  const [assetCompareData, setAssetCompareData] = useState<CompareCategoryData | null>(null);
  const [commodityCompareData, setCommodityCompareData] = useState<CompareCategoryData | null>(null);
  const [marketCompareData, setMarketCompareData] = useState<CompareCategoryData | null>(null);


  const handleUploadSuccess =  () => {
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
    }, 3000);
  };

  const handleSelectionCommit = (articles: Article[], filterSelection: Filters) => {
    setSelectedArticles(articles);
    setFilters(filterSelection);
    setSelectionCommitted(true);
  };

  const handleSelectionRevert = () => {
    setSelectedArticles([]);
    setFilters({});
    setSelectionCommitted(false);
    // Also reset analysis state if analysis was started
    if (startAnalysis) {
      setStartAnalysis(false);
      setLoadingAnalysis(false);
      setAnalysisComplete(false);
      setCompareDataResponse(null);
      setAssetCompareData(null);
      setCommodityCompareData(null);
      setMarketCompareData(null);
      setShowSentimentPlots(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (selectedArticles.length === 0) {
      alert('Please select at least one article');
      return;
    }

    setStartAnalysis(true);
    setLoadingAnalysis(true);

    try {
      const response = await fetch("http://localhost:8000/api/sentiment/compare_mode", {
        method: "POST", 
        headers: {
        "Content-Type": "application/json",
        }, 
        body: JSON.stringify(
          {
            articles: selectedArticles, 
            filters: filters
          } 
        )
      })

      if (!response.ok){
        throw new Error(`Failed to fetch articles: ${response.statusText}`)
      }
      const data: CompareDataResponse = await response.json();
      console.log(data);

      setCompareDataResponse(data);
      setAssetCompareData(data.assets);
      setCommodityCompareData(data.commodities);
      setMarketCompareData(data.markets);

      setAnalysisComplete(true);
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Failed to start analysis. Please try again.');
    } finally {
      setLoadingAnalysis(false);
    }
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
              selectionCommitted && selectedArticles.length > 0
                ? `${selectedArticles.length} article(s) selected and committed`
                : "Choose articles by selecting a date range and optionally applying filters"
            }
          >
            <p className="text-gray-600 mb-6">
              Select articles by choosing a date range and optionally applying filters. Articles matching any selected filter category will be included.
            </p>
            
            <ArticleSelectorComparison
              onSelectionCommit={handleSelectionCommit}
              onSelectionRevert={handleSelectionRevert}
              selectionCommitted={selectionCommitted}
            />
          </CollapsibleSection>

          {/* Analysis Step */}
          <CollapsibleSection
            title="Analysis"
            summary={
              loadingAnalysis
                ? "Running analysis..."
                : analysisComplete
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
                    {loadingAnalysis ? (
                      <div className="bg-gray-50 rounded-lg p-8">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-lg font-medium text-gray-700 mb-2">Running sentiment analysis...</p>
                          <p className="text-sm text-gray-500">Please wait while we process your articles</p>
                        </div>
                      </div>
                    ) : analysisComplete ? (
                      <>
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
                            {filters?.assets && filters.assets.length > 0 && assetCompareData && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Sentiment by Assets - Time Series</h4>
                                <LinesCompare
                                  category="Assets"
                                  analysisData={assetCompareData}
                                />
                              </div>
                            )}

                            {/* Sentiment by Markets - Time Series */}
                            {filters?.markets && filters.markets.length > 0 && marketCompareData && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Sentiment by Markets - Time Series</h4>
                                <LinesCompare
                                  category="Markets"
                                  analysisData={marketCompareData}
                                />
                              </div>
                            )}

                            {/* Sentiment by Commodities - Time Series */}
                            {filters?.commodities && filters.commodities.length > 0 && commodityCompareData && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Sentiment by Commodities - Time Series</h4>
                                <LinesCompare
                                  category="Commodities"
                                  analysisData={commodityCompareData}
                                />
                              </div>
                            )}

                            {/* Average Sentiment Comparison - Assets */}
                            {filters?.assets && filters.assets.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Average Sentiment Comparison - Assets</h4>
                                <div className="text-center">
                                  <BarsCompare category="Assets" analysisData={assetCompareData ?? {}} />
                                </div>
                              </div>
                            )}

                            {/* Average Sentiment Comparison - Markets */}
                            {filters?.markets && filters.markets.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Average Sentiment Comparison - Markets</h4>
                                <div className="text-center">
                                  <BarsCompare category="Markets" analysisData={marketCompareData ?? {}} />
                                </div>
                              </div>
                            )}

                            {/* Average Sentiment Comparison - Commodities */}
                            {filters?.commodities && filters.commodities.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Average Sentiment Comparison - Commodities</h4>
                                <div className="text-center">
                                  <BarsCompare category="Commodities" analysisData={commodityCompareData ?? {}} />
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
                      </>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-lg font-medium text-gray-700 mb-2">Analysis failed</p>
                          <p className="text-sm text-gray-500">Please try starting the analysis again</p>
                        </div>
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
