'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js').then((mod) => mod.default), {
  ssr: false,
});


interface Filters {
  assets?: string[];
  markets?: string[];
  commodities?: string[];
}


interface AnalysisData {
  dates: (string | Date)[];
  sentiments: number[];
}

export default function SentimentProgression({ dates, sentiments }: AnalysisData) {
  
  const x = dates.map((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d));
  const hasData = x.length > 0 && sentiments.length > 0;

  // Calculate metrics
  const avgSentiment = hasData && sentiments.length > 0 
    ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
    : null;
  const docCount = hasData ? sentiments.length : 0;
  const sentimentLabel = avgSentiment !== null
    ? avgSentiment > 0.1 ? "Positive" : avgSentiment < -0.1 ? "Negative" : "Neutral"
    : null;

  return (
     <div className="bg-gray-50 rounded-lg p-4">
      <div className="bg-white rounded border border-gray-200 p-3">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div>
            <p className="text-lg font-medium text-black">Sentiment Over Time</p>
            <p className="text-sm text-gray-500">Average sentiment per date</p>
          </div>

          {hasData && (
            <div className="text-sm text-gray-600">
              Points: <span className="font-medium">{sentiments.length}</span>
            </div>
          )}
        </div>

        <div className="h-64">
          {hasData ? (
            <Plot
              data={[
                {
                  x,
                  y: sentiments,
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Sentiment",
                  hovertemplate:
                    "Date: %{x}<br>Sentiment: %{y:.3f}<extra></extra>",
                },
              ]}
              layout={{
                autosize: true,
                margin: { l: 50, r: 20, t: 10, b: 50 },
                xaxis: { title: "Date", type: "date" },
                yaxis: { title: "Sentiment score", range: [-1, 1] },
              }}
              config={{
                displayModeBar: false,
                responsive: true,
              }}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No data yet</p>
                <p className="text-sm">Run an analysis to see sentiment progression.</p>
              </div>
            </div>
          )}
        </div>

        {hasData && avgSentiment !== null && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Metric</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Average Sentiment</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-black">{avgSentiment.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Article Count</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-black">{docCount}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">Overall Sentiment</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-black">{sentimentLabel}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
