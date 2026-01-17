
'use client';
import Plot from "react-plotly.js";

type SeriesPayload = {
  dates: (string | Date)[];
  sentiments: number[];
};

type ComparePayload = Record<string, SeriesPayload>;

interface LinesCompareProps {
  category: string;
  analysisData: ComparePayload; // e.g. { "asset1": { dates: [...], sentiments: [...] }, ... }
  items?: string[];            // optional: control order / subset of keys
}

export default function LinesCompare({
  category,
  analysisData,
  items,
}: LinesCompareProps) {
  const seriesNames =
    items && items.length > 0 ? items : Object.keys(analysisData ?? {});

  const traces = seriesNames
    .filter((name) => analysisData?.[name]) // ignore missing keys
    .map((name) => {
      const series = analysisData[name];

      const x = (series.dates ?? []).map((d) =>
        d instanceof Date ? d.toISOString().slice(0, 10) : d
      );

      const y = series.sentiments ?? [];

      return {
        x,
        y,
        type: "scatter" as const,
        mode: "lines+markers" as const,
        name,
        hovertemplate:
          `${category}: %{fullData.name}` +
          "<br>Date: %{x}" +
          "<br>Sentiment: %{y:.3f}<extra></extra>",
      };
    });

  const hasData = traces.some(
    (t) => (t.x?.length ?? 0) > 0 && (t.y?.length ?? 0) > 0
  );

  const totalPoints = traces.reduce((sum, t) => sum + (t.y?.length ?? 0), 0);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="bg-white rounded border border-gray-200 p-3">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div>
            <p className="text-lg font-medium">Sentiment Over Time</p>
            <p className="text-sm text-gray-500">
              Average sentiment per date — grouped by {category}
            </p>
          </div>

          {hasData && (
            <div className="text-sm text-gray-600">
              Series: <span className="font-medium">{traces.length}</span> ·
              Points: <span className="font-medium">{totalPoints}</span>
            </div>
          )}
        </div>

        <div className="h-64">
          {hasData ? (
            <Plot
              data={traces}
              layout={{
                autosize: true,
                margin: { l: 50, r: 20, t: 10, b: 60 },
                xaxis: { title: "Date", type: "date" },
                yaxis: { title: "Sentiment score", range: [-1, 1] },
                legend: { orientation: "h", x: 0, y: -0.25 },
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