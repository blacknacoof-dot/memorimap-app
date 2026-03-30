/**
 * OptimizedImage Component
 * 
 * A smart image component that optionally uses Supabase Image Transform
 * for on-the-fly optimization. Controlled by feature flag.
 * 
 * @version 2026-02-02
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    SUPABASE_IMAGE_TRANSFORM_ENABLED,
    IMAGE_TRANSFORM_QUALITY,
    THUMBNAIL_SIZE
} from '../../lib/featureFlags';
import { supabase } from '../../lib/supabaseClient';
import { createSignedStorageImageUrl, type StorageImageBucket } from '../../lib/security/storageImage';

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
    storageBucket?: StorageImageBucket;
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
    storageBucket = 'facility-images',
}) => {
    const [hasError, setHasError] = useState(false);
    const [loadedSrc, setLoadedSrc] = useState('');
    const [resolvedSrc, setResolvedSrc] = useState(src);

    // Determine dimensions
    const imgWidth = thumbnail ? THUMBNAIL_SIZE.width : width;
    const imgHeight = thumbnail ? THUMBNAIL_SIZE.height : height;

    useEffect(() => {
        let cancelled = false;

        const resolveSource = async () => {
            if (hasError) {
                setResolvedSrc(fallbackSrc || DEFAULT_FALLBACKS.default);
                return;
            }

            if (!src) {
                setResolvedSrc(fallbackSrc || DEFAULT_FALLBACKS.default);
                return;
            }

            const isLocalAsset = src.startsWith('/') || src.startsWith('data:');
            if (isLocalAsset) {
                setResolvedSrc(src);
                return;
            }

            try {
                const signedUrl = await createSignedStorageImageUrl(
                    supabase,
                    storageBucket,
                    src,
                    60 * 60,
                    SUPABASE_IMAGE_TRANSFORM_ENABLED
                        ? {
                            width: imgWidth,
                            height: imgHeight,
                            quality: IMAGE_TRANSFORM_QUALITY,
                        }
                        : undefined,
                );

                if (!cancelled) {
                    setResolvedSrc(signedUrl);
                }
            } catch {
                if (!cancelled) {
                    setResolvedSrc(getOptimizedUrl(src, imgWidth, imgHeight));
                }
            }
        };

        void resolveSource();

        return () => {
            cancelled = true;
        };
    }, [fallbackSrc, hasError, imgHeight, imgWidth, src, storageBucket]);

    const handleError = useCallback(() => {
        if (!hasError) {
            setHasError(true);
        }
    }, [hasError]);

    const handleLoad = useCallback(() => {
        setLoadedSrc(resolvedSrc);
    }, [resolvedSrc]);

    const isLoaded = loadedSrc === resolvedSrc;

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
                key={resolvedSrc}
                src={resolvedSrc}
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
