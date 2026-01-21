/**
 * 에러 로깅 유틸 - 순수 추가 (기존 코드 영향 없음)
 * Phase 3: Error Handling Enhancement
 */

export enum ErrorSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL'
}

interface LogContext {
    userId?: string;
    action?: string;
    metadata?: Record<string, any>;
}

/**
 * 에러 로깅 함수 (개발 환경에서만 작동)
 */
export function logError(
    error: any,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: LogContext
): void {
    if (import.meta.env.DEV) {
        const emoji = severity === ErrorSeverity.CRITICAL ? '🔴' :
            severity === ErrorSeverity.ERROR ? '❌' :
                severity === ErrorSeverity.WARNING ? '⚠️' : 'ℹ️';

        console.group(`${emoji} [${severity}]`);
        console.error('Error:', error?.message || error);
        if (context) console.info('Context:', context);
        console.groupEnd();
    }
}

/**
 * 정보성 로그 (개발 환경에서만)
 */
export function logInfo(message: string, context?: LogContext): void {
    if (import.meta.env.DEV) {
        console.log(`ℹ️ ${message}`, context || '');
    }
}

/**
 * 성공 로그 (개발 환경에서만)
 */
export function logSuccess(message: string, context?: LogContext): void {
    if (import.meta.env.DEV) {
        console.log(`✅ ${message}`, context || '');
    }
}
