
import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface LikeStatProps {
    facilityId: string;
}

export function LikeStatCard({ facilityId }: LikeStatProps) {
    const [likeCount, setLikeCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLikeCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('user_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('target_id', facilityId);

                if (error) throw error;
                setLikeCount(count || 0);
            } catch (err) {
                console.error('Failed to fetch like count:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLikeCount();
    }, [facilityId]);

    return (
        <div className="flex-1 rounded-xl p-3 border bg-white/10 border-white/10">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                관심 고객 <Heart size={10} className="text-red-400 fill-red-400" />
            </p>
            <p className="text-2xl font-black text-white">
                {loading ? '...' : likeCount}
            </p>
        </div>
    );
}
