/**
 * 상조 업체 ID 변환 + 캐싱
 * fc_new_1 등 가짜 ID를 DB UUID로 변환하되, 메모리 캐시로 반복 쿼리 방지
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const nameToUuidCache = new Map<string, string>();
let cacheWarmed = false;

/** UUID 형식 체크 */
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * 앱 초기화 시 전체 회사 로딩 → 캐시 워밍
 */
export async function warmCompanyCache(client: SupabaseClient): Promise<void> {
  if (cacheWarmed) return;
  try {
    const { data } = await client
      .from('funeral_companies')
      .select('id, name');
    if (data) {
      for (const row of data) {
        nameToUuidCache.set(row.name, row.id);
        nameToUuidCache.set(row.name.replace(/\s/g, ''), row.id);
      }
      cacheWarmed = true;
    }
  } catch {
    // 캐시 워밍 실패 시 개별 쿼리로 폴백
  }
}

/**
 * ID 변환: UUID이면 그대로, 아니면 이름으로 캐시/DB 조회
 * 부분매칭(4글자) 제거 → 정확 매칭만
 */
export async function resolveCompanyId(
  idOrName: string,
  companyName: string,
  client: SupabaseClient
): Promise<string> {
  // 이미 UUID면 그대로 반환
  if (isUUID(idOrName)) return idOrName;

  // 캐시 조회 (이름 기준)
  const cached = nameToUuidCache.get(companyName) || nameToUuidCache.get(companyName.replace(/\s/g, ''));
  if (cached) return cached;

  // 캐시 워밍 안 됐으면 시도
  if (!cacheWarmed) {
    await warmCompanyCache(client);
    const afterWarm = nameToUuidCache.get(companyName) || nameToUuidCache.get(companyName.replace(/\s/g, ''));
    if (afterWarm) return afterWarm;
  }

  // 정확 매칭 쿼리
  const { data } = await client
    .from('funeral_companies')
    .select('id')
    .ilike('name', companyName)
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    nameToUuidCache.set(companyName, data.id);
    return data.id;
  }

  throw new Error(`상조 업체 '${companyName}'을 DB에서 찾을 수 없습니다.`);
}

/** 캐시 초기화 (테스트용) */
export function clearCompanyCache(): void {
  nameToUuidCache.clear();
  cacheWarmed = false;
}
