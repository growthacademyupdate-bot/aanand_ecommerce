'use client';

import { useState } from 'react';
import { Shirt } from 'lucide-react';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  disabled?: boolean;
  className?: string;
}

const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSizeSelect,
  disabled = false,
  className = '',
}) => {
  if (!sizes || sizes.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Shirt className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Size</label>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => !disabled && onSizeSelect(size)}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all hover:scale-105 ${
              selectedSize === size
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 hover:bg-muted'
            } ${
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      {!selectedSize && !disabled && (
        <p className="text-xs text-destructive mt-1">Please select a size</p>
      )}
    </div>
  );
};

export default SizeSelector;
