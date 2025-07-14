// Color palette for relationship edges
const RELATIONSHIP_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7', // Violet
  '#F43F5E', // Rose
  '#22C55E', // Green-500
  '#3B82F6', // Blue-500
  '#F59E0B', // Yellow-500
];

// Simple hash function to convert string to number
const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Get a consistent color for a table pair
export const getRelationshipColor = (fromTableId: string, toTableId: string): string => {
  // Create a consistent string representation of the table pair
  // Sort the IDs to ensure the same color regardless of direction
  const sortedIds = [fromTableId, toTableId].sort();
  const pairKey = sortedIds.join('-');
  
  // Hash the pair key and use it to select a color
  const hash = stringToHash(pairKey);
  const colorIndex = hash % RELATIONSHIP_COLORS.length;
  
  return RELATIONSHIP_COLORS[colorIndex];
};