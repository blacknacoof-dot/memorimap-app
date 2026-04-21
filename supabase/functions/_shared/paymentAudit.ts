type PrimitiveRecord = Record<string, unknown>;

export type ClientPaymentResult = {
  paymentId?: string;
  transactionId?: string;
  txId?: string;
  code?: string;
  message?: string;
  pgCode?: string;
  pgMessage?: string;
  payMethod?: string;
  amount?: number;
};

export type KcpReviewFields = {
  gatewayProvider: "KCP";
  paymentStatus: string | null;
  resCd: string | null;
  tno: string | null;
  amount: number | null;
  payMethod: string | null;
  appNo: string | null;
  cardCd: string | null;
  cardNo: string | null;
  cardMny: number | null;
  missingFields: string[];
  rawPayload: PrimitiveRecord;
};

function asRecord(value: unknown): PrimitiveRecord | null {
  return value && typeof value === "object" ? value as PrimitiveRecord : null;
}

function readPath(source: unknown, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = source;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (Number.isNaN(index)) return undefined;
      current = current[index];
      continue;
    }

    const record = asRecord(current);
    if (!record || !(segment in record)) return undefined;
    current = record[segment];
  }

  return current;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizePayMethod(...values: unknown[]): string | null {
  const raw = firstString(...values);
  return raw ? raw.toUpperCase() : null;
}

function resolveCardMethod(payment: PrimitiveRecord | null): PrimitiveRecord | null {
  const directMethod = asRecord(payment?.method ?? payment?.paymentMethod);
  if (!directMethod) return null;

  const methodType = normalizePayMethod(directMethod.type);
  if (methodType === "CARD") return directMethod;

  if (methodType === "EASY_PAY") {
    const nested = asRecord(directMethod.easyPayMethod ?? directMethod.method);
    const nestedType = normalizePayMethod(nested?.type);
    if (nestedType === "CARD") return nested;
  }

  return null;
}

export function normalizeKcpReviewFields(params: {
  payment: unknown;
  clientResult?: ClientPaymentResult | null;
  expectedAmount?: number | null;
  requestedPayMethod?: string | null;
}): KcpReviewFields {
  const payment = asRecord(params.payment);
  const client = params.clientResult ?? null;
  const method = asRecord(payment?.method ?? payment?.paymentMethod);
  const cardMethod = resolveCardMethod(payment);

  const paymentStatus = firstString(payment?.status);
  const amount = firstNumber(
    readPath(payment, "amount.total"),
    readPath(payment, "amount"),
    params.expectedAmount,
    client?.amount,
  );
  const payMethod = normalizePayMethod(
    method?.type,
    readPath(payment, "payMethod"),
    params.requestedPayMethod,
    client?.payMethod,
  );
  const resCd = firstString(
    readPath(payment, "pgResponse.res_cd"),
    readPath(payment, "failure.pgCode"),
    readPath(payment, "pgCode"),
    client?.pgCode,
    client?.code,
    paymentStatus === "PAID" ? "0000" : null,
  );
  const tno = firstString(
    readPath(payment, "pgTxId"),
    readPath(payment, "transactionId"),
    readPath(payment, "latestTransaction.pgTxId"),
    readPath(payment, "latestTransaction.transactionId"),
    client?.transactionId,
    client?.txId,
  );
  const appNo = firstString(
    readPath(cardMethod, "approvalNumber"),
    readPath(cardMethod, "card.approvalNumber"),
    readPath(payment, "pgResponse.app_no"),
  );
  const cardCd = firstString(
    readPath(cardMethod, "card.publisher"),
    readPath(cardMethod, "card.issuer"),
    readPath(cardMethod, "card.code"),
    readPath(payment, "pgResponse.card_cd"),
  );
  const cardNo = firstString(
    readPath(cardMethod, "card.number"),
    readPath(payment, "pgResponse.card_no"),
  );
  const cardMny = payMethod === "CARD" ? amount : firstNumber(readPath(payment, "pgResponse.card_mny"));

  const missingFields = [
    !resCd ? "res_cd" : null,
    !tno ? "tno" : null,
    amount == null ? "amount" : null,
    !payMethod ? "pay_method" : null,
    payMethod === "CARD" && !appNo ? "app_no" : null,
    payMethod === "CARD" && !cardCd ? "card_cd" : null,
    payMethod === "CARD" && !cardNo ? "card_no" : null,
    payMethod === "CARD" && cardMny == null ? "card_mny" : null,
  ].filter((value): value is string => value !== null);

  return {
    gatewayProvider: "KCP",
    paymentStatus,
    resCd,
    tno,
    amount,
    payMethod,
    appNo,
    cardCd,
    cardNo,
    cardMny,
    missingFields,
    rawPayload: {
      payment: payment ?? {},
      clientResult: client ?? {},
      expectedAmount: params.expectedAmount ?? null,
      requestedPayMethod: params.requestedPayMethod ?? null,
    },
  };
}

export async function upsertPaymentAudit(
  db: { from: (table: string) => { upsert: (value: unknown, options?: unknown) => Promise<unknown> } },
  params: {
    paymentId: string;
    paymentContext: string;
    source: string;
    orderRef?: string | null;
    reviewFields: KcpReviewFields;
  },
): Promise<void> {
  await db.from("payment_audits").upsert({
    payment_id: params.paymentId,
    payment_context: params.paymentContext,
    source: params.source,
    order_ref: params.orderRef ?? null,
    gateway_provider: params.reviewFields.gatewayProvider,
    payment_status: params.reviewFields.paymentStatus,
    review_status: params.reviewFields.missingFields.length === 0 ? "complete" : "incomplete",
    res_cd: params.reviewFields.resCd,
    tno: params.reviewFields.tno,
    amount: params.reviewFields.amount,
    pay_method: params.reviewFields.payMethod,
    app_no: params.reviewFields.appNo,
    card_cd: params.reviewFields.cardCd,
    card_no: params.reviewFields.cardNo,
    card_mny: params.reviewFields.cardMny,
    missing_fields: params.reviewFields.missingFields,
    raw_payload: params.reviewFields.rawPayload,
    updated_at: new Date().toISOString(),
  }, { onConflict: "payment_id,source" });
}
