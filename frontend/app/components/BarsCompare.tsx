'use client';

import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js').then((mod) => mod.default), {
  ssr: false,
});

type SeriesPayload = {
  dates: (string | Date)[];
  sentiments: number[];
};

type ComparePayload = Record<string, SeriesPayload>;

interface BarsCompareProps {
  category: string;
  analysisData: ComparePayload; // { "asset1": { dates: [...], sentiments: [...] }, ... }
  items?: string[];            // optional: order / subset of keys
}

export default function BarsCompare({ category, analysisData, items }: BarsCompareProps) {
  const seriesNames = items?.length ? items : Object.keys(analysisData ?? {});

  const labels: string[] = [];
  const averages: number[] = [];

  for (const name of seriesNames) {
    const series = analysisData?.[name];
    if (!series) continue;

    const vals = (series.sentiments ?? []).filter((v) => Number.isFinite(v));
    if (vals.length === 0) continue;

    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

    labels.push(name);
    averages.push(avg);
  }

  const hasData = labels.length > 0;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="bg-white rounded border border-gray-200 p-3">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div>
            <p className="text-lg font-medium">Average Sentiment Comparison</p>
            <p className="text-sm text-gray-500">
              Mean sentiment — grouped by {category}
            </p>
          </div>

          {hasData && (
            <div className="text-sm text-gray-600">
              Bars: <span className="font-medium">{labels.length}</span>
            </div>
          )}
        </div>

        <div className="h-64">
          {hasData ? (
            <Plot
              data={[
                {
                  x: labels,
                  y: averages,
                  type: "bar",
                  hovertemplate:
                    `${category}: %{x}` +
                    "<br>Average sentiment: %{y:.3f}<extra></extra>",
                },
              ]}
              layout={{
                autosize: true,
                margin: { l: 50, r: 20, t: 10, b: 80 },
                xaxis: { title: category, tickangle: -30 },
                yaxis: { title: "Average sentiment", range: [-1, 1] },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              No data to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
