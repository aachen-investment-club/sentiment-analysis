'use client';

import { useState, useEffect } from 'react';
import Plot from "react-plotly.js";

interface SentimentAndVIXProps {
  dates: (string | Date)[];
  sentiments: number[];
  vixDates: string[];
  vixValues: number[];
}

export default function SentimentAndVIX({ dates, sentiments, vixDates, vixValues }: SentimentAndVIXProps) {
  const sentimentX = dates.map((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d));
  const hasData = sentimentX.length > 0 && sentiments.length > 0 && vixDates.length > 0 && vixValues.length > 0;

  // Calculate correlation
  const calculateCorrelation = () => {
    if (!hasData) return null;

    // Align VIX data to sentiment dates using forward fill
    const alignedVIX: number[] = [];
    const sentimentDates = sentimentX.map(d => new Date(d).getTime());
    const vixTimestamps = vixDates.map(d => new Date(d).getTime());

    for (let i = 0; i < sentimentDates.length; i++) {
      const sentimentTime = sentimentDates[i];
      // Find the closest VIX value (forward fill - use the most recent VIX value)
      let vixValue = null;
      for (let j = vixTimestamps.length - 1; j >= 0; j--) {
        if (vixTimestamps[j] <= sentimentTime) {
          vixValue = vixValues[j];
          break;
        }
      }
      alignedVIX.push(vixValue !== null ? vixValue : 0);
    }

    // Calculate Pearson correlation
    const n = sentiments.length;
    if (n === 0) return null;

    const meanSentiment = sentiments.reduce((a, b) => a + b, 0) / n;
    const meanVIX = alignedVIX.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumSqSentiment = 0;
    let sumSqVIX = 0;

    for (let i = 0; i < n; i++) {
      if (alignedVIX[i] !== null && alignedVIX[i] !== 0) {
        const diffSentiment = sentiments[i] - meanSentiment;
        const diffVIX = alignedVIX[i] - meanVIX;
        numerator += diffSentiment * diffVIX;
        sumSqSentiment += diffSentiment * diffSentiment;
        sumSqVIX += diffVIX * diffVIX;
      }
    }

    const denominator = Math.sqrt(sumSqSentiment * sumSqVIX);
    if (denominator === 0) return null;

    return numerator / denominator;
  };

  const correlation = calculateCorrelation();

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="bg-white rounded border border-gray-200 p-3">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div>
            <p className="text-lg font-medium text-black">Sentiment vs Market Volatility (VIX)</p>
            <p className="text-sm text-gray-500">Compare sentiment trends with VIX levels</p>
          </div>
          {hasData && correlation !== null && (
            <div className="text-sm text-gray-600">
              Correlation: <span className="font-medium">{correlation.toFixed(3)}</span>
            </div>
          )}
        </div>

        <div className="h-96">
          {hasData ? (
            <Plot
              data={[
                {
                  x: sentimentX,
                  y: sentiments,
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Sentiment Score",
                  yaxis: "y",
                  hovertemplate: "Date: %{x}<br>Sentiment: %{y:.3f}<extra></extra>",
                },
                {
                  x: vixDates,
                  y: vixValues,
                  type: "scatter",
                  mode: "lines",
                  name: "VIX",
                  yaxis: "y2",
                  opacity: 0.6,
                  hovertemplate: "Date: %{x}<br>VIX: %{y:.2f}<extra></extra>",
                },
              ]}
              layout={{
                autosize: true,
                margin: { l: 60, r: 60, t: 20, b: 60 },
                xaxis: { title: "Date", type: "date" },
                yaxis: {
                  title: "Sentiment Score",
                  range: [-1, 1],
                  side: "left",
                },
                yaxis2: {
                  title: "VIX Level",
                  overlaying: "y",
                  side: "right",
                },
                legend: {
                  x: 0.01,
                  y: 0.99,
                },
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
                <p className="text-sm">Fetching VIX data...</p>
              </div>
            </div>
          )}
        </div>

        {hasData && correlation !== null && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Sentiment–VIX Correlation:</span>{' '}
              {correlation.toFixed(3)}. Values range from -1 to 1. A negative correlation indicates that 
              higher VIX (volatility) corresponds to lower sentiment, and vice versa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
