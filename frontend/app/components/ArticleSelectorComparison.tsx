'use client';

import { useState, useEffect } from 'react';
import MultiSelectDropdown from './MultiSelectDropdown';

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

interface ArticleSelectorComparisonProps {
  onStartAnalysis: (articles: Article[], filters: Filters) => void;
  analysisStarted: boolean;
}

export default function ArticleSelectorComparison({ onStartAnalysis, analysisStarted }: ArticleSelectorComparisonProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date selection
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [startYear, setStartYear] = useState<number | ''>('');
  const [startMonth, setStartMonth] = useState<number | ''>('');
  const [endYear, setEndYear] = useState<number | ''>('');
  const [endMonth, setEndMonth] = useState<number | ''>('');

  // Filter options
  const [availableAssets, setAvailableAssets] = useState<string[]>([]);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [availableCommodities, setAvailableCommodities] = useState<string[]>([]);

  // Selected filters
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>([]);

  // Filtered articles
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Fetch articles on mount
  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/list-articles');
      // const data = await response.json();
      
      // Mock data for now
      const mockArticles: Article[] = [
        {
          title: 'Bitcoin Reaches New High',
          date: '2024-01-15',
          source: 'Reuters',
          assets: ['BTC', 'USD'],
          commodities: [],
          markets: ['Crypto', 'US'],
        },
        {
          title: 'Stock Market Analysis',
          date: '2024-02-01',
          source: 'Bloomberg',
          assets: ['SPY'],
          commodities: [],
          markets: ['US'],
        },
        {
          title: 'Ethereum Market Update',
          date: '2024-02-15',
          source: 'CoinDesk',
          assets: ['ETH'],
          commodities: [],
          markets: ['Crypto'],
        },
      ];
      
      setArticles(mockArticles);
      extractAvailableOptions(mockArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractAvailableOptions = (articleList: Article[]) => {
    const years = new Set<number>();
    const months = new Set<number>();
    const assets = new Set<string>();
    const markets = new Set<string>();
    const commodities = new Set<string>();

    articleList.forEach(article => {
      try {
        const date = new Date(article.date);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
          months.add(date.getMonth() + 1);
        }
      } catch (e) {
        // Skip invalid dates
      }

      article.assets?.forEach(a => assets.add(a));
      article.markets?.forEach(m => markets.add(m));
      article.commodities?.forEach(c => commodities.add(c));
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const sortedMonths = Array.from(months).sort((a, b) => a - b);
    
    setAvailableYears(sortedYears);
    setAvailableMonths(sortedMonths);
    setAvailableAssets(Array.from(assets).sort());
    setAvailableMarkets(Array.from(markets).sort());
    setAvailableCommodities(Array.from(commodities).sort());

    // Set default values
    if (sortedYears.length > 0 && !startYear) {
      setStartYear(sortedYears[0]);
      setEndYear(sortedYears[0]);
    }
    if (sortedMonths.length > 0 && !startMonth) {
      setStartMonth(sortedMonths[0]);
      setEndMonth(sortedMonths[0]);
    }
  };

  // Filter articles when date or filters change
  useEffect(() => {
    if (!startYear || !startMonth || !endYear || !endMonth) {
      setFilteredArticles([]);
      return;
    }

    const startDate = new Date(Number(startYear), Number(startMonth) - 1, 1);
    const endDate = new Date(Number(endYear), Number(endMonth), 0); // Last day of end month
    const selectedAssetsSet = new Set(selectedAssets);
    const selectedMarketsSet = new Set(selectedMarkets);
    const selectedCommoditiesSet = new Set(selectedCommodities);

    // Validate date range
    if (startDate > endDate) {
      setFilteredArticles([]);
      return;
    }

    const anyFilterSelected = selectedAssets.length > 0 || selectedMarkets.length > 0 || selectedCommodities.length > 0;

    const filtered = articles.filter(article => {
      try {
        const articleDate = new Date(article.date);
        if (articleDate < startDate || articleDate > endDate) {
          return false;
        }

        // UNION logic: article matches if it has ANY of the selected values across ANY category
        if (anyFilterSelected) {
          const articleAssets = new Set(article.assets || []);
          const articleMarkets = new Set(article.markets || []);
          const articleCommodities = new Set(article.commodities || []);

          const hasMatchingTag = (
            (selectedAssets.length > 0 && Array.from(selectedAssetsSet).some(asset => articleAssets.has(asset))) ||
            (selectedMarkets.length > 0 && Array.from(selectedMarketsSet).some(market => articleMarkets.has(market))) ||
            (selectedCommodities.length > 0 && Array.from(selectedCommoditiesSet).some(commodity => articleCommodities.has(commodity)))
          );

          if (!hasMatchingTag) {
            return false;
          }
        }

        return true;
      } catch (e) {
        return false;
      }
    });

    // Remove duplicates by title
    const uniqueArticles = filtered.filter((article, index, self) =>
      index === self.findIndex(a => a.title === article.title)
    );

    setFilteredArticles(uniqueArticles);
  }, [articles, startYear, startMonth, endYear, endMonth, selectedAssets, selectedMarkets, selectedCommodities]);

  // Handle select all toggle
  useEffect(() => {
    if (selectAll) {
      setSelectedArticles(new Set(filteredArticles.map(a => a.title)));
    } else {
      setSelectedArticles(new Set());
    }
  }, [selectAll, filteredArticles]);

  const toggleArticleSelection = (title: string) => {
    setSelectedArticles(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleStartAnalysis = () => {
    if (filteredArticles.length === 0) {
      alert('No articles found with the selected criteria!');
      return;
    }

    const selected = filteredArticles.filter(article =>
      selectedArticles.has(article.title)
    );
    
    const filters: Filters = {};
    if (selectedAssets.length > 0) filters.assets = selectedAssets;
    if (selectedMarkets.length > 0) filters.markets = selectedMarkets;
    if (selectedCommodities.length > 0) filters.commodities = selectedCommodities;

    // If no articles are explicitly selected, use all filtered articles
    const articlesToAnalyze = selected.length > 0 ? selected : filteredArticles;
    onStartAnalysis(articlesToAnalyze, filters);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Date Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Year
            </label>
            <select
              value={startYear}
              onChange={(e) => setStartYear(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select year</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Month
            </label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select month</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{monthNames[month - 1]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Year
            </label>
            <select
              value={endYear}
              onChange={(e) => setEndYear(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select year</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Month
            </label>
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Select month</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{monthNames[month - 1]}</option>
              ))}
            </select>
          </div>
        </div>

        {startYear && startMonth && endYear && endMonth && (
          <p className="mt-2 text-sm text-blue-600">
            Date range: {monthNames[Number(startMonth) - 1]} {startYear} to {monthNames[Number(endMonth) - 1]} {endYear}
          </p>
        )}

        {startYear && startMonth && endYear && endMonth && 
         new Date(Number(startYear), Number(startMonth) - 1, 1) > new Date(Number(endYear), Number(endMonth), 0) && (
          <p className="mt-2 text-sm text-red-600">
            Start date must be before or equal to end date!
          </p>
        )}
      </div>

      {/* Optional Filters */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Filters (optional)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Articles matching any selected filter category will be included.
        </p>

        <div className="space-y-4">
          <MultiSelectDropdown
            label="Select assets to compare (optional)"
            options={availableAssets}
            selected={selectedAssets}
            onChange={setSelectedAssets}
            placeholder="Select assets"
          />

          <MultiSelectDropdown
            label="Select markets to compare (optional)"
            options={availableMarkets}
            selected={selectedMarkets}
            onChange={setSelectedMarkets}
            placeholder="Select markets"
          />

          <MultiSelectDropdown
            label="Select commodities to compare (optional)"
            options={availableCommodities}
            selected={selectedCommodities}
            onChange={setSelectedCommodities}
            placeholder="Select commodities"
          />
        </div>

        {/* Active filters display */}
        {(selectedAssets.length > 0 || selectedMarkets.length > 0 || selectedCommodities.length > 0) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-semibold text-blue-900 mb-2">Active filters:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              {selectedAssets.length > 0 && (
                <li>• Assets: {selectedAssets.join(', ')}</li>
              )}
              {selectedMarkets.length > 0 && (
                <li>• Markets: {selectedMarkets.join(', ')}</li>
              )}
              {selectedCommodities.length > 0 && (
                <li>• Commodities: {selectedCommodities.join(', ')}</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Filtered Articles Display */}
      {startYear && startMonth && endYear && endMonth && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Found {filteredArticles.length} article(s)
            </h3>
            {filteredArticles.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => setSelectAll(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Select all filtered articles</span>
              </label>
            )}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
              No articles found with the selected criteria.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredArticles.map((article, index) => (
                <div
                  key={article.DocumentID || index}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedArticles.has(article.title)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedArticles.has(article.title)}
                      onChange={() => toggleArticleSelection(article.title)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{article.title}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Date: {article.date}</p>
                        <p>Source: {article.source}</p>
                        
                        {article.assets && article.assets.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-700">Assets:</span>
                            {article.assets.map(asset => (
                              <span
                                key={asset}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                              >
                                {asset}
                              </span>
                            ))}
                          </div>
                        )}

                        {article.commodities && article.commodities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-700">Commodities:</span>
                            {article.commodities.map(commodity => (
                              <span
                                key={commodity}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                              >
                                {commodity}
                              </span>
                            ))}
                          </div>
                        )}

                        {article.markets && article.markets.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-700">Markets:</span>
                            {article.markets.map(market => (
                              <span
                                key={market}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                              >
                                {market}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Start Analysis Button */}
      {filteredArticles.length > 0 && (
        <div className="pt-4 border-t border-gray-300">
          <button
            onClick={handleStartAnalysis}
            disabled={analysisStarted}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {analysisStarted ? 'Analysis Started' : 'Start Analysis'}
          </button>
        </div>
      )}
    </div>
  );
}
