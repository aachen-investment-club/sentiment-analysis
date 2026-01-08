import React, { useState, useEffect } from 'react';

export default function ArticleUploadForm() {
  const [articleData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: 'Reuters',
    assets: [] as string[],
    commodities: [] as string[],
    markets: [] as string[],
    format: 'text',
    title: '',
    language: 'English',
    text: '',
    file: null as File | null
  });

  const [prevTitle, setPrevTitle] = useState('');
  const [languageHint, setLanguageHint] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with your actual data from backend
  const articleLabels = {
    assets: ['BTC', 'ETH', 'USD', 'EUR', 'Gold'],
    commodities: ['Oil', 'Gas', 'Wheat', 'Corn', 'Copper'],
    markets: ['US', 'EU', 'Asia', 'Crypto', 'Forex']
  };

  const sources = ['Reuters', 'Bloomberg', 'WSJ', 'Bitcoin.com News', 'Internal'];

  // Auto-detect language 
  useEffect(() => {
    const detectLanguage = async () => {
      if (articleData.title && articleData.title !== prevTitle) {
        setPrevTitle(articleData.title);
        
        try {
          const response = await fetch('/api/detect-language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: articleData.title })
          });
          
          if (response.ok) {
            const { isGerman } = await response.json();
            const detectedLang = isGerman ? 'German' : 'English';
            setFormData(prev => ({ ...prev, language: detectedLang }));
            setLanguageHint(`(Auto-detected: ${detectedLang})`);
          }
        } catch (err) {
          setLanguageHint('(Auto-detection unavailable)');
        }
      }
    };

    detectLanguage();
  }, [articleData.title, prevTitle]);

  const handleMultiSelect = (field: 'assets' | 'commodities' | 'markets', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, file }));
      setError('');
    } else if (file) {
      setError('Please upload a valid PDF file');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (articleData.format === 'text' && !articleData.text.trim()) {
      setError('Please enter article text');
      setLoading(false);
      return;
    }

    if (articleData.format === 'pdf' && !articleData.file) {
      setError('Please upload a PDF file');
      setLoading(false);
      return;
    }

    try {
      const languageCode = articleData.language === 'English' ? 'en' : 'de';
      
      if (articleData.format === 'text') {
        // Calls add_article_text via API
        const response = await fetch('/api/add-article-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: articleData.date,
            assets: articleData.assets,
            commodities: articleData.commodities,
            markets: articleData.markets,
            source: articleData.source,
            text: articleData.text,
            title: articleData.title,
            language: languageCode
          })
        });

        if (!response.ok) throw new Error('Upload failed');
      } else {
        // Calls add_article_pdf via API
        const articleDataToSend = new FormData();
        articleDataToSend.append('date', articleData.date);
        articleDataToSend.append('assets', JSON.stringify(articleData.assets));
        articleDataToSend.append('commodities', JSON.stringify(articleData.commodities));
        articleDataToSend.append('markets', JSON.stringify(articleData.markets));
        articleDataToSend.append('source', articleData.source);
        articleDataToSend.append('title', articleData.title);
        articleDataToSend.append('language', languageCode);
        if (articleData.file) {
          articleDataToSend.append('file', articleData.file);
        }

        const response = await fetch('/api/add-article-pdf', {
          method: 'POST',
          body: articleDataToSend
        });

        if (!response.ok) throw new Error('Upload failed');
      }

      setFormData({
        date: new Date().toISOString().split('T')[0],
        source: 'Reuters',
        assets: [],
        commodities: [],
        markets: [],
        format: 'text',
        title: '',
        language: 'English',
        text: '',
        file: null
      });
      setPrevTitle('');
      setLanguageHint('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save article. Please try again.');
    } finally {
      setLoading(false);
    }
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                value={articleData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="flex flex-wrap gap-2">
                {articleLabels.assets.map(asset => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => handleMultiSelect('assets', asset)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      articleData.assets.includes(asset)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Commodities
              </label>
              <div className="flex flex-wrap gap-2">
                {articleLabels.commodities.map(commodity => (
                  <button
                    key={commodity}
                    type="button"
                    onClick={() => handleMultiSelect('commodities', commodity)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      articleData.commodities.includes(commodity)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {commodity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Markets
              </label>
              <div className="flex flex-wrap gap-2">
                {articleLabels.markets.map(market => (
                  <button
                    key={market}
                    type="button"
                    onClick={() => handleMultiSelect('markets', market)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      articleData.markets.includes(market)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {market}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Format
              </label>
              <select
                value={articleData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste or type article text here..."
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF file
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer block">
                <div className="text-5xl mb-3">📤</div>
                <p className="text-sm text-gray-600">
                  {articleData.file ? (
                    <span className="text-green-600 font-medium">✓ {articleData.file.name}</span>
                  ) : (
                    <>Click to upload or drag and drop<br /><span className="text-xs">PDF files only</span></>
                  )}
                </p>
              </label>
            </div>
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