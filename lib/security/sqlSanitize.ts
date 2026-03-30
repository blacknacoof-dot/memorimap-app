/**
 * Search normalization helpers.
 * These helpers reduce free-text input to a constrained allowlist before it is
 * interpolated into Supabase ilike/or filter strings. Callers must still rely
 * on parameterized Supabase filters and RPCs for the actual query boundary.
 */

export function normalizeSearchInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    const dangerous = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/gi;
    const allowlistRemoved = /[^0-9a-zA-Z가-힣\s-]/g;

    return input
        .replace(dangerous, '')
        .replace(allowlistRemoved, '')
        .trim()
        .slice(0, 200);
}

export function createSafeIlikePattern(input: string): string {
    const normalized = normalizeSearchInput(input);
    return `%${normalized}%`;
}

export function buildSafeOrFilter(filters: string[]): string {
    const safeFilterPattern = /^(?:[a-z_]+)\.(?:ilike|eq)\.[0-9a-zA-Z가-힣%@._-]+$/;
    for (const filter of filters) {
        if (!safeFilterPattern.test(filter)) {
            throw new Error('Unsafe OR filter');
        }
    }
    return filters.join(',');
}

/** @deprecated Use normalizeSearchInput */
export const sanitizeSearchInput = normalizeSearchInput;
