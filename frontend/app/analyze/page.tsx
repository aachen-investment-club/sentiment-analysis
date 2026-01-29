'use client';

import { useState, useEffect } from 'react';
import DataInput from '../components/DataInput';
import OverallSentiment from '../components/OverallSentiment';
import DetailedSentimentBreakdown from '../components/DetailedSentimentBreakdown';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../components/SidebarContext';
import Footer from '../components/Footer';
import AuthButton from '../components/AuthButton';
import { API_BASE_URL } from '../lib/api';

const backendBase = API_BASE_URL;
const loginUrl = `${backendBase}/login`;

interface AnalysisResult {
  overall_sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;
  sentences: Array<{
    text: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    confidence: number;
    score: number;
  }>;
  total_sentences: number;
  detected_language: 'de' | 'en';
}

export default function AnalyzePage() {
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${backendBase}/user`, {
          credentials: 'include',
        });
        if (!cancelled) {
          setIsAuthenticated(res.ok);
        }
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAnalyze = async (text: string) => {
    if (!text.trim()) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/articles/analyze`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          alert('Please log in to analyze text.');
          return;
        }
        throw new Error(`Failed to analyze: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error('Error analyzing text:', error);
      alert('Failed to analyze text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Header Section with Subtle Background */}
      <header className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all duration-300 ${sidebarWidth}`}>
        <div className="w-full px-4 sm:px-6 py-8 sm:py-12">
          {/* Auth Button - Full width row, button at right edge */}
          <div className="w-full flex justify-end mb-4 pr-0">
            <AuthButton />
          </div>
          <div className="mx-auto max-w-full lg:max-w-4xl xl:max-w-5xl">
            {/* Title and Description - Centered */}
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Financial Sentiment Analyzer
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                Quickly analyze sentiment of documents, news articles, or text snippets.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full px-4 sm:px-6 py-8 sm:py-16 transition-all duration-300 ${sidebarWidth}`}>
        <div className="mx-auto space-y-6 sm:space-y-8 max-w-full lg:max-w-4xl xl:max-w-5xl">
          
          {!authChecked && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center text-gray-600">
              Checking authentication...
            </div>
          )}

          {authChecked && !isAuthenticated && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Log in required</h2>
              <p className="text-gray-700 mb-4">
                You must be signed in to analyze text.
              </p>
              <a
                href={loginUrl}
                className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Log in
              </a>
            </div>
          )}

          {authChecked && isAuthenticated && (
            <>
              <DataInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
            
              {/* Sentiment Results Section */}
              {analysisResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Overall Sentiment */}
                  <OverallSentiment
                    sentiment={analysisResult.overall_sentiment}
                    confidence={analysisResult.confidence}
                    positivePercentage={analysisResult.positive_percentage}
                    negativePercentage={analysisResult.negative_percentage}
                    neutralPercentage={analysisResult.neutral_percentage}
                  />
                  
                  {/* Right Column: Detailed Sentiment Breakdown */}
                  <DetailedSentimentBreakdown sentences={analysisResult.sentences} topK={5} />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer sidebarWidth={sidebarWidth} />
    </div>
  );
}

