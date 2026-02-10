import { supabase } from './supabaseClient';

export interface AdminUser {
    id: string;
    clerk_id: string;
    email: string;
    name: string;
    role: string;
    image_url?: string;
    phone_number?: string;
    created_at?: string;
    subscription_plan?: string;
}

const enrichUsersWithPlans = async (users: any[]): Promise<AdminUser[]> => {
    if (!users.length) return [];

    const clerkIds = users.filter(u => u.clerk_id).map(u => u.clerk_id);
    if (!clerkIds.length) return users;

    try {
        // 1. Fetch Facility Plans
        const { data: facilitySubs, error: facilityError } = await supabase
            .from('memorial_spaces')
            .select(`
                owner_user_id,
                facility_subscriptions (
                    subscription_plans (name)
                )
            `)
            .in('owner_user_id', clerkIds);

        if (facilityError) console.error('[admin.ts] Facility sub fetch error:', facilityError);

        // 2. Fetch Sangjo Plans
        const { data: sangjoSubs, error: sangjoError } = await supabase
            .from('sangjo_dashboard_users')
            .select('id, plan_id')
            .in('id', clerkIds);

        if (sangjoError) console.error('[admin.ts] Sangjo sub fetch error:', sangjoError);

        return users.map(user => {
            let planName = undefined;

            // Facility lookup
            const fSub = facilitySubs?.find(s => s.owner_user_id === user.clerk_id);
            // facility_subscriptions is an array when joined
            const subs = fSub?.facility_subscriptions;
            if (Array.isArray(subs) && subs.length > 0 && subs[0].subscription_plans) {
                planName = (subs[0].subscription_plans as any).name;
            }

            // Sangjo lookup (fallback or override)
            const sSub = sangjoSubs?.find(s => s.id === user.clerk_id);
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
    } catch (err) {
        console.error('[admin.ts] enrichUsersWithPlans failed:', err);
        return users;
    }
};

export const searchUsers = async (query: string): Promise<AdminUser[]> => {
    let queryBuilder = supabase
        .from('users')
        .select('id, clerk_id, email, name, role, phone_number, created_at, image_url');

    if (query) {
        queryBuilder = queryBuilder.or(`email.ilike.%${query}%,name.ilike.%${query}%,phone_number.ilike.%${query}%,id.eq.${query}`);
    }

    const { data, error } = await queryBuilder.limit(20);

    if (error) {
        console.error('Error searching users:', error);
        throw error;
    }

    return enrichUsersWithPlans(data || []);
};

export const updateUserRole = async (userId: string, newRole: string) => {
    console.log(`[admin.ts] Updating user ${userId} role to: "${newRole}" (length: ${newRole.length})`);
    const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

export const getAllUsers = async (): Promise<AdminUser[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('id, clerk_id, email, name, role, phone_number, created_at, image_url')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
    return data || [];
};

export const approveSangjoUser = async (userId: string, clerkId: string, sangjoId: string, role: string, userName: string) => {
    console.log(`[admin.ts] approveSangjoUser: SupabaseID=${userId}, ClerkID=${clerkId}, role=${role}`);
    // 1. Update general user role using Supabase UUID
    const { error: roleError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

    if (roleError) {
        console.error('[admin.ts] Role update failed:', roleError);
        throw roleError;
    }

    // 2. Map to Sangjo Dashboard User using Clerk ID
    const { error: dashError } = await supabase
        .from('sangjo_dashboard_users')
        .upsert({
            id: clerkId, // Now matches TEXT primary key in DB
            sangjo_id: sangjoId,
            role: role === 'sangjo_hq_admin' ? 'admin' : 'staff',
            name: userName
        });

    if (dashError) {
        console.error('[admin.ts] Dashboard mapping failed:', dashError);
        throw dashError;
    }
};
