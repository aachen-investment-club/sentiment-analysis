'use client';

import { useState } from 'react';
import TextInput from './TextInput';

interface DataInputProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export default function DataInput({ onAnalyze, isAnalyzing }: DataInputProps) {
  const [inputText, setInputText] = useState('');

  const handleAnalyze = () => {
    if (!inputText.trim()) {
      return;
    }
    
    onAnalyze(inputText);
  };

  const hasInput = inputText.trim().length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Data Input
      </h2>
      
      <div className="mb-6">
        <TextInput onTextChange={setInputText} />
      </div>

      {/* Single Analyze Button - Enabled when text entered */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleAnalyze}
          disabled={!hasInput || isAnalyzing}
          className={`
            px-8 py-3 rounded-lg font-medium text-white text-base
            transition-all duration-200 shadow-md
            ${hasInput && !isAnalyzing
              ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95 cursor-pointer' 
              : 'bg-gray-300 cursor-not-allowed opacity-60'
            }
          `}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </div>
    </div>
  );
}

