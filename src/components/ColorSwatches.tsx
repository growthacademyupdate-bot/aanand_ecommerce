/**
 * ============================================================
 * COMPONENT: ColorSwatches
 * File: src/components/ColorSwatches.tsx
 * ============================================================
 * Color selection UI with:
 * - Active state (checkmark border)
 * - Out-of-stock (greyed + "OUT" label)
 * - Smooth selection feedback
 */

'use client';

import { Check } from 'lucide-react';
import { preloadImage } from '@/components/ProductGallery';

interface ColorOption {
  colorName: string;
  stock: number;
  isOutOfStock: boolean;
}

interface ColorSwatchesProps {
  colors: ColorOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  variantFirstImages?: Array<string | undefined>;
}

/** Map common color names to CSS color values for the swatch dot */
const COLOR_MAP: Record<string, string> = {
  // Blues
  'shahi blue':  '#3B5FA0',
  'blue':        '#3B82F6',
  'navy':        '#1e3a5f',
  'sky blue':    '#87CEEB',
  // Greens
  'green':       '#16a34a',
  'olive':       '#6b7c1a',
  'mint':        '#a8d5ba',
  // Reds & Pinks
  'red':         '#dc2626',
  'deep red':    '#7f1d1d',
  'maroon':      '#800020',
  'pink':        '#ec4899',
  'rose':        '#fb7185',
  // Yellows & Oranges
  'mustard':     '#d4a017',
  'yellow':      '#eab308',
  'orange':      '#f97316',
  'saffron':     '#f4a233',
  // Purples
  'purple':      '#7c3aed',
  'lavender':    '#c4b5fd',
  'violet':      '#8b5cf6',
  // Neutrals
  'white':       '#f8f8f8',
  'cream':       '#fdf7e3',
  'beige':       '#f5f0e8',
  'grey':        '#9ca3af',
  'gray':        '#9ca3af',
  'black':       '#1a1a1a',
  'charcoal':    '#374151',
  // Warm tones
  'gold':        '#d4a017',
  'copper':      '#b87333',
  'rust':        '#b7410e',
  'brown':       '#92400e',
  'chocolate':   '#5c3317',
  // Teals
  'teal':        '#0d9488',
  'turquoise':   '#06b6d4',
  'peacock':     '#005f73',
};

function getSwatchColor(colorName: string): string {
  const key = colorName.toLowerCase().trim();
  return COLOR_MAP[key] || '#94a3b8'; // fallback: slate-400
}

export default function ColorSwatches({
  colors,
  selectedIndex,
  onSelect,
  variantFirstImages,
}: ColorSwatchesProps) {
  const selected = colors[selectedIndex];

  return (
    <div className="space-y-3">
      {/* Label with selected color name */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">Select Color:</span>
        {selected && (
          <span className="text-primary font-semibold">
            {selected.colorName}
          </span>
        )}
      </div>

      {/* Swatch grid */}
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color, idx) => {
          const isSelected = idx === selectedIndex;
          const isOut = color.isOutOfStock;
          const swatchBg = getSwatchColor(color.colorName);
          const prefetchSrc = variantFirstImages?.[idx];

          return (
            <button
              key={idx}
              onClick={() => !isOut && onSelect(idx)}
              onMouseEnter={() => {
                if (!isOut && prefetchSrc) preloadImage(prefetchSrc);
              }}
              disabled={isOut}
              title={isOut ? `${color.colorName} — Out of Stock` : color.colorName}
              className={`
                relative w-11 h-11 rounded-full transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                ${isOut
                  ? 'opacity-40 cursor-not-allowed grayscale'
                  : 'cursor-pointer hover:scale-110 hover:shadow-lg'
                }
                ${isSelected
                  ? 'ring-2 ring-primary ring-offset-2 scale-110'
                  : ''
                }
              `}
              style={{ backgroundColor: swatchBg }}
            >
              {/* Selected checkmark */}
              {isSelected && !isOut && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className="h-4 w-4 drop-shadow"
                    style={{
                      color: isLightColor(swatchBg) ? '#1a1a1a' : '#ffffff',
                      strokeWidth: 3,
                    }}
                  />
                </span>
              )}

              {/* Out of stock badge */}
              {isOut && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white/80 bg-black/40 rounded-full px-0.5 leading-tight">
                    OUT
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stock hint */}
      {selected && !selected.isOutOfStock && selected.stock <= 5 && (
        <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Only {selected.stock} left in stock — order soon!
        </p>
      )}
      {selected?.isOutOfStock && (
        <p className="text-xs text-destructive font-medium">
          This color is currently out of stock.
        </p>
      )}
    </div>
  );
}

// Helper: determine if a hex color is "light" to pick contrasting text
function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}