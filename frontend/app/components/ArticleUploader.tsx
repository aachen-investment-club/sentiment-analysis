import React, { useState, useEffect } from 'react';
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
    source: 'Reuters',
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

  // Mock data - replace with your actual data from backend
  

  const [articleLabels, setArticleLabels] = useState<ArticleLabels>({
    markets: [], 
    commodities: [], 
    assets: [], 
  })

  const [sources, setSources] = useState<string[]>([])


  useEffect(() => {
    fetchCategories();
    //this is executed on mount 
  }, []);

  const fetchCategories = async () => {
    try{
      setLoading(true); 
      const response = await fetch(`${API_BASE_URL}/api/articles/categories`)

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
      
      const response_sources = await fetch(`${API_BASE_URL}/api/articles/sources`)

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

    if (articleData.format === 'text' && !articleData.text.trim()) {
      setError('Please enter article text');
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



    
    const response = await fetch(`${API_BASE_URL}/api/articles/upload_article`, {
      method: "POST", 
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
    
    
    if (!response.ok){
       const err = await response.json().catch(() => null);
      console.error("Upload failed:", response.status, err);
      throw new Error("Upload failed");
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
      source: 'Reuters',
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
    
    // Show hardcoded success message
    setUploadSuccess(true);
    if (onUploadSuccess) {
      onUploadSuccess();
    }
    setTimeout(() => setUploadSuccess(false), 3000);
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
                Reference Date
              </label>
              <input
                type="date"
                value={articleData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                value={articleData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>

        
          <div className="space-y-4">
            <div>

             

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Assets 
              </label>

              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                onChange={(e) => handleSelect('assets', e.target.value)}
              >
                <option value="" className="text-gray-400">
                  Add Market 
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
              {articleData.assets.length > 0 && (
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
              Article Title
            </label>
            <input
              type="text"
              value={articleData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
              Enter article text
            </label>
            <textarea
              value={articleData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              rows={10}
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
            {error}
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            ✓ Article saved successfully!
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