export interface PartnerReport {
  facilityId: string;
  facilityName: string;
  email: string;
  planName: string;
  planId: string;
  consultationCount: number;
  completedCount: number;
  reservationCount: number;
  conversionRate: number;
}

export interface MonthlyReportOptions {
  serviceRoleKey: string;
  resendApiKey?: string | null;
  dryRun?: boolean;
  now?: Date;
  requireCronHeader?: boolean;
}

interface SupabaseQueryResult {
  data: Record<string, unknown>[] | Record<string, unknown> | null;
  error: { message: string } | null;
  count?: number | null;
}

interface SupabaseQueryBuilder extends Promise<SupabaseQueryResult> {
  select(selection: string, options?: { count?: 'exact'; head?: boolean }): SupabaseQueryBuilder;
  eq(column: string, value: unknown): SupabaseQueryBuilder;
  in(column: string, values: string[]): SupabaseQueryBuilder;
  gte(column: string, value: string): SupabaseQueryBuilder;
  lte(column: string, value: string): SupabaseQueryBuilder;
  maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
}

type SupabaseLikeClient = {
  from(table: string): SupabaseQueryBuilder;
};

const SANGJO_PLAN_IDS = ['SJ_STARTER', 'SJ_PROFESSIONAL', 'SJ_ENTERPRISE'];

