/**
 * Audit Logging Utilities
 * Phase 1-4: Security Hardening
 */

import { supabase } from '@/lib/supabaseClient';

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
    metadata?: Record<string, any>;
    ipAddress?: string;
}

/**
 * 감사 로그 기록
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
        await supabase.from('audit_logs').insert({
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
