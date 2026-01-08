/**
 * BarChart Component
 * 
 * Displays sentiment comparison across multiple assets (stocks, crypto, commodities).
 * Bars show sentiment values (-1 to +1). Percentages available for detailed breakdown.
 * 
 * @props
 * - data: AssetComparisonData[] - Array of asset sentiment data
 * - title?: string - Chart title
 * - targetId?: string - Unique ID for comment association
 * - displayMode?: 'grouped' | 'stacked' - Show percentage breakdown (default: bars show sentiment only)
 * 
 * @interface AssetComparisonData
 * - asset: string - Asset identifier (e.g., "AAPL", "BTC", "Gold")
 * - sentiment: number - Overall sentiment score from -1 to +1 (primary visualization)
 * - positivePercentage?: number - Positive sentiment percentage 0-100 (optional, for breakdown)
 * - negativePercentage?: number - Negative sentiment percentage 0-100 (optional, for breakdown)
 * - neutralPercentage?: number - Neutral sentiment percentage 0-100 (optional, for breakdown)
 * - confidence?: number - Confidence score 0-100
 */

