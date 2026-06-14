import type { Facility } from '../types';

// Temporary map-hold policy until manual review and DB cleanup are approved.
export const P0_MAP_HOLD_FACILITY_IDS = new Set<string>([
  'f3fedf9a-dc8c-4f3a-8c48-b70cc59ff055',
  'f14020ac-708a-42fc-bf6d-1e6913bee544',
  '1bb0e3b0-fd73-4297-a655-ed34a8828769',
  'fa08b45c-f934-42f0-b2f2-44d0fe47a309',
  'fd83a9a9-a8e9-41c5-8252-48d001a956b2',
]);

const MAP_BLOCKED_FACILITY_TYPES = new Set([
  'sangjo',
  'funeral_company',
  'service_company',
  'insurance',
  'life',
  'unknown_sangjo',
  '상조',
]);

export function isFacilityMapHold(facilityOrId: Facility | string | null | undefined): boolean {
  const id = typeof facilityOrId === 'string' ? facilityOrId : facilityOrId?.id;
  return Boolean(id && P0_MAP_HOLD_FACILITY_IDS.has(String(id)));
}

function normalizeFacilityType(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export function isFacilityMapVisible(facility: {
  id?: string | number | null;
  type?: unknown;
  category?: unknown;
} | null | undefined): boolean {
  if (!facility) return false;
  if (isFacilityMapHold(String(facility.id || ''))) return false;

  const type = normalizeFacilityType(facility.type);
  const category = normalizeFacilityType(facility.category);

  if (MAP_BLOCKED_FACILITY_TYPES.has(type)) return false;
  if (MAP_BLOCKED_FACILITY_TYPES.has(category)) return false;

  return true;
}

export function filterVisibleFacilities<T extends {
  id?: string | number | null;
  type?: unknown;
  category?: unknown;
}>(facilities: T[]): T[] {
  return facilities.filter(isFacilityMapVisible);
}
