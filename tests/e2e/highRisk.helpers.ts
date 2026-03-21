import { supabase } from './db.utils';

export type HighRiskRole = 'user' | 'facility_admin' | 'sangjo_hq_admin' | 'super_admin';

export interface HighRiskUser {
  id: string;
  email: string;
  password: string;
  role: HighRiskRole;
}

const randomToken = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function getFacilitySubscriptionConflictTarget(facilityId: string): 'facility_id_uuid' | 'facility_id_bigint' {
  return isUuidLike(facilityId) ? 'facility_id_uuid' : 'facility_id_bigint';
}

export function buildFacilitySubscriptionCriteria(facilityId: string) {
  return isUuidLike(facilityId)
    ? { column: 'facility_id_uuid' as const, value: facilityId }
    : { column: 'facility_id_bigint' as const, value: Number(facilityId) };
}

export async function createHighRiskUser(role: HighRiskRole, marker: string): Promise<HighRiskUser> {
  const token = randomToken();
  const email = `${marker}.${role}.${token}@example.com`.toLowerCase();
  const password = `Hr!${token}Aa`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `${marker}-${role}`,
    },
  });

  if (error || !data.user?.id) {
    throw new Error(`Failed to create fixture auth user (${role}): ${error?.message || 'unknown error'}`);
  }

  const userId = data.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert({
    clerk_id: userId,
    email,
    full_name: `${marker}-${role}`,
    role,
  }, { onConflict: 'clerk_id' });

  if (profileError) {
    throw new Error(`Failed to upsert profile (${role}): ${profileError.message}`);
  }

  if (role === 'super_admin') {
    const { error: superAdminError } = await supabase.from('super_admins').upsert({
      user_id: userId,
      is_active: true,
    }, { onConflict: 'user_id' });

    if (superAdminError) {
      throw new Error(`Failed to upsert super_admins record: ${superAdminError.message}`);
    }
  }

  return { id: userId, email, password, role };
}

export async function createFacilityFixture(params: {
  ownerId: string;
  name: string;
  type: string;
  verified?: boolean;
  address?: string;
}) {
  const { data, error } = await supabase
    .from('facilities')
    .insert({
      name: params.name,
      type: params.type,
      user_id: params.ownerId,
      verified: params.verified ?? true,
      address: params.address ?? 'E2E fixture address',
    })
    .select('id, name, type')
    .single();

  if (error || !data?.id) {
    throw new Error(`Failed to create facility fixture: ${error?.message || 'unknown error'}`);
  }

  return { id: String(data.id), name: String(data.name), type: String(data.type) };
}

export async function createSangjoAdminLink(params: {
  userId: string;
  sangjoId: string;
  companyName: string;
  role?: string;
}) {
  const role = params.role ?? 'sangjo_hq_admin';
  await supabase.from('sangjo_dashboard_users').delete().eq('id', params.userId);
  await supabase.from('sangjo_hq_admins').delete().eq('user_id', params.userId);

  const dashboardUser = await supabase.from('sangjo_dashboard_users').insert({
    id: params.userId,
    sangjo_id: params.sangjoId,
    role,
    name: params.companyName,
  });

  if (dashboardUser.error) {
    throw new Error(`Failed to create sangjo_dashboard_users row: ${dashboardUser.error.message}`);
  }

  const hqAdmin = await supabase.from('sangjo_hq_admins').insert({
    user_id: params.userId,
    sangjo_id: params.sangjoId,
    company_name: params.companyName,
    role,
  });

  if (hqAdmin.error) {
    throw new Error(`Failed to create sangjo_hq_admins row: ${hqAdmin.error.message}`);
  }
}

export async function deleteHighRiskUser(userId: string): Promise<void> {
  await supabase.from('sangjo_dashboard_users').delete().eq('id', userId);
  await supabase.from('sangjo_hq_admins').delete().eq('user_id', userId);
  await supabase.from('super_admins').delete().eq('user_id', userId);
  await supabase.from('profiles').delete().eq('clerk_id', userId);
  await supabase.auth.admin.deleteUser(userId);
}