export async function handleSendMonthlyReportRequest(
  req: Request,
  client: SupabaseLikeClient,
  options: MonthlyReportOptions,
): Promise<Response> {
  const requireCronHeader = options.requireCronHeader ?? true;
  if (requireCronHeader) {
    const cronHeader = req.headers.get('x-vercel-cron');
    if (cronHeader !== '1') {
      return jsonResponse({ error: 'Forbidden: cron invocation only' }, 403);
    }
  }

  const bearerToken = parseBearerToken(req.headers.get('Authorization'));
  if (!bearerToken || bearerToken !== options.serviceRoleKey) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  if (!options.resendApiKey && !options.dryRun) {
    return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500);
  }

  const now = options.now ?? new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const monthLabel = `${lastMonth.getFullYear()}년 ${lastMonth.getMonth() + 1}월`;

  const { data: subscriptions, error: subError } = await client
    .from('facility_subscriptions')
    .select('facility_id, plan_id')
    .in('plan_id', SANGJO_PLAN_IDS)
    .eq('status', 'active');

  if (subError) {
    return jsonResponse({
      error: 'Failed to query active sangjo subscriptions',
      reason: 'facility_subscription_query_failed',
      details: subError.message,
    }, 500);
  }

  if (!subscriptions?.length) {
    return jsonResponse({
      message: 'No active sangjo subscriptions',
      reason: 'no_active_sangjo_subscriptions',
    }, 200);
  }

  const reports: PartnerReport[] = [];
  const errors: string[] = [];

  for (const sub of subscriptions) {
    try {
      const { data: facility } = await client
        .from('facilities')
        .select('name')
        .eq('id', sub.facility_id)
        .maybeSingle();

      const { data: admin } = await client
        .from('sangjo_hq_admins')
        .select('user_id')
        .eq('sangjo_id', sub.facility_id)
        .maybeSingle();

      const adminUserId = admin?.user_id ?? (await client
        .from('sangjo_dashboard_users')
        .select('id')
        .eq('sangjo_id', sub.facility_id)
        .maybeSingle()
      ).data?.id;

      let email: string | null = null;
      if (adminUserId) {
        const { data: profile } = await client
          .from('profiles')
          .select('email')
          .eq('clerk_id', adminUserId)
          .maybeSingle();

        email = profile?.email ?? null;
      }

      if (!email && options.dryRun) {
        email = `${String(adminUserId ?? sub.facility_id)}@example.com`;
      }

      if (!email) continue;

      const { count: consultationCount } = await client
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('facility_id', sub.facility_id)
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      const { count: completedCount } = await client
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('facility_id', sub.facility_id)
        .in('status', ['accepted', 'completed'])
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      const { count: contractCount } = await client
        .from('sangjo_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('sangjo_id', sub.facility_id)
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      const { count: reservationCount } = await client
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('facility_id', sub.facility_id)
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      const totalConsultations = (consultationCount ?? 0) + (contractCount ?? 0);
      const totalCompleted = completedCount ?? 0;
      const conversionRate = totalConsultations > 0
        ? Math.round((totalCompleted / totalConsultations) * 100)
        : 0;

      reports.push({
        facilityId: sub.facility_id,
        facilityName: facility?.name ?? '상조 업체',
        email,
        planName: sub.plan_id,
        planId: sub.plan_id,
        consultationCount: totalConsultations,
        completedCount: totalCompleted,
        reservationCount: reservationCount ?? 0,
        conversionRate,
      });
    } catch (error) {
      errors.push(`${sub.facility_id}: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  let sentCount = 0;
  for (const report of reports) {
    const upgradeHint = getUpgradeHint(report);
    const htmlBody = buildEmailHtml(report, monthLabel, upgradeHint);

    if (options.dryRun) {
      sentCount++;
      continue;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'memorimap<noreply@memorimap.com>',
          to: [report.email],
          subject: `[memorimap] ${monthLabel} 월간 리포트 - ${report.facilityName}`,
          html: htmlBody,
        }),
      });

      if (res.ok) {
        sentCount++;
      } else {
        errors.push(`${report.facilityId}: Resend ${res.status}`);
      }
    } catch (error) {
      errors.push(`${report.facilityId}: send failed ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  return jsonResponse({
    totalSubscriptions: subscriptions.length,
    reportsGenerated: reports.length,
    emailsSent: sentCount,
    ...(errors.length > 0 ? { errors } : {}),
  }, 200);
}

function parseBearerToken(value: string | null): string {
  if (!value?.startsWith('Bearer ')) {
    return '';
  }

  return value.slice(7);
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getUpgradeHint(report: PartnerReport): string | null {
  if (report.planId === 'SJ_STARTER' && report.consultationCount >= 20) {
    return 'PROFESSIONAL 요금제로 전환하면 상담 처리 효율을 더 높일 수 있습니다.';
  }

  if (report.planId === 'SJ_PROFESSIONAL' && report.consultationCount >= 50) {
    return 'ENTERPRISE 요금제를 검토할 시점입니다. 예약 자동화와 운영 분산에 유리합니다.';
  }

  return null;
}

function buildEmailHtml(report: PartnerReport, monthLabel: string, upgradeHint: string | null): string {
  const hintBlock = upgradeHint
    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:16px">
      <p style="font-size:13px;color:#1e40af;margin:0 0 12px;line-height:1.5">${upgradeHint}</p>
      <a href="https://memorimap.com/partner" style="display:inline-block;background:#4f46e5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold">
        업그레이드 알아보기
      </a>
    </div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px">
    <div style="background:#0f172a;color:#fff;border-radius:20px 20px 0 0;padding:28px 24px;text-align:center">
      <h1 style="margin:0;font-size:22px;line-height:1.3">${report.facilityName}</h1>
      <p style="margin:8px 0 0;font-size:13px;color:#cbd5e1">${monthLabel} 월간 리포트</p>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 20px 20px;padding:24px">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr>
          <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:center">
            <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">상담 건수</div>
            <div style="font-size:28px;font-weight:900;color:#0f172a;margin-top:6px">${report.consultationCount}</div>
          </td>
          <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:center">
            <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">완료 건수</div>
            <div style="font-size:28px;font-weight:900;color:#16a34a;margin-top:6px">${report.completedCount}</div>
          </td>
          <td style="padding:12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:center">
            <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">예약 건수</div>
            <div style="font-size:28px;font-weight:900;color:#2563eb;margin-top:6px">${report.reservationCount}</div>
          </td>
        </tr>
      </table>
      <div style="font-size:14px;color:#334155;line-height:1.7">
        <p style="margin:0 0 8px">전환율: <strong>${report.conversionRate}%</strong></p>
        <p style="margin:0">현재 플랜: <strong>${report.planName}</strong></p>
      </div>
      ${hintBlock}
      <p style="font-size:11px;color:#94a3b8;text-align:center;margin:24px 0 0">
        이 메일은 추모맵 파트너 서비스에서 자동 발송되었습니다.
      </p>
    </div>
  </div>
</body>
</html>`;
}
