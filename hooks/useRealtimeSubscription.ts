import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { RealtimeChannel, RealtimePostgresChangesPayload, RealtimePostgresChangesFilter } from '@supabase/supabase-js';
import { REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from '@supabase/supabase-js';

// Supabase realtime generics require `{ [key: string]: any }` — this is the library's own constraint.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RealtimeRecord = { [key: string]: any };

interface UseRealtimeOptions<T> {
    table: string;
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;  // e.g. "facility_id=eq.abc-123"
    callback: (payload: T) => void;
    enabled?: boolean;
}

export function useRealtimeSubscription<T extends RealtimeRecord = RealtimeRecord>({
    table,
    event,
    filter,
    callback,
    enabled = true
}: UseRealtimeOptions<T>) {
    useEffect(() => {
        if (!enabled) return;

        let channel: RealtimeChannel;

        // Create a unique channel name to prevent collisions if multiple components subscribe to similar events
        const channelName = `realtime:${table}:${event}:${filter || 'all'}:${Date.now()}`;

        const handlePayload = (payload: RealtimePostgresChangesPayload<T>) => {
            if ('new' in payload && payload.new && typeof payload.new === 'object' && Object.keys(payload.new).length > 0) {
                callback(payload.new as T);
            } else if (event === 'DELETE' && 'old' in payload && payload.old && typeof payload.old === 'object' && Object.keys(payload.old).length > 0) {
                callback(payload.old as T);
            }
        };

        const pgFilter: RealtimePostgresChangesFilter<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL}`> = {
            event: '*',
            schema: 'public',
            table,
            filter
        };

        const setupSubscription = () => {
            channel = supabase
                .channel(channelName)
                .on<T>(
                    'postgres_changes',
                    pgFilter,
                    handlePayload
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        // Successfully subscribed
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error(`[Realtime] Subscription error for ${table}:`, err);
                    }
                });
        };

        setupSubscription();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [table, event, filter, enabled]); // Intentionally omitting callback to prevent frequent re-subscriptions
}
