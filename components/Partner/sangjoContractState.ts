import type { Consultation } from '../../lib/queries';
import type { SangjoContract } from '../../types/sangjo';

export type SangjoContractRow = SangjoContract & {
  updated_at?: string | null;
};

const STATUS_MAP: Record<string, Consultation['status']> = {
  상담신청: 'pending',
  예약대기: 'waiting',
  계약진행: 'accepted',
  임종발생: 'accepted',
  현장도착: 'accepted',
  염습중: 'accepted',
  장례진행중: 'accepted',
  완료: 'completed',
};

function buildReadStorageKey(userId: string, sangjoId: string) {
  return `memorimap:sangjo-contract-read:${userId}:${sangjoId}`;
}

export function getPersistedReadSangjoContractIds(userId?: string | null, sangjoId?: string | null): Set<string> {
  if (!userId || !sangjoId || typeof window === 'undefined') {
    return new Set<string>();
  }

  try {
    const raw = window.localStorage.getItem(buildReadStorageKey(userId, sangjoId));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((value): value is string => typeof value === 'string' && value.length > 0));
  } catch {
    return new Set<string>();
  }
}

export function persistReadSangjoContractId(userId?: string | null, sangjoId?: string | null, contractId?: string | null) {
  if (!userId || !sangjoId || !contractId || typeof window === 'undefined') {
    return;
  }

  const next = getPersistedReadSangjoContractIds(userId, sangjoId);
  next.add(contractId);

  try {
    window.localStorage.setItem(buildReadStorageKey(userId, sangjoId), JSON.stringify([...next]));
  } catch {
    // Ignore storage failures and keep the current in-memory read state.
  }
}

export function mapSangjoContractToConsultation(
  contract: SangjoContractRow,
  persistedReadIds?: ReadonlySet<string>,
): Consultation {
  const answer = contract.assigned_counselor?.trim() || undefined;
  const answeredAt = answer ? contract.updated_at || contract.created_at : undefined;
  const isRead =
    Boolean(answer) ||
    contract.status !== '상담신청' ||
    Boolean(persistedReadIds?.has(contract.id));

  return {
    id: contract.id,
    facility_id: contract.sangjo_id,
    user_name: contract.customer_name || '',
    user_phone: contract.customer_phone || '',
    urgency: contract.emergency_level || 'normal',
    scale: '',
    religion: contract.religion || '',
    schedule: contract.preferred_call_time || '',
    status: STATUS_MAP[contract.status] || 'pending',
    notes: [
      contract.contract_number ? `계약번호: ${contract.contract_number}` : '',
      contract.preferred_call_time ? `희망시간: ${contract.preferred_call_time}` : '',
      contract.application_type === 'CONSULTATION' ? '유형: 상담신청' : '유형: 계약신청',
    ].filter(Boolean).join(' | '),
    answer,
    answered_at: answeredAt,
    created_at: contract.created_at,
    updated_at: contract.updated_at || contract.created_at,
    is_read: isRead,
    is_ai_response: false,
    metadata: {},
    source: 'sangjo_contract',
  };
}
