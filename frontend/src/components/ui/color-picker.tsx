import { useState } from 'react'
import { getColorHex } from '@/config/product'
import { Label } from './label'
import { ChevronDown, Check } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

const COLORS = [
  // Vietnamese
  { name: 'trắng', label: 'Trắng' },
  { name: 'đen', label: 'Đen' },
  { name: 'be', label: 'Be' },
  { name: 'xám', label: 'Xám' },
  { name: 'nâu', label: 'Nâu' },
  { name: 'đỏ', label: 'Đỏ' },
  { name: 'hồng', label: 'Hồng' },
  { name: 'cam', label: 'Cam' },
  { name: 'vàng', label: 'Vàng' },
  { name: 'xanh', label: 'Xanh' },
  { name: 'xanh navy', label: 'Navy' },
  { name: 'tím', label: 'Tím' },
  // English
  { name: 'white', label: 'White' },
  { name: 'black', label: 'Black' },
  { name: 'beige', label: 'Beige' },
  { name: 'gray', label: 'Gray' },
  { name: 'brown', label: 'Brown' },
  { name: 'red', label: 'Red' },
  { name: 'pink', label: 'Pink' },
  { name: 'orange', label: 'Orange' },
  { name: 'yellow', label: 'Yellow' },
  { name: 'green', label: 'Green' },
  { name: 'blue', label: 'Blue' },
  { name: 'purple', label: 'Purple' },
  { name: 'cream', label: 'Cream' },
  { name: 'gold', label: 'Gold' },
  { name: 'burgundy', label: 'Burgundy' },
  { name: 'coral', label: 'Coral' },
  { name: 'lavender', label: 'Lavender' },
  { name: 'mint', label: 'Mint' },
  { name: 'sage', label: 'Sage' },
  { name: 'olive', label: 'Olive' },
  { name: 'maroon', label: 'Maroon' },
  { name: 'teal', label: 'Teal' },
]

export function ColorPicker({ value, onChange, label = 'Color' }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredColors = COLORS.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedColor = COLORS.find(c => c.name === value.toLowerCase())
  const selectedHex = getColorHex(value)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            {value && (
              <div
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: selectedHex }}
              />
            )}
            <span className={value ? 'capitalize' : 'text-gray-400'}>
              {selectedColor?.label || value || 'Select color'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[280px] overflow-hidden">
              <div className="p-2 border-b">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search color..."
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                {filteredColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      onChange(color.name)
                      setOpen(false)
                      setSearch('')
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: getColorHex(color.name) }}
                    />
                    <span className="flex-1 text-left">{color.label}</span>
                    {value.toLowerCase() === color.name && (
                      <Check className="w-4 h-4 text-black" />
                    )}
                  </button>
                ))}
                {filteredColors.length === 0 && (
                  <div className="px-3 py-2 text-gray-500 text-sm">No colors found</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
