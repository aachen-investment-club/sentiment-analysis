/**
 * LineChart Component
 * 
 * Displays sentiment trends over time. Supports single asset or multiple assets comparison.
 * Y-axis: -1 to +1 (negative to positive).
 * 
 * @props
 * - data: TimeSeriesData[] | MultiAssetData[] - Single asset data or multiple assets for comparison
 * - title?: string - Chart title
 * - targetId?: string - Unique ID for comment association
 * 
 * @interface TimeSeriesData
 * - timestamp: string - ISO date string (e.g., "2024-01-15")
 * - sentiment: number - Sentiment score from -1 to +1
 * - confidence?: number - Confidence score 0-100
 * 
 * @interface MultiAssetData
 * - asset: string - Asset identifier (e.g., "AAPL", "BTC")
 * - data: TimeSeriesData[] - Time series data for this asset
 */

