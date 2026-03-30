/**
 * 인앱 브라우저 감지 및 외부 브라우저 안내 유틸리티
 */

import { logger } from '../../utils/logger';

export function isInAppBrowser(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = window.navigator.userAgent.toLowerCase();
    return (
        ua.includes('kakaotalk') ||
        ua.includes('naver') ||
        ua.includes('line') ||
        ua.includes('instagram') ||
        ua.includes('fban') ||
        ua.includes('fbav')
    );
}

export function getInAppBrowserName(): string | null {
    if (typeof window === 'undefined') return null;

    const ua = window.navigator.userAgent.toLowerCase();

    if (ua.includes('kakaotalk')) return 'kakaotalk';
    if (ua.includes('naver')) return 'naver';
    if (ua.includes('line')) return 'line';
    if (ua.includes('instagram')) return 'instagram';
    if (ua.includes('fban') || ua.includes('fbav')) return 'facebook';

    return null;
}

/**
 * redirect query 값은 동일 origin의 http(s) URL만 허용한다.
 * 외부 absolute URL, protocol-relative URL, javascript: URL은 모두 차단한다.
 */
export function normalizeSafeRedirectUrl(
    rawUrl: string | null | undefined,
    currentOrigin: string,
): string {
    if (!rawUrl) return currentOrigin;

    const trimmed = rawUrl.trim();
    if (!trimmed) return currentOrigin;
    if (trimmed.startsWith('//')) {
        logger.warn('Redirect validation failed', { code: 'INVALID_REDIRECT', reason: 'protocol_relative' });
        return currentOrigin;
    }
    if (/^javascript:/i.test(trimmed)) {
        logger.warn('Redirect validation failed', { code: 'INVALID_REDIRECT', reason: 'javascript_scheme' });
        return currentOrigin;
    }
    if (trimmed.includes(':') && !/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) {
        logger.warn('Redirect validation failed', { code: 'INVALID_REDIRECT', reason: 'unsupported_scheme' });
        return currentOrigin;
    }

    try {
        const parsed = new URL(trimmed, currentOrigin);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            logger.warn('Redirect validation failed', { code: 'INVALID_REDIRECT', reason: 'invalid_protocol' });
            return currentOrigin;
        }
        if (parsed.origin !== currentOrigin) {
            logger.warn('Redirect validation failed', { code: 'INVALID_REDIRECT', reason: 'cross_origin' });
            return currentOrigin;
        }
        return parsed.toString();
    } catch {
        logger.warn('Redirect validation failed', { code: 'INVALID_REDIRECT', reason: 'parse_error' });
        return currentOrigin;
    }
}

export function openInExternalBrowser(url: string = window.location.href) {
    if (typeof window === 'undefined') return;

    const browserName = getInAppBrowserName();
    if (!browserName) return;

    const safeUrl = normalizeSafeRedirectUrl(url, window.location.origin);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isIOS) {
        return;
    }

    const cleanUrl = safeUrl.replace(/https?:\/\//, '');
    const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
}

export function redirectToExternalBrowserIfNeeded(): boolean {
    if (!isInAppBrowser()) {
        return false;
    }

    if (typeof window === 'undefined') return false;

    const currentUrl = window.location.href;
    if (currentUrl.includes('/external-browser-guide')) {
        return true;
    }

    const browserName = getInAppBrowserName();
    window.location.href = `/#/external-browser-guide?browser=${browserName}&redirect=${encodeURIComponent(currentUrl)}`;
    return true;
}

export function getBrowserInfo() {
    if (typeof window === 'undefined') return {};

    return {
        ua: window.navigator.userAgent,
        isInApp: isInAppBrowser(),
        browserName: getInAppBrowserName(),
        platform: window.navigator.platform,
        language: window.navigator.language,
        timestamp: new Date().toISOString(),
    };
}
