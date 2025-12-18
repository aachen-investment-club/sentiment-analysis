'use client';

import { useState } from 'react';
import FileUpload from './FileUpload';
import TextInput from './TextInput';

export default function DataInput() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputText, setInputText] = useState('');

  const handleAnalyze = () => {
    // This should not be called if disabled, but double-check
    if (!selectedFile && !inputText.trim()) {
      return;
    }
    
    // TODO: Implement analysis logic
    console.log('Analyzing...', { file: selectedFile, text: inputText });
  };

  // Button is enabled if either PDF is loaded OR text field has content
  const hasInput = selectedFile !== null || inputText.trim().length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Data Input
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: File Upload */}
        <div>
          <FileUpload onFileSelect={setSelectedFile} />
        </div>

        {/* Right: Text Input */}
        <div>
          <TextInput onTextChange={setInputText} />
        </div>
      </div>

      {/* Single Analyze Button - Enabled when PDF loaded OR text entered */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleAnalyze}
          disabled={!hasInput}
          className={`
            px-8 py-3 rounded-lg font-medium text-white text-base
            transition-all duration-200 shadow-md
            ${hasInput 
              ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95 cursor-pointer' 
              : 'bg-gray-300 cursor-not-allowed opacity-60'
            }
          `}
        >
          Analyze Sentiment
        </button>
      </div>
    </div>
  );
}

