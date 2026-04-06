import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabase } from './db.utils';

type FixtureUserRole = 'user' | 'facility_admin' | 'super_admin';

interface FixtureUser {
  id: string;
  email: string;
  password: string;
  role: FixtureUserRole;
}

interface EdgeFixture {
  regularUser: FixtureUser;
  facilityAdminUser: FixtureUser;
  superAdminUser: FixtureUser;
  ownedLegacyFacilityId: number;
  foreignLegacyFacilityId: number;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for auth edge function tests');
}

const functionsBaseUrl = `${supabaseUrl}/functions/v1`;

const randomToken = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createFixtureUser = async (role: FixtureUserRole, marker: string): Promise<FixtureUser> => {
  const token = randomToken();
  const email = `${marker}.${role}.${token}@example.com`.toLowerCase();
  const password = `Auth!${token}Aa`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user?.id) {
    throw new Error(`Failed to create auth user (${role}): ${error?.message || 'unknown'}`);
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

  if (role === 'super_admin') {
    const { error: superAdminError } = await supabase.from('super_admins').upsert({
      user_id: userId,
      is_active: true,
    }, { onConflict: 'user_id' });

    if (superAdminError) {
      throw new Error(`Failed to upsert super_admins fixture: ${superAdminError.message}`);
    }
  }

  return { id: userId, email, password, role };
};

const createSignedInClient = async (user: FixtureUser): Promise<{ client: SupabaseClient; accessToken: string }> => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error || !data.session?.access_token) {
    throw new Error(`Failed to sign in fixture user ${user.email}: ${error?.message || 'unknown'}`);
  }

  return { client, accessToken: data.session.access_token };
};

