'use client';

import { useState } from 'react';

interface TextInputProps {
  onTextChange?: (text: string) => void;
}

export default function TextInput({ onTextChange }: TextInputProps) {
  const [text, setText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange?.(newText);
  };

  return (
    <div className="space-y-3">
      <label 
        htmlFor="text-input" 
        className="block text-sm font-medium text-gray-700"
      >
        Paste Text or URL for Analysis
      </label>
      <textarea
        id="text-input"
        value={text}
        onChange={handleChange}
        placeholder="Enter article text, a news URL, or a press release..."
        rows={6}
        className="
          w-full px-4 py-3 border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          resize-none text-sm text-gray-700
          placeholder:text-gray-400
          transition-all duration-200
        "
      />
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{text.length} characters</span>
        {text.length > 0 && (
          <button
            onClick={() => {
              setText('');
              onTextChange?.('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

