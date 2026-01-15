import React, { useState, useEffect } from 'react';

interface ArticleUploaderProps {
  onUploadSuccess?: () => void;
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
    setFormData(prev => ({
      ...prev,
      [field]: value ? [value] : []
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

    // Simulate upload delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Hardcoded success - no actual API call
    // TODO: Replace with actual API calls when backend is ready
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
      file: articleData.format === 'pdf' ? articleData.file?.name : undefined
    });

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
      text: '',
      file: null
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
                value={articleData.assets.length > 0 ? articleData.assets[0] : ''}
                onChange={(e) => handleSelect('assets', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Select asset</option>
                {articleLabels.assets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Commodities
              </label>
              <select
                value={articleData.commodities.length > 0 ? articleData.commodities[0] : ''}
                onChange={(e) => handleSelect('commodities', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Select commodity</option>
                {articleLabels.commodities.map(commodity => (
                  <option key={commodity} value={commodity}>{commodity}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Markets
              </label>
              <select
                value={articleData.markets.length > 0 ? articleData.markets[0] : ''}
                onChange={(e) => handleSelect('markets', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Select market</option>
                {articleLabels.markets.map(market => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
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