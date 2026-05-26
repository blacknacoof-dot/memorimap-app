import type { Facility } from '../types';

// Temporary P0 map-hold policy until manual review and DB cleanup are approved.
export const P0_MAP_HOLD_FACILITY_IDS = new Set<string>([
  'f3fedf9a-dc8c-4f3a-8c48-b70cc59ff055',
  'f14020ac-708a-42fc-bf6d-1e6913bee544',
  '1bb0e3b0-fd73-4297-a655-ed34a8828769',
  'fa08b45c-f934-42f0-b2f2-44d0fe47a309',
  'fd83a9a9-a8e9-41c5-8252-48d001a956b2',
]);

export function isFacilityMapHold(facilityOrId: Facility | string | null | undefined): boolean {
  const id = typeof facilityOrId === 'string' ? facilityOrId : facilityOrId?.id;
  return Boolean(id && P0_MAP_HOLD_FACILITY_IDS.has(String(id)));
}

export function filterVisibleFacilities<T extends { id?: string | number | null }>(facilities: T[]): T[] {
  return facilities.filter((facility) => !isFacilityMapHold(String(facility.id || '')));
}
