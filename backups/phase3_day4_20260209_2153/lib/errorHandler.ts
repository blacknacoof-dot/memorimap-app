/**
 * Error Handling Utilities - Phase 2
 * 사용자 친화적인 에러 알림 및 감사 로그 통합
 */

import { toast } from 'sonner';
import { logAuditEvent, AuditAction } from '@/lib/security/auditLog';

interface ErrorHandlerOptions {
    showToast?: boolean;
    logToAudit?: boolean;
    userId?: string;
}

/**
 * 표준 에러 핸들러
 * @param error - 발생한 에러 객체
 * @param context - 에러 발생 위치 (예: '프로필 저장', '리뷰 작성')
 * @param options - 추가 옵션 (toast 표시 여부, 감사 로그 기록 여부)
 */
export function handleError(
    error: unknown,
    context: string,
    options?: ErrorHandlerOptions
): void {
    const message = error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.';

    // 콘솔 로그 (개발 환경)
    console.error(`[${context}]`, error);

    // 사용자 알림 (Toast)
    if (options?.showToast !== false) {
        toast.error(message, {
            description: context,
            duration: 5000
        });
    }

    // Audit Log 기록 (선택적)
    if (options?.logToAudit && options?.userId) {
        logAuditEvent({
            userId: options.userId,
            action: AuditAction.RLS_VIOLATION,
            resourceType: 'error',
            metadata: { context, message }
        }).catch(err => console.error('Audit log failed:', err));
    }
}

/**
 * 성공 토스트 표시
 */
export function showSuccess(message: string, description?: string): void {
    toast.success(message, { description, duration: 3000 });
}

/**
 * 경고 토스트 표시
 */
export function showWarning(message: string, description?: string): void {
    toast.warning(message, { description, duration: 4000 });
}

/**
 * 정보 토스트 표시
 */
export function showInfo(message: string, description?: string): void {
    toast.info(message, { description, duration: 3000 });
}
