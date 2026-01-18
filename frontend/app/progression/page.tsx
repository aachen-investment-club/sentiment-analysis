'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';
import ArticleUploader from '../components/ArticleUploader';
import ArticleSelector from '../components/ArticleSelector';
import CollapsibleSection from '../components/CollapsibleSection';
import SentimentProgression from '../components/SentimentProgression';
import SentimentAndVIX from '../components/SentimentAndVIX';

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
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [showSentimentPlot, setShowSentimentPlot] = useState(false);
  const [showVIXAnalysis, setShowVIXAnalysis] = useState(false);
  const [showSentimentVsAsset, setShowSentimentVsAsset] = useState(false);
  const [exportData, setExportData] = useState<any[]>([]);
  const [showExportToggle, setShowExportToggle] = useState(false);
  const [vixData, setVixData] = useState<{ dates: string[]; values: number[] } | null>(null);
  const [loadingVIX, setLoadingVIX] = useState(false);
  const [sentimentInterpretation, setSentimentInterpretation] = useState('');
  const [vixInterpretation, setVixInterpretation] = useState('');

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

  const handleSelectionRevert = () => {
    setSelectedArticles([]);
    setFilters({});
    setSelectionCommitted(false);
    // Also reset analysis state if analysis was started
    if (startAnalysis) {
      setStartAnalysis(false);
      setAnalysisData(null);
      setLoadingAnalysis(false);
      setShowSentimentPlot(false);
      setShowVIXAnalysis(false);
      setVixData(null);
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
      console.log(selectedArticles);

      const response = await fetch("http://localhost:8000/api/sentiment/start_analysis", {
        method: "POST", 
        headers: {
        "Content-Type": "application/json",
        }, 
        body: JSON.stringify(
          selectedArticles
        )
      })

      if (!response.ok){
        throw new Error(`Failed to fetch articles: ${response.statusText}`)
      }
      const data = await response.json()
      console.log(data.dates)
      console.log(data.sentiments)
      setAnalysisData(
      {
        dates: data.dates,
        sentiments: data.sentiments,
      }
      );
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Failed to start analysis. Please try again.');
    } finally {
      setLoadingAnalysis(false);
    }
  };


  // Auto-save sentiment progression to export data
  useEffect(() => {
    if (!analysisData || !showSentimentPlot) return;
    
    // Calculate metrics
    const avgSentiment = analysisData.sentiments.reduce((a, b) => a + b, 0) / analysisData.sentiments.length;
    const docCount = analysisData.sentiments.length;
    const sentimentLabel = avgSentiment > 0.1 ? "Positive" : avgSentiment < -0.1 ? "Negative" : "Neutral";
    
    const exportItem = {
      type: 'sentiment_progression',
      title: 'Sentiment over time',
      interpretation: sentimentInterpretation,
      metrics: [
        { label: 'Avg Sentiment', value: avgSentiment.toFixed(3) },
        { label: 'Documents', value: docCount.toString() },
        { label: 'Overall', value: sentimentLabel },
      ],
      dates: analysisData.dates,
      sentiments: analysisData.sentiments,
    };
    
    // Update or add the export item (replace if exists, otherwise add)
    setExportData(prev => {
      const filtered = prev.filter(item => item.type !== 'sentiment_progression');
      return [...filtered, exportItem];
    });
  }, [sentimentInterpretation, analysisData, showSentimentPlot]);

  // Auto-save VIX analysis to export data
  useEffect(() => {
    if (!analysisData || !vixData || !showVIXAnalysis) return;
    
    // Calculate metrics
    const avgSentiment = analysisData.sentiments.reduce((a, b) => a + b, 0) / analysisData.sentiments.length;
    const docCount = analysisData.sentiments.length;
    const sentimentLabel = avgSentiment > 0.1 ? "Positive" : avgSentiment < -0.1 ? "Negative" : "Neutral";
    
    // Calculate correlation
    const sentimentDates = analysisData.dates.map(d => {
      const date = d instanceof Date ? d : new Date(d);
      return date.getTime();
    });
    const vixTimestamps = vixData.dates.map(d => new Date(d).getTime());
    
    // Align VIX data to sentiment dates using forward fill
    const alignedVIX: number[] = [];
    for (let i = 0; i < sentimentDates.length; i++) {
      const sentimentTime = sentimentDates[i];
      let vixValue = null;
      for (let j = vixTimestamps.length - 1; j >= 0; j--) {
        if (vixTimestamps[j] <= sentimentTime) {
          vixValue = vixData.values[j];
          break;
        }
      }
      alignedVIX.push(vixValue !== null ? vixValue : 0);
    }
    
    // Calculate Pearson correlation
    const n = analysisData.sentiments.length;
    const meanSentiment = avgSentiment;
    const meanVIX = alignedVIX.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let sumSqSentiment = 0;
    let sumSqVIX = 0;
    
    for (let i = 0; i < n; i++) {
      if (alignedVIX[i] !== null && alignedVIX[i] !== 0) {
        const diffSentiment = analysisData.sentiments[i] - meanSentiment;
        const diffVIX = alignedVIX[i] - meanVIX;
        numerator += diffSentiment * diffVIX;
        sumSqSentiment += diffSentiment * diffSentiment;
        sumSqVIX += diffVIX * diffVIX;
      }
    }
    
    const denominator = Math.sqrt(sumSqSentiment * sumSqVIX);
    const correlation = denominator === 0 ? 0 : numerator / denominator;
    
    const exportItem = {
      type: 'sentiment_vix',
      title: 'Sentiment and VIX over time',
      interpretation: vixInterpretation,
      metrics: [
        { label: 'Correlation', value: correlation.toFixed(3) },
        { label: 'Avg Sentiment', value: avgSentiment.toFixed(3) },
        { label: 'Documents', value: docCount.toString() },
        { label: 'Overall', value: sentimentLabel },
      ],
      dates: analysisData.dates,
      sentiments: analysisData.sentiments,
      vixDates: vixData.dates,
      vixValues: vixData.values,
    };
    
    // Update or add the export item (replace if exists, otherwise add)
    setExportData(prev => {
      const filtered = prev.filter(item => item.type !== 'sentiment_vix');
      return [...filtered, exportItem];
    });
  }, [vixInterpretation, analysisData, vixData, showVIXAnalysis]);

  const handleDownloadPDF = async () => {
    if (exportData.length === 0) {
      alert('No data to export. Please add at least one plot with interpretation.');
      return;
    }

    try {
      // Convert dates to strings for JSON serialization
      const exportDataForAPI = exportData.map((item: any) => ({
        type: item.type,
        title: item.title,
        interpretation: item.interpretation || '',
        metrics: item.metrics.map((m: { label: string; value: string }) => ({ label: m.label, value: m.value })),
        dates: item.dates.map((d: string | Date) => {
          if (d instanceof Date) {
            return d.toISOString().slice(0, 10);
          }
          return typeof d === 'string' ? d : String(d);
        }),
        sentiments: item.sentiments,
        ...(item.vixDates && { vixDates: item.vixDates }),
        ...(item.vixValues && { vixValues: item.vixValues }),
      }));

      const response = await fetch('http://localhost:8000/api/sentiment/export_pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exportData: exportDataForAPI }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate PDF: ${response.statusText}. ${errorText}`);
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sentiment_analysis_report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFetchVIX = async () => {
    if (!analysisData || analysisData.dates.length === 0) {
      return;
    }

    setLoadingVIX(true);
    try {
      // Get the earliest date from analysis data
      const dates = analysisData.dates.map(d => {
        if (d instanceof Date) return d;
        return new Date(d);
      });
      const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const startDate = earliestDate.toISOString().slice(0, 10);

      const response = await fetch(`http://localhost:8000/api/sentiment/vix?start_date=${startDate}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch VIX data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setVixData(data);
    } catch (error) {
      console.error('Error fetching VIX data:', error);
      alert('Failed to fetch VIX data. Please try again.');
    } finally {
      setLoadingVIX(false);
    }
  };

  const handleToggleVIXAnalysis = () => {
    const newValue = !showVIXAnalysis;
    setShowVIXAnalysis(newValue);
    
    // Fetch VIX data when toggling on
    if (newValue && !vixData && analysisData) {
      handleFetchVIX();
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
            <h1 className="text-4xl sm:text-5xl font-bold text-black">
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
                : startAnalysis && analysisData
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
                    ) : analysisData ? (
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
                          <>
                            <SentimentProgression
                              dates={analysisData.dates}
                              sentiments={analysisData.sentiments}
                            />
                            <div className="mt-4">
                              <label htmlFor="sentiment-interpretation" className="block text-sm font-medium text-gray-700 mb-2">
                                Enter an interpretation
                              </label>
                              <textarea
                                id="sentiment-interpretation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                rows={4}
                                placeholder="Enter your interpretation of the sentiment progression..."
                                value={sentimentInterpretation}
                                onChange={(e) => setSentimentInterpretation(e.target.value)}
                              />
                            </div>
                          </>
                        )}

                        <div className="border-t border-gray-300"></div>

                        {/* VIX Analysis */}
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">Market Volatility Comparison</h3>
                          <button
                            onClick={handleToggleVIXAnalysis}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            disabled={loadingVIX}
                          >
                            {showVIXAnalysis ? 'Hide VIX Analysis' : 'Include VIX Analysis'}
                          </button>
                        </div>

                        {showVIXAnalysis && (
                          <div>
                            {loadingVIX ? (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-600 mb-4">Fetching VIX data...</p>
                                <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p>Loading VIX data...</p>
                                  </div>
                                </div>
                              </div>
                            ) : vixData && analysisData ? (
                              <>
                                <SentimentAndVIX
                                  dates={analysisData.dates}
                                  sentiments={analysisData.sentiments}
                                  vixDates={vixData.dates}
                                  vixValues={vixData.values}
                                />
                                <div className="mt-4">
                                  <label htmlFor="vix-interpretation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter an interpretation
                                  </label>
                                  <textarea
                                    id="vix-interpretation"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    rows={4}
                                    placeholder="Enter your interpretation of the sentiment and VIX comparison..."
                                    value={vixInterpretation}
                                    onChange={(e) => setVixInterpretation(e.target.value)}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-600 mb-4">Failed to load VIX data</p>
                                <button
                                  onClick={handleFetchVIX}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  Retry
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="border-t border-gray-300"></div>

                        {/* Sentiment vs Asset Comparison - Disabled for now */}
                        {false && (
                          <>
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
                                <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
                                  Sentiment vs Asset Chart Placeholder
                                </div>
                              </div>
                            )}

                            <div className="border-t border-gray-300"></div>
                          </>
                        )}

                        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                          Analysis complete!
                        </div>
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
                ? `${exportData.length} plot(s) ready for export`
                : "Add plots with interpretations to export"
            }
          >
            <p className="text-gray-600 mb-4">
              Download your analysis results as a PDF report. Make sure you have added plots with interpretations.
            </p>
            <button
              onClick={handleDownloadPDF}
              disabled={exportData.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
            {exportData.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No data to export. Please add at least one plot with an interpretation.
              </p>
            )}
          </CollapsibleSection>

        </div>
      </main>
    </div>
  );
}
