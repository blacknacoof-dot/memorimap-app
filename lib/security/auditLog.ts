/**
 * Audit Logging Utilities
 * Phase 1-4: Security Hardening
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export enum AuditAction {
    PROFILE_UPDATE = 'profile_update',
    REVIEW_CREATE = 'review_create',
    REVIEW_DELETE = 'review_delete',
    CONSULTATION_CREATE = 'consultation_create',
    FACILITY_UPDATE = 'facility_update',
    ADMIN_ACCESS = 'admin_access',
    RLS_VIOLATION = 'rls_violation'
}

interface AuditLogEntry {
    userId: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
}

/**
 * 감사 로그 기록
 * @param entry - 감사 로그 데이터
 * @param client - 인증된 Supabase 클라이언트 (필수)
 */
export async function logAuditEvent(entry: AuditLogEntry, client: SupabaseClient): Promise<void> {
    try {
        await client.from('audit_logs').insert({
            user_id: entry.userId,
            action: entry.action,
            resource_type: entry.resourceType,
            resource_id: entry.resourceId,
            metadata: entry.metadata,
            ip_address: entry.ipAddress,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Audit Log Error]', error);
        // 감사 로그 실패는 사용자 경험을 방해하지 않도록 silent fail
    }
}
