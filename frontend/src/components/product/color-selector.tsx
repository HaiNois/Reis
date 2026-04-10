import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_COLOR_HEX } from '@/config/product'

// ==================== TYPES ====================

export interface ColorOption {
  name: string
  hex: string
}

export interface ColorSelectorProps {
  colors: ColorOption[]
  selectedColor: string
  onColorChange: (color: string) => void
  availableColors?: Set<string>
  showLabel?: boolean
}

// ==================== LIGHT COLOR DETECTION ====================

// Light colors that need dark borders
const LIGHT_COLORS = new Set(['#ffffff', '#ffc0cb', '#d4c4a8', '#f5f5dc', '#faf0e6', '#fff8dc'])

// Determine if a color is light (needs dark border) or dark (needs light border)
function isLightColor(hex: string): boolean {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  // Calculate luminance (using relative luminance formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.6
}

// ==================== COLOR SELECTOR COMPONENT ====================

export function ColorSelector({
  colors,
  selectedColor,
  onColorChange,
  availableColors,
  showLabel = true,
}: ColorSelectorProps) {
  const { t } = useTranslation()

  // Check if a color is available
  const isAvailable = (colorName: string) => {
    if (!availableColors) return true
    return availableColors.has(colorName)
  }

  if (colors.length === 0) return null

  return (
    <div className="mb-6">
      {/* Label */}
      {showLabel && (
        <label className="block text-sm font-medium uppercase tracking-wider mb-3">
          {t('product.color')}:{' '}
          <span className="text-gray-500 font-normal normal-case">
            {selectedColor || t('product.selectColorFirst')}
          </span>
        </label>
      )}

      {/* Color swatches */}
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = selectedColor === color.name
          const isColorAvailable = isAvailable(color.name)
          const needsLightBorder = LIGHT_COLORS.has(color.hex.toLowerCase()) || isLightColor(color.hex)

          return (
            <button
              key={color.name}
              onClick={() => isColorAvailable && onColorChange(color.name)}
              disabled={!isColorAvailable}
              title={color.name}
              aria-label={`Color: ${color.name}${!isColorAvailable ? ' (out of stock)' : ''}`}
              className={`
                relative w-9 h-9 rounded-full border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                ${isSelected ? 'ring-2 ring-offset-2 ring-black scale-110' : ''}
                ${!isColorAvailable ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}
                ${needsLightBorder ? 'border-gray-300' : 'border-gray-900'}
              `}
              style={{ backgroundColor: color.hex }}
            >
              {/* Out of stock indicator */}
              {!isColorAvailable && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-full h-0.5 bg-gray-400 rotate-45 absolute" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ==================== COLOR EXTRACTION UTILITY ====================

/**
 * Extract unique colors from variant list
 */
export function extractColorsFromVariants(
  variants: Array<{ color: string; quantity?: number }>
): ColorOption[] {
  const colorMap = new Map<string, ColorOption>()

  variants.forEach((v) => {
    if (v.color && !colorMap.has(v.color)) {
      const hex =
        DEFAULT_COLOR_HEX[v.color.toLowerCase()] ||
        DEFAULT_COLOR_HEX[v.color.toLowerCase().replace(/\s+/g, '')] ||
        '#888888'

      colorMap.set(v.color, {
        name: v.color,
        hex,
      })
    }
  })

  return Array.from(colorMap.values())
}

/**
 * Get available colors (colors that have variants with quantity > 0)
 */
export function getAvailableColors(
  variants: Array<{ color: string; quantity?: number }>
): Set<string> {
  return new Set(
    variants
      .filter((v) => v.quantity > 0)
      .map((v) => v.color)
  )
}
