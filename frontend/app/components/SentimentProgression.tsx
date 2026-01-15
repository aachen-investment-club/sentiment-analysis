'use client';

import { useState, useEffect } from 'react';

interface Filters {
  assets?: string[];
  markets?: string[];
  commodities?: string[];
}



export default function SentimentProgression() {
  


  return (
    <div className="bg-gray-50 rounded-lg p-4">
        <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-gray-400">
            <div className="text-center">
            <p className="text-lg font-medium mb-2">Sentiment Over Time Chart</p>
            <p className="text-sm">TEXT</p>
            </div>
        </div>
    </div>
  );
}
