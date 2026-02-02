/**
 * Feature Flags Configuration
 * 
 * Central configuration for feature toggles.
 * All flags default to safe/stable values for production releases.
 * 
 * @version 2026-02-02
 */

// ============================================
// Image Optimization
// ============================================

/**
 * Supabase Image Transform Feature Flag
 * 
 * When enabled, uses Supabase's built-in image transformation API
 * for on-the-fly image resizing and optimization.
 * 
 * ⚠️ CAUTION: Requires Supabase Pro plan for production stability.
 * 
 * @default false - Safe default for release
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */
export const SUPABASE_IMAGE_TRANSFORM_ENABLED = false;

/**
 * Image optimization quality (1-100)
 * Only used when SUPABASE_IMAGE_TRANSFORM_ENABLED is true
 */
export const IMAGE_TRANSFORM_QUALITY = 80;

/**
 * Default thumbnail dimensions
 */
export const THUMBNAIL_SIZE = {
    width: 400,
    height: 300,
} as const;

// ============================================
// Performance / RPC Features
// ============================================

/**
 * nearby_facilities RPC Feature Flag
 * 
 * When enabled, uses the new nearby_facilities RPC for proximity searches.
 * Currently HOLD: Waiting for search_facilities_v2 performance analysis.
 * 
 * @default false - Pending EXPLAIN ANALYZE results
 * @see docs/03-analysis/final_release_verification.analysis.md
 */
export const NEARBY_FACILITIES_RPC_ENABLED = false;

// ============================================
// Debug / Development
// ============================================

/**
 * Enable verbose logging for image loading
 */
export const DEBUG_IMAGE_LOADING = false;

/**
 * Enable RPC performance logging
 */
export const DEBUG_RPC_PERFORMANCE = false;
