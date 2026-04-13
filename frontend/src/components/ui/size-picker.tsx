import { useState } from 'react'
import { ALL_SIZES, SIZE_ORDER } from '@/config/product'
import { ChevronDown, Check } from 'lucide-react'

interface SizePickerProps {
  value: string
  onChange: (size: string) => void
  allowCustom?: boolean
}

export function SizePicker({ value, onChange, allowCustom = false }: SizePickerProps) {
  const [open, setOpen] = useState(false)

  const sortedSizes = [...ALL_SIZES].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a as typeof SIZE_ORDER[number])
    const indexB = SIZE_ORDER.indexOf(b as typeof SIZE_ORDER[number])
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })

  const handleCustomSize = () => {
    const customSize = prompt('Enter custom size:')
    if (customSize?.trim()) {
      onChange(customSize.trim().toUpperCase())
      setOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
        >
          <span className={value ? '' : 'text-gray-400'}>
            {value || 'Select size'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[280px] overflow-hidden">
              <div className="max-h-[220px] overflow-y-auto">
                {sortedSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      onChange(size)
                      setOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                  >
                    <span>{size}</span>
                    {value === size && (
                      <Check className="w-4 h-4 text-black" />
                    )}
                  </button>
                ))}
                {allowCustom && (
                  <>
                    <div className="border-t my-1" />
                    <button
                      type="button"
                      onClick={handleCustomSize}
                      className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-gray-50"
                    >
                      <span>+ Add custom size</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
