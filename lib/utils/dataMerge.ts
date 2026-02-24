/**
 * [Phase 2] Data Merge Utilities
 * 데이터 병합 및 동기화 로직
 */

/** Internal indexable record type for merge operations */
type Indexable = Record<string, string | number | boolean | null | undefined | object>;

/**
 * 두 객체를 깊이 병합 (Deep Merge)
 * @param target - 기본 객체
 * @param source - 병합할 객체
 * @returns 병합된 객체
 */
export function deepMerge<T extends Indexable>(
    target: T,
    source: Partial<T>
): T {
    const output = { ...target };

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = output[key];

            if (
                sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                targetValue &&
                typeof targetValue === 'object' &&
                !Array.isArray(targetValue)
            ) {
                // 객체인 경우 재귀적으로 병합
                (output as Indexable)[key] = deepMerge(
                    targetValue as Indexable,
                    sourceValue as Partial<Indexable>
                );
            } else if (Array.isArray(sourceValue)) {
                // 배열인 경우
                if (Array.isArray(targetValue)) {
                    // ID 기반 배열 병합
                    (output as Indexable)[key] = mergeArraysById(
                        targetValue as Indexable[],
                        sourceValue as Indexable[]
                    );
                } else {
                    (output as Indexable)[key] = [...sourceValue];
                }
            } else {
                // 기본값은 source로 덮어쓰기
                (output as Indexable)[key] = sourceValue as T[Extract<keyof T, string>];
            }
        }
    }

    return output;
}

/**
 * ID 기반 배열 병합 (중복 제거)
 * @param targetArray - 기존 배열
 * @param sourceArray - 새로운 배열
 * @param idKey - ID 필드명 (기본값: 'id')
 * @returns 병합된 배열
 */
export function mergeArraysById<T extends Indexable>(
    targetArray: T[],
    sourceArray: T[],
    idKey: keyof T = 'id'
): T[] {
    const map = new Map<string | number, T>();

    // 기존 배열을 Map에 저장
    targetArray.forEach(item => {
        const key = item[idKey] as string | number;
        if (key !== undefined) {
            map.set(key, item);
        }
    });

    // 새로운 배열 병합 (덮어쓰기)
    sourceArray.forEach(item => {
        const key = item[idKey] as string | number;
        if (key !== undefined) {
            const existing = map.get(key);
            if (existing) {
                map.set(key, deepMerge(existing, item));
            } else {
                map.set(key, item);
            }
        }
    });

    return Array.from(map.values());
}

/**
 * 날짜 기준으로 정렬하며 병합
 * @param targetArray - 기존 배열
 * @param sourceArray - 새로운 배열
 * @param dateKey - 날짜 필드명
 * @param sortOrder - 정렬 순서 ('asc' | 'desc')
 * @returns 정렬된 병합 배열
 */
