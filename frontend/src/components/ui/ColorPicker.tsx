'use client'

import { useState, useId } from 'react'
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

// Map hex colors to human-readable names
const COLOR_NAMES: Record<string, string> = {
  '#EF4444': 'Red',
  '#F59E0B': 'Amber',
  '#10B981': 'Emerald',
  '#3B82F6': 'Blue',
  '#6366F1': 'Indigo',
  '#8B5CF6': 'Purple',
  '#EC4899': 'Pink',
  '#F43F5E': 'Rose',
  '#14B8A6': 'Teal',
  '#06B6D4': 'Cyan',
  '#84CC16': 'Lime',
  '#EAB308': 'Yellow',
  '#F97316': 'Orange',
  '#D946EF': 'Fuchsia',
  '#0EA5E9': 'Sky',
  '#A855F7': 'Violet',
}

export const ColorPicker = ({ value, onChange, label, error }: ColorPickerProps) => {
  const [showCustom, setShowCustom] = useState(false)
  const [customColor, setCustomColor] = useState(value || '#3B82F6')
  const labelId = useId()
  const errorId = useId()
  const colorPickerId = useId()
  const hexInputId = useId()

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
        <label id={labelId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* Preset Colors Grid */}
        <div
          className="grid grid-cols-8 gap-2"
          role="group"
          aria-labelledby={label ? labelId : undefined}
          aria-label={!label ? 'Color selection' : undefined}
        >
          {PRESET_COLORS.map((color) => {
            const colorName = COLOR_NAMES[color] || color
            const isSelected = value === color
            return (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                aria-label={`Select ${colorName} color`}
                aria-pressed={isSelected}
                className="relative w-10 h-10 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background"
                style={{ backgroundColor: color }}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white drop-shadow-lg" strokeWidth={3} aria-hidden="true" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Custom Color Section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            aria-expanded={showCustom}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCustom ? '← Volver a presets' : '+ Color personalizado'}
          </button>

          {showCustom && (
            <div className="flex gap-2 items-center p-3 bg-muted/50 rounded-lg border border-border">
              <input
                id={colorPickerId}
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                aria-label="Color picker"
                className="w-12 h-12 rounded cursor-pointer border-2 border-background shadow-sm"
              />
              <div className="flex-1">
                <label htmlFor={hexInputId} className="sr-only">Hex color value</label>
                <input
                  id={hexInputId}
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
                  aria-describedby={error ? errorId : undefined}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-input text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Selected Color Preview */}
        {value && !showCustom && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <div
              className="w-6 h-6 rounded border-2 border-border"
              style={{ backgroundColor: value }}
              aria-hidden="true"
            />
            <span className="font-mono">Selected: {COLOR_NAMES[value] || value}</span>
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-destructive text-sm mt-1" role="alert">{error}</p>
      )}
    </div>
  )
}
