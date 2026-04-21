export interface PaymentStatusBadge {
  className: string;
  label: string;
}

export function getPartnerPaymentStatusBadge(status?: string | null): PaymentStatusBadge {
  if (status === 'succeeded' || status === 'completed') {
    return { className: 'bg-green-100 text-green-700', label: '완료' };
  }

  if (status === 'failed') {
    return { className: 'bg-red-100 text-red-700', label: '실패' };
  }

  if (status === 'refunded') {
    return { className: 'bg-slate-100 text-slate-600', label: '환불' };
  }

  return { className: 'bg-amber-100 text-amber-700', label: '대기' };
}
