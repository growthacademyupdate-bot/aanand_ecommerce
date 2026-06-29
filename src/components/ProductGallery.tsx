/**
 * ============================================================
 * COMPONENT: ProductGallery
 * File: src/components/ProductGallery.tsx
 * ============================================================
 * Handles main image display + thumbnail navigation.
 * Only renders images for the currently selected color.
 * Uses Next.js <Image /> with priority loading for hero image.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';

const BLUR_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

export function preloadImage(src: string) {
  if (typeof window === 'undefined') return;
  if (!src) return;
  const img = new window.Image();
  img.src = src;
}

interface ProductGalleryProps {
  images: string[];           // Only the selected color's images
  productName: string;
  isChangingColor?: boolean;  // true while color switch animation plays
}

export default function ProductGallery({
  images,
  productName,
  isChangingColor = false,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [showAllThumbs, setShowAllThumbs] = useState(false);

  // ── Reset to first image when color changes ─────────────
  useEffect(() => {
    setSelectedIndex(0);
    setImgError({});
    setShowAllThumbs(false);

    const t = window.setTimeout(() => setShowAllThumbs(true), 1000);
    return () => window.clearTimeout(t);
  }, [images]);

  const mainImage = images[selectedIndex] || '/placeholder.svg';
  const validImages = images.filter((_, i) => !imgError[i]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    },
    [isZoomed]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Main Image ────────────────────────────────────── */}
      <div
        className={`
          relative aspect-[3/4] w-full rounded-2xl overflow-hidden
          bg-muted border border-border cursor-zoom-in
          transition-opacity duration-300
          ${isChangingColor ? 'opacity-40' : 'opacity-100'}
        `}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
      >
        <Image
          key={mainImage}                       // re-mount on image change = smooth fade
          src={imgError[selectedIndex] ? '/placeholder.svg' : mainImage}
          alt={`${productName} – view ${selectedIndex + 1}`}
          fill
          priority={selectedIndex === 0}        // only first image gets priority
          quality={80}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 520px"
          className={`
            object-cover transition-all duration-500 ease-out
            animate-in fade-in-0 zoom-in-105
            ${isZoomed ? 'scale-150' : 'scale-100'}
          `}
          style={
            isZoomed
              ? {
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                  transition: 'transform 0.1s ease-out',
                }
              : {}
          }
          onError={() => setImgError((prev) => ({ ...prev, [selectedIndex]: true }))}
        />

        {/* Zoom hint */}
        {!isZoomed && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <ZoomIn className="h-3 w-3" />
            Hover to zoom
          </div>
        )}

        {/* Discount badge (passed in via parent if needed) */}
      </div>

      {/* ── Thumbnails ────────────────────────────────────── */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(showAllThumbs ? images : images.slice(0, 2)).map((src, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`
                relative flex-shrink-0 w-[72px] h-[88px] rounded-xl overflow-hidden
                border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary
                ${
                  idx === selectedIndex
                    ? 'border-primary shadow-md shadow-primary/20 scale-105'
                    : 'border-border opacity-70 hover:opacity-100 hover:border-primary/50'
                }
              `}
            >
              <Image
                src={imgError[idx] ? '/placeholder.svg' : src}
                alt={`Thumbnail ${idx + 1}`}
                fill
                quality={50}            // low quality for thumbnails
                loading="lazy"          // always lazy for thumbnails
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="80px"
                className="object-cover"
                onError={() => setImgError((prev) => ({ ...prev, [idx]: true }))}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}