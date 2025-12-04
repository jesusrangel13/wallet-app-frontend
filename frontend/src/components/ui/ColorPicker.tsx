'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  label?: string
  error?: string
}

const PRESET_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F43F5E', // rose
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#EAB308', // yellow
  '#F97316', // orange
  '#D946EF', // fuchsia
  '#0EA5E9', // sky
  '#A855F7', // violet
]

export const ColorPicker = ({ value, onChange, label, error }: ColorPickerProps) => {
  const [showCustom, setShowCustom] = useState(false)
  const [customColor, setCustomColor] = useState(value || '#3B82F6')

  const handlePresetClick = (color: string) => {
    onChange(color)
    setShowCustom(false)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    onChange(color)
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* Preset Colors Grid */}
        <div className="grid grid-cols-8 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              className="relative w-10 h-10 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ backgroundColor: color }}
              title={color}
            >
              {value === color && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white drop-shadow-lg" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom Color Section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showCustom ? '← Volver a presets' : '+ Color personalizado'}
          </button>

          {showCustom && (
            <div className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border-2 border-white shadow-sm"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomColor(val)
                    // Only update if valid hex
                    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) {
                      onChange(val)
                    }
                  }}
                  placeholder="#3B82F6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Selected Color Preview */}
        {value && !showCustom && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div
              className="w-6 h-6 rounded border-2 border-gray-200"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono">{value}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
