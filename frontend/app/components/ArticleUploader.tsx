import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../lib/api';

interface ArticleUploaderProps {
  onUploadSuccess?: () => void;
}


type ArticleLabels = {
  markets: string[], 
  commodities: string[], 
  assets: string[]
}

export default function ArticleUploadForm({ onUploadSuccess }: ArticleUploaderProps) {
  const [articleData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: '',
    assets: [] as string[],
    commodities: [] as string[],
    markets: [] as string[],
    format: 'text',
    title: '',
    language: 'English',
    text: ''
  });

  const [prevTitle, setPrevTitle] = useState('');
  const [languageHint, setLanguageHint] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
  const [sentimentResult, setSentimentResult] = useState<{
    average: number;
    label: string;
    confidence: number;
  } | null>(null);

  // Mock data - replace with your actual data from backend
  

  const [articleLabels, setArticleLabels] = useState<ArticleLabels>({
    markets: [], 
    commodities: [], 
    assets: [], 
  })

  const [sources, setSources] = useState<string[]>([]);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const sourceComboboxRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetchCategories();
    //this is executed on mount 
  }, []);

  // Close source dropdown on outside click or Escape
  useEffect(() => {
    if (!sourceDropdownOpen) return;
    const handle = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setSourceDropdownOpen(false);
        return;
      }
      if (sourceComboboxRef.current && !sourceComboboxRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handle);
    };
  }, [sourceDropdownOpen]);

  const fetchCategories = async () => {
    try{
      setLoading(true); 
      const response = await fetch(`${API_BASE_URL}/articles/categories`)

      if (!response.ok){
        throw new Error(`Failed to fetch articles: ${response.statusText}`)
      }

      const data = await response.json()
      setArticleLabels(
        {
          markets: data.markets, 
          commodities: data. commodities, 
          assets: data.assets
        }
      )
      
      const response_sources = await fetch(`${API_BASE_URL}/articles/sources`)

      const data_sources = await response_sources.json();
      setSources(data_sources);

    } catch(error) {
      console.error("Error fetching categories", error);
    }finally{
      setLoading(false);
    }

  }



  // Auto-detect language (frontend-only for now)
  useEffect(() => {
    if (articleData.title && articleData.title !== prevTitle) {
      setPrevTitle(articleData.title);
      
      // Simple language detection based on common German words/characters
      const germanIndicators = /[äöüÄÖÜß]|der|die|das|und|ist|sind|für|mit|auf/i;
      const isGerman = germanIndicators.test(articleData.title);
      const detectedLang = isGerman ? 'German' : 'English';
      setFormData(prev => ({ ...prev, language: detectedLang }));
      setLanguageHint(`(Auto-detected: ${detectedLang})`);
    }
  }, [articleData.title, prevTitle]);

  

  const handleSelect = (field: 'assets' | 'commodities' | 'markets', value: string) => {
  if (!value) return;

  setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field]       
        : [...prev[field], value],
    }));
  };  


  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    // Validate required fields
    if (!articleData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!articleData.source.trim()) {
      setError('Source is required');
      setLoading(false);
      return;
    }

    if (!articleData.date) {
      setError('Reference date is required');
      setLoading(false);
      return;
    }

    if (articleData.assets.length === 0) {
      setError('At least one related asset is required');
      setLoading(false);
      return;
    }

    if (articleData.format === 'text' && !articleData.text.trim()) {
      setError('Article content is required');
      setLoading(false);
      return;
    }



    console.log('Article data (not sent to backend):', {
      date: articleData.date,
      assets: articleData.assets,
      commodities: articleData.commodities,
      markets: articleData.markets,
      source: articleData.source,
      title: articleData.title,
      language: articleData.language === 'English' ? 'en' : 'de',
      format: articleData.format,
      text: articleData.format === 'text' ? articleData.text : undefined,
    });



    
    setAnalyzingSentiment(true);
    const response = await fetch(`${API_BASE_URL}/articles/upload_article`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      date: articleData.date,
      assets: articleData.assets,
      commodities: articleData.commodities,
      markets: articleData.markets,
      source: articleData.source,
      title: articleData.title,
      language: articleData.language === 'English' ? 'en' : 'de',
      format: articleData.format,
      text: articleData.format === 'text' ? articleData.text : undefined,
      })
    })
    
    
    if (!response.ok) {
      setAnalyzingSentiment(false);
      setLoading(false);
      if (response.status === 401) {
        setError("Please log in to upload.");
        return;
      }
      const err = await response.json().catch(() => null);
      console.error("Upload failed:", response.status, err);
      setError(err?.detail ?? "Upload failed");
      return;
    }
    
    const result = await response.json();
    setAnalyzingSentiment(false);
    
    // Check if sentiment analysis was performed
    if (result.sentiment_analyzed && result.sentiment) {
      setSentimentResult({
        average: result.sentiment.average,
        label: result.sentiment.label,
        confidence: result.sentiment.confidence
      });
    }
    
    
    /* 
    console.log('Article data (not sent to backend):', {
      date: articleData.date,
      assets: articleData.assets,
      commodities: articleData.commodities,
      markets: articleData.markets,
      source: articleData.source,
      title: articleData.title,
      language: articleData.language === 'English' ? 'en' : 'de',
      format: articleData.format,
      text: articleData.format === 'text' ? articleData.text : undefined,
    });
    */

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      source: '',
      assets: [],
      commodities: [],
      markets: [],
      format: 'text',
      title: '',
      language: 'English',
      text: ''
    });
    setPrevTitle('');
    setLanguageHint('');
    // Refresh sources so the newly used source appears in suggestions next time
    const resSources = await fetch(`${API_BASE_URL}/articles/sources`);
    if (resSources.ok) {
      const next = await resSources.json();
      setSources(next);
    }
    // Show success message
    setUploadSuccess(true);
    if (onUploadSuccess) {
      onUploadSuccess();
    }
    setTimeout(() => {
      setUploadSuccess(false);
      setSentimentResult(null);
    }, 8000); // Increased timeout to show sentiment results longer
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
       
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Article Metadata</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
   
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={articleData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div ref={sourceComboboxRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-md border border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <input
                  type="text"
                  value={articleData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  onFocus={() => setSourceDropdownOpen(true)}
                  placeholder="Select or type a source"
                  className="flex-1 min-w-0 rounded-l-md border-0 py-2 px-3 text-gray-900 placeholder-gray-400 focus:ring-0"
                  aria-expanded={sourceDropdownOpen}
                  aria-haspopup="listbox"
                  aria-controls="source-listbox"
                  id="source-input"
                />
                <button
                  type="button"
                  onClick={() => setSourceDropdownOpen((open) => !open)}
                  className="flex items-center rounded-r-md border-l border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-label="Open source list"
                >
                  <svg
                    className={`h-5 w-5 transition-transform ${sourceDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {sourceDropdownOpen && (() => {
                const query = articleData.source.trim().toLowerCase();
                const filteredSources = query
                  ? sources.filter((s) => s.toLowerCase().includes(query))
                  : sources;
                return (
                  <ul
                    id="source-listbox"
                    role="listbox"
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg focus:outline-none"
                  >
                    {sources.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-gray-500">
                        No saved sources yet. Type a name above to add one.
                      </li>
                    ) : filteredSources.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-gray-500">
                        No matching source. Use the text above as a new source.
                      </li>
                    ) : (
                      filteredSources.map((source) => {
                        const isSelected = articleData.source === source;
                        return (
                          <li
                            key={source}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, source }));
                              setSourceDropdownOpen(false);
                            }}
                            className={`flex cursor-default items-center gap-2 px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                          >
                            {isSelected ? (
                              <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <span className="h-5 w-5 flex-shrink-0" aria-hidden />
                            )}
                            <span>{source}</span>
                          </li>
                        );
                      })
                    )}
                  </ul>
                );
              })()}
              <p className="mt-1 text-xs text-gray-500">
                Type to search saved sources, or click the arrow to see all. You can use new text as a source.
              </p>
            </div>
          </div>

        
          <div className="space-y-4">
            <div>

             

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Assets <span className="text-red-500">*</span>
              </label>

              <select
                value=""
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                onChange={(e) => handleSelect('assets', e.target.value)}
              >
                <option value="" className="text-gray-400">
                  Add Asset
                </option>
                {articleLabels.assets.map(c => (
                  <option
                    key={c}
                    value={c}
                    className="text-gray-900"
                  >
                    {c}
                  </option>
                ))}
              </select>
              {articleData.assets.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {articleData.assets.map(c => (
                    <span
                      key={c}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            assets: prev.assets.filter(x => x !== c),
                          }))
                        }
                        className="ml-1 hover:text-blue-900"
                        aria-label={`Remove ${c}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500 italic">
                  No assets selected. Please select at least one asset.
                </p>
              )}

            </div>

            <div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Commodities
              </label>

              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                onChange={(e) => handleSelect('commodities', e.target.value)}
              >
                <option value="" className="text-gray-400">
                  Add commodity
                </option>
                {articleLabels.commodities.map(c => (
                  <option
                    key={c}
                    value={c}
                    className="text-gray-900"
                  >
                    {c}
                  </option>
                ))}
              </select>
              {articleData.commodities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {articleData.commodities.map(c => (
                    <span
                      key={c}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            commodities: prev.commodities.filter(x => x !== c),
                          }))
                        }
                        className="ml-1 hover:text-blue-900"
                        aria-label={`Remove ${c}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

            </div>

            <div>

             

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Markets 
              </label>

              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                onChange={(e) => handleSelect('markets', e.target.value)}
              >
                <option value="" className="text-gray-400">
                  Add Market 
                </option>
                {articleLabels.markets.map(c => (
                  <option
                    key={c}
                    value={c}
                    className="text-gray-900"
                  >
                    {c}
                  </option>
                ))}
              </select>
              {articleData.markets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {articleData.markets.map(c => (
                    <span
                      key={c}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            markets: prev.markets.filter(x => x !== c),
                          }))
                        }
                        className="ml-1 hover:text-blue-900"
                        aria-label={`Remove ${c}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Format
              </label>
              <select
                value={articleData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="text">Text</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={articleData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Enter article title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language {languageHint && <span className="text-sm text-gray-500">{languageHint}</span>}
            </label>
            <select
              value={articleData.language}
              onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="English">English</option>
              <option value="German">German</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">Language is auto-detected from the title. You can override if incorrect.</p>
          </div>
        </div>

        <hr className="my-6 border-gray-300" />

    
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Article Content</h2>

        {articleData.format === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter article text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={articleData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              rows={10}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Paste or type article text here..."
            />
          </div>
        ) : (
          <div>
          option disabled
          </div>
        )}

        <hr className="my-6 border-gray-300" />

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p>{error}</p>
            {error === "Please log in to upload." && (
              <a
                href={`${API_BASE_URL}/login`}
                className="mt-2 inline-block font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Log in
              </a>
            )}
          </div>
        )}

        {analyzingSentiment && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing sentiment...
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            <div className="flex items-start">
              <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Article saved successfully!</p>
                {sentimentResult && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Sentiment Analysis Results:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Label: <span className="font-semibold">{sentimentResult.label}</span></li>
                      <li>Average Score: <span className="font-semibold">{sentimentResult.average.toFixed(3)}</span></li>
                      <li>Confidence: <span className="font-semibold">{sentimentResult.confidence.toFixed(1)}%</span></li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Save Article'}
        </button>
      </div>
    </div>
  );
}