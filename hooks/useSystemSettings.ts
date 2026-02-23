import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SystemSetting {
    key: string;
    value: string;
}

/**
 * system_settings 테이블에서 설정값을 로드하는 훅.
 * 공개 설정이므로 anon client로 조회 가능.
 * @param keys - 로드할 설정 키 배열 (빈 배열이면 전체 로드)
 */
export function useSystemSettings(keys?: string[]) {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                let query = supabase.from('system_settings').select('key, value');
                if (keys && keys.length > 0) {
                    query = query.in('key', keys);
                }
                const { data } = await query;
                if (data) {
                    const map: Record<string, string> = {};
                    (data as SystemSetting[]).forEach(s => { map[s.key] = s.value; });
                    setSettings(map);
                }
            } catch {
                // 기본값 유지
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [keys?.join(',')]);

    const getSetting = (key: string, defaultValue: string = ''): string => {
        return settings[key] ?? defaultValue;
    };

    const getNumber = (key: string, defaultValue: number = 0): number => {
        const val = settings[key];
        if (val == null) return defaultValue;
        const num = Number(val);
        return isNaN(num) ? defaultValue : num;
    };

    return { settings, loading, getSetting, getNumber };
}
