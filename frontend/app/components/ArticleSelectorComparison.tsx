'use client';

import { useState, useEffect } from 'react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { API_BASE_URL } from '../lib/api';

interface Article {
  title: string;
  date: string;
  source: string;
  assets: string[];
  commodities: string[];
  markets: string[];
  DocumentID?: string;
  file_name: string; 
  language: string;
}

interface Filters {
  assets?: string[];
  markets?: string[];
  commodities?: string[];
}


interface ArticleSelectorComparisonProps {
  onSelectionCommit: (articles: Article[], filters: Filters) => void;
  onSelectionRevert?: () => void;
  selectionCommitted: boolean;
}

export default function ArticleSelectorComparison({ onSelectionCommit, onSelectionRevert, selectionCommitted }: ArticleSelectorComparisonProps) {
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
  const [commitToggle, setCommitToggle] = useState(false);

  // Sync commitToggle with selectionCommitted prop
  useEffect(() => {
    setCommitToggle(selectionCommitted);
  }, [selectionCommitted]);

  // Fetch articles on mount
  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/articles`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the API response to match the Article interface
      // The API returns items with DocumentID (from DynamoDB primary key)
      const transformedArticles: Article[] = data.map((item: any) => ({
        DocumentID: item.DocumentID,
        title: item.title || '',
        date: item.date || '',
        source: item.source || '',
        assets: Array.isArray(item.assets) ? item.assets : [],
        commodities: Array.isArray(item.commodities) ? item.commodities : [],
        markets: Array.isArray(item.markets) ? item.markets : [],
        file_name: item.file_name || '',
        language: item.language || '',
      }));
      
      setArticles(transformedArticles);
      extractAvailableOptions(transformedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Show error to user - you might want to add a state for error messages
      setArticles([]);
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


  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleCommitSelection = () => {
    if (filteredArticles.length === 0) {
      alert('No articles found with the selected criteria!');
      return;
    }

    const filterSelection: Filters = {
      "assets": selectedAssets, 
      "commodities": selectedCommodities, 
      "markets": selectedMarkets, 
    };
    // Always commit all filtered articles (automatic selection)
    onSelectionCommit(filteredArticles, filterSelection);
    setCommitToggle(true);
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Filters (select at least one)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Articles matching any selected filter category will be included.
        </p>

        <div className="space-y-4">
          <MultiSelectDropdown
            label="Select assets to compare"
            options={availableAssets}
            selected={selectedAssets}
            onChange={setSelectedAssets}
            placeholder="Select assets"
          />

          <MultiSelectDropdown
            label="Select markets to compare"
            options={availableMarkets}
            selected={selectedMarkets}
            onChange={setSelectedMarkets}
            placeholder="Select markets"
          />

          <MultiSelectDropdown
            label="Select commodities to compare"
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
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Found {filteredArticles.length} article(s)
            </h3>
            {filteredArticles.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                All matching articles will be automatically selected for comparison.
              </p>
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
                  className="border border-gray-200 bg-white rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {article.title}
                      </h4>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Date: {article.date}</p>
                        <p>Source: {article.source}</p>

                        {article.assets?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-700">
                              Assets:
                            </span>
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

                        {article.commodities?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-700">
                              Commodities:
                            </span>
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

                        {article.markets?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs font-medium text-gray-700">
                              Markets:
                            </span>
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

      {/* Commit Selection Button */}
      {filteredArticles.length > 0 && (
        <div className="pt-4 border-t border-gray-300">
          {selectionCommitted ? (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Selection committed! You can now start the analysis.
                </p>
                <p className="text-xs text-green-700">
                  {filteredArticles.length} article(s) selected
                </p>
              </div>
              {onSelectionRevert && (
                <button
                  onClick={() => {
                    onSelectionRevert();
                    setCommitToggle(false);
                  }}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Revert Selection
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleCommitSelection}
              disabled={commitToggle}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Commit Selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
