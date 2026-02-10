/**
 * XSS Prevention Utilities
 * Phase 1-4: Security Hardening
 */

import DOMPurify from 'dompurify';

/**
 * XSS 공격 방지를 위한 HTML sanitization
 */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
        ALLOWED_ATTR: []
    });
}

/**
 * Plain text로 변환 (모든 HTML 제거)
 */
export function stripHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
}
