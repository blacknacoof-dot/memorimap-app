/**
 * OptimizedImage Component
 * 
 * A smart image component that optionally uses Supabase Image Transform
 * for on-the-fly optimization. Controlled by feature flag.
 * 
 * @version 2026-02-02
 */

import React, { useState, useCallback } from 'react';
import {
    SUPABASE_IMAGE_TRANSFORM_ENABLED,
    IMAGE_TRANSFORM_QUALITY,
    THUMBNAIL_SIZE
} from '../../lib/featureFlags';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    /** Use thumbnail size preset */
    thumbnail?: boolean;
    /** Lazy loading behavior */
    loading?: 'lazy' | 'eager';
    /** Fallback image on error */
    fallbackSrc?: string;
    /** Object fit style */
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

/**
 * Get optimized image URL using Supabase transform (if enabled)
 */
function getOptimizedUrl(
    src: string,
    width?: number,
    height?: number
): string {
    // Feature flag check - if disabled, return original URL
    if (!SUPABASE_IMAGE_TRANSFORM_ENABLED) {
        return src;
    }

    // Only transform Supabase storage URLs
    const supabaseStoragePattern = /supabase\.co\/storage\/v1\/object\/public\//;
    if (!supabaseStoragePattern.test(src)) {
        return src;
    }

    // Already has transform params? Skip
    if (src.includes('/render/image/')) {
        return src;
    }

    try {
        // Convert public URL to transform URL
        // From: .../storage/v1/object/public/bucket/path
        // To:   .../storage/v1/render/image/public/bucket/path?width=X&height=Y
        const transformUrl = src.replace(
            '/storage/v1/object/public/',
            '/storage/v1/render/image/public/'
        );

        const params = new URLSearchParams();
        if (width) params.set('width', width.toString());
        if (height) params.set('height', height.toString());
        params.set('quality', IMAGE_TRANSFORM_QUALITY.toString());
        params.set('format', 'webp');

        return `${transformUrl}?${params.toString()}`;
    } catch {
        return src;
    }
}

// Default fallback images by category hint
const DEFAULT_FALLBACKS: Record<string, string> = {
    funeral: '/images/defaults/funeral/funeral_1.webp',
    charnel: '/images/defaults/funeral/funeral_1.webp',
    natural: '/images/defaults/natural/natural_1.webp',
    cemetery: '/images/defaults/cemetery/cemetery_1.webp',
    default: '/images/defaults/funeral/funeral_1.webp',
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    width,
    height,
    className = '',
    thumbnail = false,
    loading = 'lazy',
    fallbackSrc,
    objectFit = 'cover',
}) => {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Determine dimensions
    const imgWidth = thumbnail ? THUMBNAIL_SIZE.width : width;
    const imgHeight = thumbnail ? THUMBNAIL_SIZE.height : height;

    // Get optimized URL
    const optimizedSrc = hasError
        ? (fallbackSrc || DEFAULT_FALLBACKS.default)
        : getOptimizedUrl(src, imgWidth, imgHeight);

    const handleError = useCallback(() => {
        if (!hasError) {
            setHasError(true);
        }
    }, [hasError]);

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div
            className={`optimized-image-wrapper relative overflow-hidden ${className}`}
            style={{
                width: imgWidth ? `${imgWidth}px` : '100%',
                height: imgHeight ? `${imgHeight}px` : 'auto',
            }}
        >
            {/* Loading skeleton */}
            {!isLoaded && (
                <div
                    className="absolute inset-0 bg-gray-200 animate-pulse"
                    aria-hidden="true"
                />
            )}

            <img
                src={optimizedSrc}
                alt={alt}
                loading={loading}
                onError={handleError}
                onLoad={handleLoad}
                className={`
          w-full h-full transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
                style={{ objectFit }}
                width={imgWidth}
                height={imgHeight}
            />
        </div>
    );
};

export default OptimizedImage;
