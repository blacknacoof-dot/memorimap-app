import { test, expect } from '@playwright/test';
import { supabase } from './db.utils';

interface AuthFixtureUser {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'super_admin';
}

interface AuthFixture {
  regularUser: AuthFixtureUser;
  facilityAdminUser: AuthFixtureUser;
  superAdminUser: AuthFixtureUser;
  facilityId: string;
}

const randomToken = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createFixtureUser = async (role: AuthFixtureUser['role'], marker: string): Promise<AuthFixtureUser> => {
  const token = randomToken();
  const email = `${marker}.${role}.${token}@example.com`.toLowerCase();
  const password = `Auth!${token}Aa`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user?.id) {
    throw new Error(`Failed to create fixture auth user (${role}): ${error?.message || 'unknown'}`);
  }

  const userId = data.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    clerk_id: userId,
    email,
    full_name: `${marker}-${role}`,
    role,
  }, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Failed to upsert profile (${role}): ${profileError.message}`);
  }

  return { id: userId, email, password, role };
};

let fixture: AuthFixture | null = null;

test.describe('Flow A: Auth -> Role -> Dashboard Access', () => {
  test.beforeAll(async () => {
    const marker = `flow-a-${Date.now()}`;
    const regularUser = await createFixtureUser('user', marker);
    const facilityAdminUser = await createFixtureUser('user', marker);
    const superAdminUser = await createFixtureUser('super_admin', marker);

    const { error: superAdminError } = await supabase.from('super_admins').upsert({
      user_id: superAdminUser.id,
      is_active: true,
    }, { onConflict: 'user_id' });

    if (superAdminError) {
      throw new Error(`Failed to upsert super_admins fixture: ${superAdminError.message}`);
    }

    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .insert({
        name: `${marker}-facility`,
        type: 'funeral_home',
        user_id: facilityAdminUser.id,
        verified: true,
        address: 'E2E auth fixture address',
      })
      .select('id')
      .single();

    if (facilityError || !facility?.id) {
      throw new Error(`Failed to create fixture facility: ${facilityError?.message || 'unknown'}`);
    }

    fixture = {
      regularUser,
      facilityAdminUser,
      superAdminUser,
      facilityId: facility.id as string,
    };
  });

  test.afterAll(async () => {
    if (!fixture) return;

    const userIds = [fixture.regularUser.id, fixture.facilityAdminUser.id, fixture.superAdminUser.id];
    await supabase.from('facilities').delete().eq('id', fixture.facilityId);
    await supabase.from('super_admins').delete().eq('user_id', fixture.superAdminUser.id);
    await supabase.from('profiles').delete().in('clerk_id', userIds);

    await Promise.all(userIds.map((id) => supabase.auth.admin.deleteUser(id)));
  });

  test('A-1: super_admin role exists in profiles + super_admins', async () => {
    const fx = fixture!;
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('clerk_id, role, full_name')
      .eq('clerk_id', fx.superAdminUser.id)
      .single();

    expect(profileErr).toBeNull();
    expect(profile).toBeDefined();
    expect(profile!.role).toBe('super_admin');

    const { data: admin, error: adminErr } = await supabase
      .from('super_admins')
      .select('user_id, is_active')
      .eq('user_id', fx.superAdminUser.id)
      .maybeSingle();

    expect(adminErr).toBeNull();
    expect(admin).toBeDefined();
    expect(admin!.is_active).toBe(true);
  });

  test('A-2: get_user_role resolves facility owner as facility_admin', async () => {
    const fx = fixture!;
    const { data, error } = await supabase.rpc('get_user_role', { p_clerk_id: fx.facilityAdminUser.id });

    expect(error).toBeNull();
    const roleRow = (Array.isArray(data) ? data[0] : null) as { role: string; facility_id: string | null } | null;
    expect(roleRow).toBeTruthy();
    expect(roleRow!.role).toBe('facility_admin');
    expect(roleRow!.facility_id).toBe(fx.facilityId);
  });

  test('A-3: regular user has no super_admin record', async () => {
    const fx = fixture!;
    const { data, error } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', fx.regularUser.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  test('A-4: get_user_role keeps super_admin priority', async () => {
    const fx = fixture!;
    const { data, error } = await supabase.rpc('get_user_role', { p_clerk_id: fx.superAdminUser.id });

    expect(error).toBeNull();
    const roleRow = (Array.isArray(data) ? data[0] : null) as { role: string; facility_id: string | null } | null;
    expect(roleRow).toBeTruthy();
    expect(roleRow!.role).toBe('super_admin');
  });

  test('A-5: is_super_admin(p_user_id) returns true for super_admin', async () => {
    const fx = fixture!;
    const { data, error } = await supabase.rpc('is_super_admin', { p_user_id: fx.superAdminUser.id });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  test('A-6: is_super_admin(p_user_id) returns false for regular user', async () => {
    const fx = fixture!;
    const { data, error } = await supabase.rpc('is_super_admin', { p_user_id: fx.regularUser.id });

    expect(error).toBeNull();
    expect(data).toBe(false);
  });
});
