import { describe, expect, it } from 'vitest';

import { mapSangjoContractToConsultation } from '../../components/Partner/sangjoContractState';
import type { SangjoContract } from '../../types/sangjo';

function buildContract(overrides: Partial<SangjoContract> = {}): SangjoContract {
  return {
    id: 'contract-1',
    contract_number: 'SC-001',
    sangjo_id: 'sangjo-1',
    customer_name: '홍길동',
    customer_phone: '010-1234-5678',
    total_price: 3000000,
    status: '상담신청',
    created_at: '2026-04-21T09:00:00.000Z',
    ...overrides,
  };
}

describe('sangjoContractState', () => {
  it('restores sangjo answers from assigned counselor text on reload', () => {
    const consultation = mapSangjoContractToConsultation({
      ...buildContract({
        status: '계약진행',
        assigned_counselor: '담당자가 곧 연락드리겠습니다.',
      }),
      updated_at: '2026-04-21T10:00:00.000Z',
    });

    expect(consultation.answer).toBe('담당자가 곧 연락드리겠습니다.');
    expect(consultation.answered_at).toBe('2026-04-21T10:00:00.000Z');
    expect(consultation.is_read).toBe(true);
    expect(consultation.status).toBe('accepted');
  });

  it('keeps a sangjo contract marked as read when a persisted read id exists', () => {
    const consultation = mapSangjoContractToConsultation(
      buildContract(),
      new Set(['contract-1']),
    );

    expect(consultation.is_read).toBe(true);
    expect(consultation.status).toBe('pending');
  });
});
