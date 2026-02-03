/**
 * 인앱 브라우저 감지 및 처리 유틸리티
 * Kakao, Naver, Line, Instagram, Facebook 등 인앱 브라우저를 감지하고
 * 외부 브라우저(Chrome, Safari 등)로 이탈을 유도합니다.
 */

/**
 * 현재 브라우저가 인앱 브라우저인지 확인합니다.
 */
export function isInAppBrowser(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = window.navigator.userAgent.toLowerCase();
    // console.log("🕵️ [BrowserDetection] UserAgent:", ua);

    const isInApp = (
        ua.includes('kakaotalk') ||
        ua.includes('naver') ||
        ua.includes('line') ||
        ua.includes('instagram') ||
        ua.includes('fban') || // Facebook for Android
        ua.includes('fbav')    // Facebook for iOS
    );

    // console.log("🕵️ [BrowserDetection] isInAppBrowser:", isInApp);
    return isInApp;
}

/**
 * 인앱 브라우저의 종류를 반환합니다.
 */
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
 * 현재 페이지를 외부 브라우저에서 열도록 시도합니다.
 * (iOS는 불가능하므로 안내 페이지로 유도해야 함)
 */
export function openInExternalBrowser(url: string = window.location.href) {
    if (typeof window === 'undefined') return;

    const browserName = getInAppBrowserName();
    if (!browserName) return; // 일반 브라우저면 중단

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isIOS) {
        // iOS: location.href 변경만으로는 Safari로 나갈 수 없음 (정책 제한)
        // 따라서 이 함수는 Android를 위한 것이며, iOS는 안내 페이지를 보여줘야 함.
        // 하지만 만약 강제 시도가 필요하다면 아래와 같이 시도할 수 있음:
        // window.location.href = url; (대부분 막힘)
        return;
    } else {
        // Android: Chrome Intent 사용
        // intent://스킴을 사용하면 안드로이드 시스템이 해당 앱을 찾거나 마켓으로 이동시킴
        // 여기서는 브라우저(Chrome)로 열기를 유도
        const cleanUrl = url.replace(/https?:\/\//, '');
        const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;

        window.location.href = intentUrl;
    }
}

/**
 * 인앱 브라우저라면 안내 페이지로 리다이렉트합니다.
 * Android는 바로 외부 브라우저 띄우기를 시도하고, iOS는 안내 페이지로 보냅니다.
 * 반환값: 리다이렉트 수행 여부 (true/false)
 */
export function redirectToExternalBrowserIfNeeded(): boolean {
    if (!isInAppBrowser()) {
        return false;
    }

    if (typeof window === 'undefined') return false;

    const currentUrl = window.location.href;

    // 이미 안내 페이지라면 무한루프 방지
    if (currentUrl.includes('/external-browser-guide')) {
        return true;
    }

    const browserName = getInAppBrowserName();

    // iOS/Android 모두 일단 안내 페이지로 보냅니다. (HashRouter 대응)
    window.location.href = `/#/external-browser-guide?browser=${browserName}&redirect=${encodeURIComponent(currentUrl)}`;
    return true;
}
/**
 * 디버깅을 위해 브라우저 정보를 반환합니다.
 */
export function getBrowserInfo() {
    if (typeof window === 'undefined') return {};

    return {
        ua: window.navigator.userAgent,
        isInApp: isInAppBrowser(),
        browserName: getInAppBrowserName(),
        platform: window.navigator.platform,
        language: window.navigator.language,
        timestamp: new Date().toISOString()
    };
}
