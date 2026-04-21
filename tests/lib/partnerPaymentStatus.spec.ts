import { describe, expect, it } from 'vitest';

import { getPartnerPaymentStatusBadge } from '../../components/Partner/paymentStatus';

describe('getPartnerPaymentStatusBadge', () => {
  it('treats completed payments as successful in the partner dashboard', () => {
    expect(getPartnerPaymentStatusBadge('completed')).toEqual({
      className: 'bg-green-100 text-green-700',
      label: '완료',
    });
  });

  it('keeps pending-like statuses in the waiting state', () => {
    expect(getPartnerPaymentStatusBadge('pending')).toEqual({
      className: 'bg-amber-100 text-amber-700',
      label: '대기',
    });
  });
});
