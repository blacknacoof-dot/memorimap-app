import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface AdminUser {
    id: string;
    clerk_id: string;
    email: string;
    name: string;
    full_name?: string;
    role: string;
    avatar_url?: string;
    image_url?: string;
    phone_number?: string;
    created_at?: string;
    subscription_plan?: string;
}

/** profiles 테이블에서 select한 컬럼과 일치하는 타입 */
interface ProfileRow {
    id: string;
    clerk_id: string | null;
    email: string | null;
    full_name: string | null;
    role: string | null;
    phone_number: string | null;
    created_at: string | null;
    avatar_url: string | null;
}

/** facility_subscriptions join 결과 타입 */
interface FacilitySubJoinRow {
    user_id: string | null;
    facility_subscriptions: Array<{
        subscription_plans: { name: string } | null;
    }> | null;
}

/** sangjo_dashboard_users 조회 결과 타입 */
interface SangjoDashboardRow {
    id: string;
    plan_id: string | null;
}

function profileRowToAdminUser(u: ProfileRow): AdminUser {
    return {
        id: u.id,
        clerk_id: u.clerk_id || '',
        email: u.email || '',
        name: u.full_name || '',
        full_name: u.full_name || undefined,
        role: u.role || 'user',
        avatar_url: u.avatar_url || undefined,
        image_url: u.avatar_url || undefined,
        phone_number: u.phone_number || undefined,
        created_at: u.created_at || undefined,
    };
}

const enrichUsersWithPlans = async (users: AdminUser[]): Promise<AdminUser[]> => {
    if (!users.length) return [];

    const clerkIds = users.filter(u => u.clerk_id).map(u => u.clerk_id);
    if (!clerkIds.length) return users;

    try {
        // 1. Fetch Facility Plans (read-only, anon OK)
        const { data: facilitySubs, error: facilityError } = await supabase
            .from('facilities')
            .select(`
                user_id,
                facility_subscriptions (
                    subscription_plans (name)
                )
            `)
            .in('user_id', clerkIds);

        // facilityError is non-fatal

        // 2. Fetch Sangjo Plans (read-only, anon OK)
        const { data: sangjoSubs, error: sangjoError } = await supabase
            .from('sangjo_dashboard_users')
            .select('id, plan_id')
            .in('id', clerkIds);

        // sangjoError is non-fatal

        const typedFacilitySubs = facilitySubs as FacilitySubJoinRow[] | null;
        const typedSangjoSubs = sangjoSubs as SangjoDashboardRow[] | null;

        return users.map(user => {
            let planName: string | undefined = undefined;

            // Facility lookup
            const fSub = typedFacilitySubs?.find(s => s.user_id === user.clerk_id);
            const subs = fSub?.facility_subscriptions;
            if (Array.isArray(subs) && subs.length > 0 && subs[0].subscription_plans) {
                planName = subs[0].subscription_plans.name;
            }

            // Sangjo lookup (fallback or override)
            const sSub = typedSangjoSubs?.find(s => s.id === user.clerk_id);
            if (sSub?.plan_id) {
                const planMap: Record<string, string> = {
                    'sj_starter': '상조 STARTER',
                    'sj_professional': '상조 PRO',
                    'sj_enterprise': '상조 VIP'
                };
                planName = planMap[sSub.plan_id] || sSub.plan_id;
            }

            return { ...user, subscription_plan: planName };
        });
    } catch (err: unknown) {
        // enrichUsersWithPlans failed (non-fatal)
        return users;
    }
};

export const searchUsers = async (query: string): Promise<AdminUser[]> => {
    let queryBuilder = supabase
        .from('profiles')
        .select('id, clerk_id, email, full_name, role, phone_number, created_at, avatar_url');

    if (query) {
        const sanitized = query.trim().replace(/[%_\\]/g, '\\$&').replace(/[,.()"']/g, '');
        if (!sanitized) return enrichUsersWithPlans([]);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sanitized);

        const pattern = `%${sanitized}%`;
        const filters: string[] = [
            `email.ilike.${pattern}`,
            `full_name.ilike.${pattern}`,
        ];
        if (isUUID) {
            filters.push(`id.eq.${sanitized}`);
        } else {
            filters.push(`phone_number.ilike.${pattern}`);
        }
        queryBuilder = queryBuilder.or(filters.join(','));
    }

    const { data, error } = await queryBuilder.limit(20);

    if (error) {
        throw error;
    }

    const rows = (data || []) as unknown as ProfileRow[];
    return enrichUsersWithPlans(rows.map(profileRowToAdminUser));
};

export const updateUserRole = async (userId: string, newRole: string, client: SupabaseClient) => {
    const { error } = await client
        .from('profiles')
        .update({ role: newRole })
        .eq('clerk_id', userId);

    if (error) {
        throw error;
    }
};

export const getAllUsers = async (): Promise<AdminUser[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, clerk_id, email, full_name, role, phone_number, created_at, avatar_url')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        throw error;
    }

    const rows = (data || []) as unknown as ProfileRow[];
    return rows.map(profileRowToAdminUser);
};

export const approveSangjoUser = async (userId: string, clerkId: string, sangjoId: string, role: string, userName: string, client: SupabaseClient) => {
    // 1. Update general user role using profile id (clerk_id)
    const { error: roleError } = await client
        .from('profiles')
        .update({ role })
        .eq('clerk_id', clerkId);

    if (roleError) {
        throw roleError;
    }

    // 2. Map to Sangjo Dashboard User using Clerk ID
    const { error: dashError } = await client
        .from('sangjo_dashboard_users')
        .upsert({
            id: clerkId,
            sangjo_id: sangjoId,
            role: role === 'sangjo_hq_admin' ? 'admin' : 'staff',
            name: userName
        });

    if (dashError) {
        throw dashError;
    }
};
