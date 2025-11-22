'use client';

import { useState, useCallback } from 'react';

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
        setSelectedFile(file);
        onFileSelect?.(file);
      } else {
        alert('Please upload a PDF file under 10MB');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
        setSelectedFile(file);
        onFileSelect?.(file);
      } else {
        alert('Please upload a PDF file under 10MB');
      }
    }
  }, [onFileSelect]);

  const handleClick = () => {
    document.getElementById('file-input')?.click();
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-all duration-200 ease-in-out
        ${dragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
        }
        ${selectedFile ? 'border-green-500 bg-green-50' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        id="file-input"
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center space-y-3">
        {/* Cloud Upload Icon */}
        <svg 
          className={`w-12 h-12 ${selectedFile ? 'text-green-500' : 'text-gray-400'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>

        {selectedFile ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-700">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                Drag & Drop PDF Files Here
              </p>
              <p className="text-sm text-gray-500">
                or Click to Browse
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Max size: 10MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}

