'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';
import ArticleSelectorComparison from '../components/ArticleSelectorComparison';
import CollapsibleSection from '../components/CollapsibleSection';
import LinesCompare from '../components/LinesCompare';
import BarsCompare from '../components/BarsCompare';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../lib/api';

const backendBase = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
const loginUrl = `${backendBase}/login`;

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

  // Interpretation states for each plot type
  const [assetLinesInterpretation, setAssetLinesInterpretation] = useState('');
  const [marketLinesInterpretation, setMarketLinesInterpretation] = useState('');
  const [commodityLinesInterpretation, setCommodityLinesInterpretation] = useState('');
  const [assetBarsInterpretation, setAssetBarsInterpretation] = useState('');
  const [marketBarsInterpretation, setMarketBarsInterpretation] = useState('');
  const [commodityBarsInterpretation, setCommodityBarsInterpretation] = useState('');

  // Export data state
  const [exportData, setExportData] = useState<any[]>([]);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [includedPlots, setIncludedPlots] = useState<Set<string>>(new Set());


  // Cleanup includedPlots when plots are removed from exportData
  useEffect(() => {
    const availableTypes = new Set(exportData.map(item => item.type));
    setIncludedPlots(prev => {
      const newSet = new Set(prev);
      let changed = false;
      prev.forEach(type => {
        if (!availableTypes.has(type)) {
          newSet.delete(type);
          changed = true;
        }
      });
      return changed ? newSet : prev;
    });
  }, [exportData]);

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
      // Reset interpretations
      setAssetLinesInterpretation('');
      setMarketLinesInterpretation('');
      setCommodityLinesInterpretation('');
      setAssetBarsInterpretation('');
      setMarketBarsInterpretation('');
      setCommodityBarsInterpretation('');
      setExportData([]);
      setIncludedPlots(new Set());
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
      const response = await fetch(`${API_BASE_URL}/api/sentiment/compare_mode`, {
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

  // Add asset lines plot to export data when drawn
  useEffect(() => {
    if (!assetCompareData || !showSentimentPlots || !filters?.assets || filters.assets.length === 0) {
      // Remove plot when hidden or data unavailable
      setExportData(prev => prev.filter(item => item.type !== 'compare_lines_assets'));
      setIncludedPlots(prev => {
        const newSet = new Set(prev);
        newSet.delete('compare_lines_assets');
        return newSet;
      });
      return;
    }
    
    const seriesData: any = {};
    Object.keys(assetCompareData).forEach(key => {
      seriesData[key] = {
        dates: assetCompareData[key].dates,
        sentiments: assetCompareData[key].sentiments
      };
    });

    const exportItem = {
      type: 'compare_lines_assets',
      title: 'Sentiment by Assets - Time Series',
      interpretation: assetLinesInterpretation || '',
      metrics: [
        { label: 'Assets', value: filters.assets.join(', ') },
        { label: 'Series Count', value: Object.keys(assetCompareData).length.toString() },
      ],
      seriesData: seriesData,
      category: 'Assets',
    };
    
    setExportData(prev => {
      const filtered = prev.filter(item => item.type !== 'compare_lines_assets');
      return [...filtered, exportItem];
    });
    
    // Auto-include new plots
    setIncludedPlots(prev => {
      if (!prev.has('compare_lines_assets')) {
        const newSet = new Set(prev);
        newSet.add('compare_lines_assets');
        return newSet;
      }
      return prev;
    });
  }, [assetCompareData, showSentimentPlots, filters]);

  // Update asset lines interpretation when it changes
  useEffect(() => {
    if (!showSentimentPlots || !filters?.assets || filters.assets.length === 0) return;
    
    setExportData(prev => prev.map(item => 
      item.type === 'compare_lines_assets' 
        ? { ...item, interpretation: assetLinesInterpretation || '' }
        : item
    ));
  }, [assetLinesInterpretation, showSentimentPlots, filters]);

  // Add market lines plot to export data when drawn
  useEffect(() => {
    if (!marketCompareData || !showSentimentPlots || !filters?.markets || filters.markets.length === 0) {
      // Remove plot when hidden or data unavailable
      setExportData(prev => prev.filter(item => item.type !== 'compare_lines_markets'));
      setIncludedPlots(prev => {
        const newSet = new Set(prev);
        newSet.delete('compare_lines_markets');
        return newSet;
      });
      return;
    }
    
    const seriesData: any = {};
    Object.keys(marketCompareData).forEach(key => {
      seriesData[key] = {
        dates: marketCompareData[key].dates,
        sentiments: marketCompareData[key].sentiments
      };
    });

    const exportItem = {
      type: 'compare_lines_markets',
      title: 'Sentiment by Markets - Time Series',
      interpretation: marketLinesInterpretation || '',
      metrics: [
        { label: 'Markets', value: filters.markets.join(', ') },
        { label: 'Series Count', value: Object.keys(marketCompareData).length.toString() },
      ],
      seriesData: seriesData,
      category: 'Markets',
    };
    
    setExportData(prev => {
      const filtered = prev.filter(item => item.type !== 'compare_lines_markets');
      return [...filtered, exportItem];
    });
    
    // Auto-include new plots
    setIncludedPlots(prev => {
      if (!prev.has('compare_lines_markets')) {
        const newSet = new Set(prev);
        newSet.add('compare_lines_markets');
        return newSet;
      }
      return prev;
    });
  }, [marketCompareData, showSentimentPlots, filters]);

  // Update market lines interpretation when it changes
  useEffect(() => {
    if (!showSentimentPlots || !filters?.markets || filters.markets.length === 0) return;
    
    setExportData(prev => prev.map(item => 
      item.type === 'compare_lines_markets' 
        ? { ...item, interpretation: marketLinesInterpretation || '' }
        : item
    ));
  }, [marketLinesInterpretation, showSentimentPlots, filters]);

  // Add commodity lines plot to export data when drawn
  useEffect(() => {
    if (!commodityCompareData || !showSentimentPlots || !filters?.commodities || filters.commodities.length === 0) {
      // Remove plot when hidden or data unavailable
      setExportData(prev => prev.filter(item => item.type !== 'compare_lines_commodities'));
      setIncludedPlots(prev => {
        const newSet = new Set(prev);
        newSet.delete('compare_lines_commodities');
        return newSet;
      });
      return;
    }
    
    const seriesData: any = {};
    Object.keys(commodityCompareData).forEach(key => {
      seriesData[key] = {
        dates: commodityCompareData[key].dates,
        sentiments: commodityCompareData[key].sentiments
      };
    });

    const exportItem = {
      type: 'compare_lines_commodities',
      title: 'Sentiment by Commodities - Time Series',
      interpretation: commodityLinesInterpretation || '',
      metrics: [
        { label: 'Commodities', value: filters.commodities.join(', ') },
        { label: 'Series Count', value: Object.keys(commodityCompareData).length.toString() },
      ],
      seriesData: seriesData,
      category: 'Commodities',
    };
    
    setExportData(prev => {
      const filtered = prev.filter(item => item.type !== 'compare_lines_commodities');
      return [...filtered, exportItem];
    });
    
    // Auto-include new plots
    setIncludedPlots(prev => {
      if (!prev.has('compare_lines_commodities')) {
        const newSet = new Set(prev);
        newSet.add('compare_lines_commodities');
        return newSet;
      }
      return prev;
    });
  }, [commodityCompareData, showSentimentPlots, filters]);

  // Update commodity lines interpretation when it changes
  useEffect(() => {
    if (!showSentimentPlots || !filters?.commodities || filters.commodities.length === 0) return;
    
    setExportData(prev => prev.map(item => 
      item.type === 'compare_lines_commodities' 
        ? { ...item, interpretation: commodityLinesInterpretation || '' }
        : item
    ));
  }, [commodityLinesInterpretation, showSentimentPlots, filters]);

  // Add asset bars plot to export data when drawn
  useEffect(() => {
    if (!assetCompareData || !showSentimentPlots || !filters?.assets || filters.assets.length === 0) {
      // Remove plot when hidden or data unavailable
      setExportData(prev => prev.filter(item => item.type !== 'compare_bars_assets'));
      setIncludedPlots(prev => {
        const newSet = new Set(prev);
        newSet.delete('compare_bars_assets');
        return newSet;
      });
      return;
    }
    
    const seriesData: any = {};
    const averages: { [key: string]: number } = {};
    Object.keys(assetCompareData).forEach(key => {
      const sentiments = assetCompareData[key].sentiments || [];
      const avg = sentiments.length > 0 
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
        : 0;
      averages[key] = avg;
      seriesData[key] = {
        dates: assetCompareData[key].dates,
        sentiments: assetCompareData[key].sentiments
      };
    });

    const exportItem = {
      type: 'compare_bars_assets',
      title: 'Average Sentiment Comparison - Assets',
      interpretation: assetBarsInterpretation || '',
      metrics: [
        { label: 'Assets', value: filters.assets.join(', ') },
        { label: 'Series Count', value: Object.keys(assetCompareData).length.toString() },
      ],
      seriesData: seriesData,
      averages: averages,
      category: 'Assets',
    };
    
    setExportData(prev => {
      const filtered = prev.filter(item => item.type !== 'compare_bars_assets');
      return [...filtered, exportItem];
    });
    
    // Auto-include new plots
    setIncludedPlots(prev => {
      if (!prev.has('compare_bars_assets')) {
        const newSet = new Set(prev);
        newSet.add('compare_bars_assets');
        return newSet;
      }
      return prev;
    });
  }, [assetCompareData, showSentimentPlots, filters]);

  // Update asset bars interpretation when it changes
  useEffect(() => {
    if (!showSentimentPlots || !filters?.assets || filters.assets.length === 0) return;
    
    setExportData(prev => prev.map(item => 
      item.type === 'compare_bars_assets' 
        ? { ...item, interpretation: assetBarsInterpretation || '' }
        : item
    ));
  }, [assetBarsInterpretation, showSentimentPlots, filters]);

  // Add market bars plot to export data when drawn
  useEffect(() => {
    if (!marketCompareData || !showSentimentPlots || !filters?.markets || filters.markets.length === 0) {
      // Remove plot when hidden or data unavailable
      setExportData(prev => prev.filter(item => item.type !== 'compare_bars_markets'));
      setIncludedPlots(prev => {
        const newSet = new Set(prev);
        newSet.delete('compare_bars_markets');
        return newSet;
      });
      return;
    }
    
    const seriesData: any = {};
    const averages: { [key: string]: number } = {};
    Object.keys(marketCompareData).forEach(key => {
      const sentiments = marketCompareData[key].sentiments || [];
      const avg = sentiments.length > 0 
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
        : 0;
      averages[key] = avg;
      seriesData[key] = {
        dates: marketCompareData[key].dates,
        sentiments: marketCompareData[key].sentiments
      };
    });

    const exportItem = {
      type: 'compare_bars_markets',
      title: 'Average Sentiment Comparison - Markets',
      interpretation: marketBarsInterpretation || '',
      metrics: [
        { label: 'Markets', value: filters.markets.join(', ') },
        { label: 'Series Count', value: Object.keys(marketCompareData).length.toString() },
      ],
      seriesData: seriesData,
      averages: averages,
      category: 'Markets',
    };
    
    setExportData(prev => {
      const filtered = prev.filter(item => item.type !== 'compare_bars_markets');
      return [...filtered, exportItem];
    });
    
    // Auto-include new plots
    setIncludedPlots(prev => {
      if (!prev.has('compare_bars_markets')) {
        const newSet = new Set(prev);
        newSet.add('compare_bars_markets');
        return newSet;
      }
      return prev;
    });
  }, [marketCompareData, showSentimentPlots, filters]);

  // Update market bars interpretation when it changes
  useEffect(() => {
    if (!showSentimentPlots || !filters?.markets || filters.markets.length === 0) return;
    
    setExportData(prev => prev.map(item => 
      item.type === 'compare_bars_markets' 
        ? { ...item, interpretation: marketBarsInterpretation || '' }
        : item
    ));
  }, [marketBarsInterpretation, showSentimentPlots, filters]);

  // Add commodity bars plot to export data when drawn
  useEffect(() => {
    if (!commodityCompareData || !showSentimentPlots || !filters?.commodities || filters.commodities.length === 0) {
      // Remove plot when hidden or data unavailable
      setExportData(prev => prev.filter(item => item.type !== 'compare_bars_commodities'));
      setIncludedPlots(prev => {
        const newSet = new Set(prev);
        newSet.delete('compare_bars_commodities');
        return newSet;
      });
      return;
    }
    
    const seriesData: any = {};
    const averages: { [key: string]: number } = {};
    Object.keys(commodityCompareData).forEach(key => {
      const sentiments = commodityCompareData[key].sentiments || [];
      const avg = sentiments.length > 0 
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
        : 0;
      averages[key] = avg;
      seriesData[key] = {
        dates: commodityCompareData[key].dates,
        sentiments: commodityCompareData[key].sentiments
      };
    });

    const exportItem = {
      type: 'compare_bars_commodities',
      title: 'Average Sentiment Comparison - Commodities',
      interpretation: commodityBarsInterpretation || '',
      metrics: [
        { label: 'Commodities', value: filters.commodities.join(', ') },
        { label: 'Series Count', value: Object.keys(commodityCompareData).length.toString() },
      ],
      seriesData: seriesData,
      averages: averages,
      category: 'Commodities',
    };
    
    setExportData(prev => {
      const filtered = prev.filter(item => item.type !== 'compare_bars_commodities');
      return [...filtered, exportItem];
    });
    
    // Auto-include new plots
    setIncludedPlots(prev => {
      if (!prev.has('compare_bars_commodities')) {
        const newSet = new Set(prev);
        newSet.add('compare_bars_commodities');
        return newSet;
      }
      return prev;
    });
  }, [commodityCompareData, showSentimentPlots, filters]);

  // Update commodity bars interpretation when it changes
  useEffect(() => {
    if (!showSentimentPlots || !filters?.commodities || filters.commodities.length === 0) return;
    
    setExportData(prev => prev.map(item => 
      item.type === 'compare_bars_commodities' 
        ? { ...item, interpretation: commodityBarsInterpretation || '' }
        : item
    ));
  }, [commodityBarsInterpretation, showSentimentPlots, filters]);

  const handleDownloadPDF = async () => {
    if (exportData.length === 0) {
      alert('No data to export. Please add at least one plot with interpretation.');
      return;
    }

    // Filter by included plots
    const includedExportData = exportData.filter(item => includedPlots.has(item.type));
    
    if (includedExportData.length === 0) {
      alert('No plots selected for export. Please select at least one plot.');
      return;
    }

    setExportError(null);
    setLoadingPDF(true);
    try {
      // Convert data for API, ensuring dates are strings
      const exportDataForAPI = includedExportData.map((item: any) => {
        const convertedItem: any = {
          type: item.type,
          title: item.title,
          interpretation: item.interpretation || '',
          metrics: item.metrics.map((m: { label: string; value: string }) => ({ label: m.label, value: m.value })),
          ...(item.category && { category: item.category }),
        };

        // Convert seriesData dates to strings if present
        if (item.seriesData) {
          const convertedSeriesData: any = {};
          Object.keys(item.seriesData).forEach(key => {
            convertedSeriesData[key] = {
              dates: item.seriesData[key].dates.map((d: string | Date) => {
                if (d instanceof Date) {
                  return d.toISOString().slice(0, 10);
                }
                return typeof d === 'string' ? d : String(d);
              }),
              sentiments: item.seriesData[key].sentiments
            };
          });
          convertedItem.seriesData = convertedSeriesData;
        }

        // Add averages if present
        if (item.averages) {
          convertedItem.averages = item.averages;
        }

        return convertedItem;
      });

      const response = await fetch(`${API_BASE_URL}/api/sentiment/export_pdf`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exportData: exportDataForAPI }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setExportError('Please log in to export PDF.');
          return;
        }
        const errorText = await response.text();
        throw new Error(`Failed to generate PDF: ${response.statusText}. ${errorText}`);
      }

      setExportError(null);
      // Get PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sentiment_comparison_report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingPDF(false);
    }
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
                                <div className="mt-4">
                                  <label htmlFor="asset-lines-interpretation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter an interpretation
                                  </label>
                                  <textarea
                                    id="asset-lines-interpretation"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    rows={4}
                                    placeholder="Enter your interpretation of the sentiment by assets over time..."
                                    value={assetLinesInterpretation}
                                    onChange={(e) => setAssetLinesInterpretation(e.target.value)}
                                  />
                                </div>
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
                                <div className="mt-4">
                                  <label htmlFor="market-lines-interpretation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter an interpretation
                                  </label>
                                  <textarea
                                    id="market-lines-interpretation"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    rows={4}
                                    placeholder="Enter your interpretation of the sentiment by markets over time..."
                                    value={marketLinesInterpretation}
                                    onChange={(e) => setMarketLinesInterpretation(e.target.value)}
                                  />
                                </div>
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
                                <div className="mt-4">
                                  <label htmlFor="commodity-lines-interpretation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter an interpretation
                                  </label>
                                  <textarea
                                    id="commodity-lines-interpretation"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    rows={4}
                                    placeholder="Enter your interpretation of the sentiment by commodities over time..."
                                    value={commodityLinesInterpretation}
                                    onChange={(e) => setCommodityLinesInterpretation(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Average Sentiment Comparison - Assets */}
                            {filters?.assets && filters.assets.length > 0 && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Average Sentiment Comparison - Assets</h4>
                                <div className="text-center">
                                  <BarsCompare category="Assets" analysisData={assetCompareData ?? {}} />
                                </div>
                                <div className="mt-4">
                                  <label htmlFor="asset-bars-interpretation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter an interpretation
                                  </label>
                                  <textarea
                                    id="asset-bars-interpretation"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    rows={4}
                                    placeholder="Enter your interpretation of the average sentiment comparison for assets..."
                                    value={assetBarsInterpretation}
                                    onChange={(e) => setAssetBarsInterpretation(e.target.value)}
                                  />
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
                                <div className="mt-4">
                                  <label htmlFor="market-bars-interpretation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter an interpretation
                                  </label>
                                  <textarea
                                    id="market-bars-interpretation"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    rows={4}
                                    placeholder="Enter your interpretation of the average sentiment comparison for markets..."
                                    value={marketBarsInterpretation}
                                    onChange={(e) => setMarketBarsInterpretation(e.target.value)}
                                  />
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
                                <div className="mt-4">
                                  <label htmlFor="commodity-bars-interpretation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter an interpretation
                                  </label>
                                  <textarea
                                    id="commodity-bars-interpretation"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    rows={4}
                                    placeholder="Enter your interpretation of the average sentiment comparison for commodities..."
                                    value={commodityBarsInterpretation}
                                    onChange={(e) => setCommodityBarsInterpretation(e.target.value)}
                                  />
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
            summary={
              exportData.length > 0
                ? `${includedPlots.size} of ${exportData.length} plot(s) selected for export`
                : "Add plots with interpretations to export"
            }
          >
            <p className="text-gray-600 mb-4">
              Download your analysis results as a PDF report. Select which plots to include.
            </p>
            {exportError && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Log in required</h4>
                <p className="text-gray-700 mb-3">{exportError}</p>
                <a
                  href={loginUrl}
                  className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Log in
                </a>
              </div>
            )}
            {exportData.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Plots to Include:</h4>
                <div className="space-y-2">
                  {exportData.map((item) => (
                    <div key={item.type} className="hover:bg-gray-100 p-2 rounded">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includedPlots.has(item.type)}
                          onChange={(e) => {
                            setIncludedPlots(prev => {
                              const newSet = new Set(prev);
                              if (e.target.checked) {
                                newSet.add(item.type);
                              } else {
                                newSet.delete(item.type);
                              }
                              return newSet;
                            });
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex-1">{item.title}</span>
                        <span className={`text-xs px-2 py-1 rounded ${includedPlots.has(item.type) ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {includedPlots.has(item.type) ? 'Included' : 'Excluded'}
                        </span>
                      </label>
                      {!item.interpretation && (
                        <p className="text-xs text-amber-600 mt-1 ml-7">
                          No interpretation provided
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={handleDownloadPDF}
              disabled={exportData.length === 0 || includedPlots.size === 0 || loadingPDF}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating PDF...</span>
                </>
              ) : (
                'Download PDF'
              )}
            </button>
            {exportData.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No data to export. Please add at least one plot with an interpretation.
              </p>
            )}
            {exportData.length > 0 && includedPlots.size === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No plots selected. Please select at least one plot to export.
              </p>
            )}
          </CollapsibleSection>

        </div>
      </main>

      {/* Footer */}
      <Footer sidebarWidth={sidebarWidth} />
    </div>
  );
}
