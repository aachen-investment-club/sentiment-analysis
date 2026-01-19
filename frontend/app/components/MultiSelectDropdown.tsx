'use client';

import { useState, useRef, useEffect } from 'react';

interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  label,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const displayText = selected.length > 0 
    ? `${selected.length} selected: ${selected.join(', ')}`
    : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-gray-500' : ''}>
          {displayText}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            <div className="py-1">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
