/**
 * SQL Injection Prevention Utilities
 * Phase 1-4: Security Hardening
 */

/**
 * SQL Injection 방지를 위한 입력 검증
 */
export function sanitizeSearchInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // 위험한 SQL 키워드 제거
    const dangerous = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/gi;

    // 특수문자 이스케이핑 (%, _, ;, --, /*, */)
    return input
        .replace(dangerous, '')
        .replace(/[%_';\\]/g, '')
        .trim()
        .slice(0, 200); // 최대 길이 제한
}

/**
 * ILIKE 쿼리용 안전한 패턴 생성
 */
export function createSafeIlikePattern(input: string): string {
    const sanitized = sanitizeSearchInput(input);
    return `%${sanitized}%`;
}
