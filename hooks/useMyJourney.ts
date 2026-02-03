import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@clerk/clerk-react';

export interface JourneyEvent {
    id: string;
    user_id: string;
    event_type: string;
    event_title: string;
    event_description?: string;
    facility_id?: string;
    event_date: string;
    created_at: string;
}

export interface JourneyProgress {
    progress_percentage: number;
    total_steps: number;
    completed_steps: number;
    // ...
}

interface JourneyData {
    events: JourneyEvent[];
    progress: JourneyProgress;
}

export function useMyJourney() {
    const { userId, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['my-journey', userId],
        queryFn: async () => {
            // Clerk userId is source of truth
            if (!userId) throw new Error('Not authenticated');

            // 1. 이벤트 조회 (RLS will validate session token on server side)
            const { data: events, error: eventsError } = await supabase
                .from('user_journey_events')
                .select('*')
                .eq('user_id', userId)
                .order('event_date', { ascending: false });

            if (eventsError) throw eventsError;

            // 2. 진행률 계산
            const eventCount = events?.length || 0;
            const progressPercentage = Math.min(100, eventCount * 20);

            return {
                events: events as JourneyEvent[],
                progress: {
                    progress_percentage: progressPercentage,
                    total_steps: 5,
                    completed_steps: eventCount,
                },
            } as JourneyData;
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!isSignedIn && !!userId,
    });
}