export function mergeAndSortByDate<T extends Indexable>(
    targetArray: T[],
    sourceArray: T[],
    dateKey: keyof T,
    sortOrder: 'asc' | 'desc' = 'desc'
): T[] {
    const merged = mergeArraysById(targetArray, sourceArray);

    return merged.sort((a, b) => {
        const dateA = new Date(String(a[dateKey])).getTime();
        const dateB = new Date(String(b[dateKey])).getTime();

        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
}

/**
 * Optimistic Update를 위한 데이터 병합
 * @param currentData - 현재 데이터
 * @param optimisticData - 낙관적 업데이트 데이터
 * @param isPending - 요청 진행 중 여부
 * @returns 병합된 데이터
 */
export function mergeOptimisticUpdate<T>(
    currentData: T,
    optimisticData: T,
    isPending: boolean
): T {
    if (!isPending) {
        return currentData;
    }

    // Pending 상태일 때만 optimistic 데이터 적용
    if (Array.isArray(currentData) && Array.isArray(optimisticData)) {
        return [...optimisticData, ...currentData] as unknown as T;
    }

    if (
        typeof currentData === 'object' &&
        typeof optimisticData === 'object' &&
        currentData !== null &&
        optimisticData !== null
    ) {
        return deepMerge(
            currentData as Indexable,
            optimisticData as Partial<Indexable>
        ) as T;
    }

    return optimisticData;
}

/**
 * 페이지네이션 데이터 병합
 * @param existingData - 기존 데이터
 * @param newData - 새로운 페이지 데이터
 * @param page - 현재 페이지 번호
 * @param isFirstPage - 첫 페이지 여부
 * @returns 병합된 데이터
 */
export function mergePaginatedData<T extends Indexable>(
    existingData: T[],
    newData: T[],
    page: number,
    isFirstPage: boolean = false
): T[] {
    if (isFirstPage || page === 1) {
        return newData;
    }

    // ID 기준 중복 제거하며 병합
    return mergeArraysById(existingData, newData);
}

/**
 * Realtime 데이터 업데이트 병합
 * @param currentData - 현재 데이터
 * @param realtimeUpdate - 실시간 업데이트 데이터
 * @param type - 업데이트 타입 ('INSERT' | 'UPDATE' | 'DELETE')
 * @returns 업데이트된 데이터
 */
export function mergeRealtimeUpdate<T extends Indexable>(
    currentData: T[],
    realtimeUpdate: T,
    type: 'INSERT' | 'UPDATE' | 'DELETE',
    idKey: keyof T = 'id'
): T[] {
    const updateId = realtimeUpdate[idKey];

    switch (type) {
        case 'INSERT': {
            // 중복 체크 후 추가
            const exists = currentData.find(item => item[idKey] === updateId);
            if (!exists) {
                return [realtimeUpdate, ...currentData];
            }
            return currentData;
        }

        case 'UPDATE':
            // 기존 항목 업데이트
            return currentData.map(item =>
                item[idKey] === updateId
                    ? deepMerge(item, realtimeUpdate)
                    : item
            );

        case 'DELETE':
            // 항목 제거
            return currentData.filter(item => item[idKey] !== updateId);

        default:
            return currentData;
    }
}

/**
 * 시설 데이터 병합 (Facilities 특화)
 * @param localData - 로컬 캐시 데이터
 * @param serverData - 서버 데이터
 * @returns 병합된 시설 데이터
 */
export function mergeFacilityData<T extends Indexable & { id: string | number; updated_at?: string }>(
    localData: T[],
    serverData: T[]
): T[] {
    const merged = new Map<string | number, T>();

    // 로컬 데이터 추가
    localData.forEach(item => {
        merged.set(item.id, item);
    });

    // 서버 데이터 병합 (더 최신인 경우 덮어쓰기)
    serverData.forEach(serverItem => {
        const localItem = merged.get(serverItem.id);

        if (!localItem) {
            // 새로운 데이터
            merged.set(serverItem.id, serverItem);
        } else if (serverItem.updated_at && localItem.updated_at) {
            // updated_at 비교
            const serverTime = new Date(serverItem.updated_at).getTime();
            const localTime = new Date(localItem.updated_at).getTime();

            if (serverTime > localTime) {
                merged.set(serverItem.id, serverItem);
            }
        } else {
            // updated_at 없으면 서버 데이터 우선
            merged.set(serverItem.id, serverItem);
        }
    });

    return Array.from(merged.values());
}

/**
 * 충돌 해결: 서버 데이터 우선
 * @param localValue - 로컬 값
 * @param serverValue - 서버 값
 * @returns 해결된 값
 */
export function resolveConflictServerWins<T>(localValue: T, serverValue: T): T {
    if (serverValue !== undefined && serverValue !== null) {
        return serverValue;
    }
    return localValue;
}

/**
 * 충돌 해결: 최신 데이터 우선
 * @param localValue - 로컬 값
 * @param serverValue - 서버 값
 * @param localTimestamp - 로컬 타임스탬프
 * @param serverTimestamp - 서버 타임스탬프
 * @returns 해결된 값
 */
export function resolveConflictByTimestamp<T>(
    localValue: T,
    serverValue: T,
    localTimestamp: string | number,
    serverTimestamp: string | number
): T {
    const localTime = typeof localTimestamp === 'string'
        ? new Date(localTimestamp).getTime()
        : localTimestamp;

    const serverTime = typeof serverTimestamp === 'string'
        ? new Date(serverTimestamp).getTime()
        : serverTimestamp;

    return serverTime > localTime ? serverValue : localValue;
}

export default {
    deepMerge,
    mergeArraysById,
    mergeAndSortByDate,
    mergeOptimisticUpdate,
    mergePaginatedData,
    mergeRealtimeUpdate,
    mergeFacilityData,
    resolveConflictServerWins,
    resolveConflictByTimestamp
};
