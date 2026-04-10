// ==================== PRODUCT CONSTANTS ====================

// Default hex values for common color names
export const DEFAULT_COLOR_HEX: Record<string, string> = {
  // Vietnamese
  trắng: '#ffffff',
  đen: '#000000',
  be: '#d4c4a8',
  'xanh navy': '#000080',
  navy: '#000080',
  'navy blue': '#000080',
  xám: '#808080',
  đỏ: '#ff0000',
  hồng: '#ffc0cb',
  xanh: '#008000',
  nâu: '#8b4513',
  cam: '#ffa500',
  tím: '#800080',
  vàng: '#ffff00',
  // English
  white: '#ffffff',
  black: '#000000',
  beige: '#d4c4a8',
  gray: '#808080',
  grey: '#808080',
  red: '#ff0000',
  pink: '#ffc0cb',
  green: '#008000',
  forest: '#228b22',
  brown: '#8b4513',
  orange: '#ffa500',
  purple: '#800080',
  yellow: '#ffff00',
  gold: '#ffd700',
  blue: '#0000ff',
  navyblue: '#000080',
  cream: '#f5f5dc',
  olive: '#808000',
  maroon: '#800000',
  burgundy: '#800020',
  teal: '#008080',
  coral: '#ff7f50',
  sage: '#9dc183',
  lavender: '#e6e6fa',
  mint: '#98ff98',
}

// Size ordering for sorting
export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const

// All possible sizes
export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const

// Sort sizes by predefined order
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.toUpperCase() as typeof SIZE_ORDER[number])
    const indexB = SIZE_ORDER.indexOf(b.toUpperCase() as typeof SIZE_ORDER[number])
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })
}

// Get hex from color name
export function getColorHex(colorName: string): string {
  return (
    DEFAULT_COLOR_HEX[colorName.toLowerCase()] ||
    DEFAULT_COLOR_HEX[colorName.toLowerCase().replace(/\s+/g, '')] ||
    '#888888'
  )
}
