import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions<T> {
    table: string;
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;  // e.g. "facility_id=eq.abc-123"
    callback: (payload: T) => void;
    enabled?: boolean;
}

export function useRealtimeSubscription<T = any>({
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

        const setupSubscription = async () => {
            // console.log(`[Realtime] Setting up subscription for ${table} (${event})`, filter);

            channel = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event,
                        schema: 'public',
                        table,
                        filter
                    },
                    (payload) => {
                        // console.log(`[Realtime] ${table} ${event} received:`, payload);
                        if (payload.new) {
                            callback(payload.new as T);
                        } else if (event === 'DELETE' && payload.old) {
                            // For DELETE, payload.new is null, so pass payload.old
                            callback(payload.old as T);
                        }
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        // console.log(`[Realtime] Subscribed to ${table} successfully.`);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error(`[Realtime] Subscription error for ${table}:`, err);
                    }
                });
        };

        setupSubscription();

        return () => {
            if (channel) {
                // console.log(`[Realtime] Unsubscribing from ${table}...`);
                supabase.removeChannel(channel);
            }
        };
    }, [table, event, filter, enabled]); // Intentionally omitting callback to prevent frequent re-subscriptions
}