const callFunction = async (
  slug: 'deploy-bot-data' | 'approve-partner' | 'verify-payment',
  options?: {
    bearerToken?: string;
    body?: Record<string, unknown>;
  },
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.bearerToken) {
    headers.Authorization = `Bearer ${options.bearerToken}`;
  }

  const response = await fetch(`${functionsBaseUrl}/${slug}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(options?.body ?? {}),
  });

  const text = await response.text();
  let body: Record<string, unknown> | null = null;
  try {
    body = text ? JSON.parse(text) as Record<string, unknown> : null;
  } catch {
    body = { raw: text };
  }

  return { response, body };
};

let fixture: EdgeFixture | null = null;

test.describe.serial('Auth/Authz: edge function boundaries', () => {
  test.beforeAll(async () => {
    const marker = `auth-edge-${Date.now()}`;
    const regularUser = await createFixtureUser('user', marker);
    const facilityAdminUser = await createFixtureUser('facility_admin', marker);
    const superAdminUser = await createFixtureUser('super_admin', marker);
    const ownedLegacyFacilityId = Number(`88${String(Date.now()).slice(-6)}`);
    const foreignLegacyFacilityId = ownedLegacyFacilityId + 1;

    const { error: ownFacilityError } = await supabase.from('facilities').insert({
      name: `${marker}-owned-facility`,
      type: 'funeral_home',
      user_id: facilityAdminUser.id,
      verified: true,
      address: 'auth edge fixture address',
      legacy_id: ownedLegacyFacilityId,
    });

    if (ownFacilityError) {
      throw new Error(`Failed to create owned facility fixture: ${ownFacilityError.message}`);
    }

    const { error: foreignFacilityError } = await supabase.from('facilities').insert({
      name: `${marker}-foreign-facility`,
      type: 'funeral_home',
      user_id: regularUser.id,
      verified: true,
      address: 'auth edge foreign fixture address',
      legacy_id: foreignLegacyFacilityId,
    });

    if (foreignFacilityError) {
      throw new Error(`Failed to create foreign facility fixture: ${foreignFacilityError.message}`);
    }

    fixture = {
      regularUser,
      facilityAdminUser,
      superAdminUser,
      ownedLegacyFacilityId,
      foreignLegacyFacilityId,
    };
  });

  test.afterAll(async () => {
    if (!fixture) return;

    const userIds = [
      fixture.regularUser.id,
      fixture.facilityAdminUser.id,
      fixture.superAdminUser.id,
    ];

    await supabase.from('facilities').delete().in('legacy_id', [
      fixture.ownedLegacyFacilityId,
      fixture.foreignLegacyFacilityId,
    ]);
    await supabase.from('super_admins').delete().eq('user_id', fixture.superAdminUser.id);
    await supabase.from('profiles').delete().in('clerk_id', userIds);
    await Promise.all(userIds.map((id) => supabase.auth.admin.deleteUser(id)));
  });

  test('AUTH-EDGE-1: no Authorization header is rejected', async () => {
    const { response, body } = await callFunction('deploy-bot-data', {
      body: { action: 'update_timestamp', facility_id: String(fixture!.ownedLegacyFacilityId) },
    });

    // 기대 결과: 비로그인 사용자는 보호 API에 접근할 수 없어야 한다.
    expect(response.status).toBe(401);
    expect(body).toBeTruthy();
    expect(JSON.stringify(body)).toMatch(/401|Missing authorization/i);
  });

  test('AUTH-EDGE-2: tampered token is rejected as unauthorized', async () => {
    const { accessToken } = await createSignedInClient(fixture!.regularUser);
    const tamperedToken = `${accessToken.slice(0, -1)}x`;

    const { response, body } = await callFunction('deploy-bot-data', {
      bearerToken: tamperedToken,
      body: { action: 'update_timestamp', facility_id: String(fixture!.ownedLegacyFacilityId) },
    });

    // 기대 결과: 위조/변조 토큰은 401이어야 한다.
    expect([401, 403]).toContain(response.status);
    expect(body).toBeTruthy();
    expect(JSON.stringify(body)).toMatch(/401|403|invalid jwt|unauthorized/i);
  });

  test('AUTH-EDGE-3: regular user is blocked from admin-only edge function', async () => {
    const { accessToken } = await createSignedInClient(fixture!.regularUser);

    const { response, body } = await callFunction('deploy-bot-data', {
      bearerToken: accessToken,
      body: { action: 'update_timestamp', facility_id: String(fixture!.ownedLegacyFacilityId) },
    });

    // 기대 결과: 일반 사용자는 관리자 API에 접근할 수 없어야 한다.
    expect(response.status).toBe(403);
    expect(body).toMatchObject({ success: false, error: 'Forbidden: admin access required' });
  });

  test('AUTH-EDGE-4: facility_admin cannot update another facility bot_data', async () => {
    const { accessToken } = await createSignedInClient(fixture!.facilityAdminUser);

    const { response, body } = await callFunction('deploy-bot-data', {
      bearerToken: accessToken,
      body: { action: 'update_timestamp', facility_id: String(fixture!.foreignLegacyFacilityId) },
    });

    // 기대 결과: 타 시설 접근은 403이어야 한다.
    expect(response.status).toBe(403);
    expect(body).toMatchObject({ success: false, error: 'Forbidden: facility ownership required' });
  });

  test('AUTH-EDGE-5: regular user token is blocked from approve-partner', async () => {
    const { accessToken } = await createSignedInClient(fixture!.regularUser);

    const { response, body } = await callFunction('approve-partner', {
      bearerToken: accessToken,
      body: { inquiryId: 999999999, action: 'approve' },
    });

    // 기대 결과: UI 숨김과 무관하게 서버에서 super_admin 권한을 검사해야 한다.
    expect(response.status).toBe(403);
    expect(body).toMatchObject({ error: 'Unauthorized' });
  });

  test('AUTH-EDGE-6: verify-payment rejects unauthenticated requests before business logic', async () => {
    const { response, body } = await callFunction('verify-payment', {
      body: { paymentId: 'test-payment' },
    });

    // 기대 결과: 인증 없는 호출은 401이어야 한다.
    expect(response.status).toBe(401);
    expect(body).toBeTruthy();
    expect(JSON.stringify(body)).toMatch(/401|missing authorization/i);
  });
});
