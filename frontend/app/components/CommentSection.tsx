/**
 * CommentSection Component
 * 
 * Interactive comment/note system for visualizations. Comments persist to localStorage.
 * 
 * @props
 * - targetId: string - Unique ID linking comments to a visualization
 * - comments?: Comment[] - Existing comments array
 * - onSave?: (comment: string) => void - Save callback
 * 
 * @interface Comment
 * - id: string
 * - text: string
 * - timestamp: Date | string
 */