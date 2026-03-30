import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabase } from './db.utils';

interface IsolationUser {
  id: string;
  email: string;
  password: string;
}

interface IsolationFixture {
  userA: IsolationUser;
  userB: IsolationUser;
  notificationIdA: string;
  notificationIdB: string;
  reservationIdB: string;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for auth isolation tests');
}

const functionsBaseUrl = `${supabaseUrl}/functions/v1`;

const randomToken = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createIsolationUser = async (marker: string, suffix: string): Promise<IsolationUser> => {
  const token = randomToken();
  const email = `${marker}.${suffix}.${token}@example.com`.toLowerCase();
  const password = `Iso!${token}Aa`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user?.id) {
    throw new Error(`Failed to create isolation auth user (${suffix}): ${error?.message || 'unknown'}`);
  }

  const userId = data.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    clerk_id: userId,
    email,
    full_name: `${marker}-${suffix}`,
    role: 'user',
  }, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Failed to upsert isolation profile (${suffix}): ${profileError.message}`);
  }

  return { id: userId, email, password };
};

const createSignedInClient = async (user: IsolationUser): Promise<{ client: SupabaseClient; accessToken: string }> => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error || !data.session?.access_token) {
    throw new Error(`Failed to sign in isolation fixture ${user.email}: ${error?.message || 'unknown'}`);
  }

  return { client, accessToken: data.session.access_token };
};

let fixture: IsolationFixture | null = null;

test.describe.serial('Auth/Authz: data isolation and token reuse', () => {
  test.beforeAll(async () => {
    const marker = `auth-iso-${Date.now()}`;
    const userA = await createIsolationUser(marker, 'a');
    const userB = await createIsolationUser(marker, 'b');

    const { data: notificationA, error: notificationAError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userA.id,
        title: `${marker}-a`,
        message: 'notification for user A',
        type: 'info',
      })
      .select('id')
      .single();

    if (notificationAError || !notificationA?.id) {
      throw new Error(`Failed to create user A notification fixture: ${notificationAError?.message || 'unknown'}`);
    }

    const { data: notificationB, error: notificationBError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userB.id,
        title: `${marker}-b`,
        message: 'notification for user B',
        type: 'info',
      })
      .select('id')
      .single();

    if (notificationBError || !notificationB?.id) {
      throw new Error(`Failed to create user B notification fixture: ${notificationBError?.message || 'unknown'}`);
    }

    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('id')
      .limit(1)
      .single();

    if (facilityError || !facility?.id) {
      throw new Error(`Failed to find fixture facility for reservation test: ${facilityError?.message || 'unknown'}`);
    }

    const reservationIdB = crypto.randomUUID();
    const { error: reservationError } = await supabase.from('reservations').insert({
      id: reservationIdB,
      user_id: userB.id,
      facility_id: facility.id,
      visit_date: new Date().toISOString(),
      time_slot: '13:00',
      visitor_name: 'Isolation User B',
      visitor_count: 1,
      message: 'auth isolation fixture',
      status: 'pending',
      contact_number: '010-9999-0000',
    });

    if (reservationError) {
      throw new Error(`Failed to create reservation isolation fixture: ${reservationError.message}`);
    }

    fixture = {
      userA,
      userB,
      notificationIdA: String(notificationA.id),
      notificationIdB: String(notificationB.id),
      reservationIdB,
    };
  });

  test.afterAll(async () => {
    if (!fixture) return;

    await supabase.from('reservations').delete().eq('id', fixture.reservationIdB);
    await supabase.from('user_notifications').delete().in('id', [
      fixture.notificationIdA,
      fixture.notificationIdB,
    ]);
    await supabase.from('profiles').delete().in('clerk_id', [fixture.userA.id, fixture.userB.id]);
    await supabase.auth.admin.deleteUser(fixture.userA.id);
    await supabase.auth.admin.deleteUser(fixture.userB.id);
  });

  test('AUTH-DATA-1: anonymous client cannot read protected notification rows', async () => {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await anonClient
      .from('user_notifications')
      .select('id, user_id')
      .eq('id', fixture!.notificationIdA);

    // 기대 결과: 비로그인 사용자는 개인 알림에 접근할 수 없어야 한다.
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  test('AUTH-DATA-2: user A cannot read user B notification', async () => {
    const { client } = await createSignedInClient(fixture!.userA);

    const { data, error } = await client
      .from('user_notifications')
      .select('id, user_id')
      .eq('id', fixture!.notificationIdB);

    // 기대 결과: 사용자 A는 사용자 B의 개인 알림을 볼 수 없어야 한다.
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  test('AUTH-DATA-3: user A cannot read user B reservation directly', async () => {
    const { client } = await createSignedInClient(fixture!.userA);

    const { data, error } = await client
      .from('reservations')
      .select('id, user_id, status')
      .eq('id', fixture!.reservationIdB)
      .maybeSingle();

    // 기대 결과: 사용자 A는 사용자 B의 예약 데이터를 직접 조회할 수 없어야 한다.
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  test('AUTH-DATA-4: logout invalidates old access token for protected edge function', async () => {
    const { client, accessToken } = await createSignedInClient(fixture!.userA);
    const { error: signOutError } = await client.auth.signOut();
    expect(signOutError).toBeNull();

    const response = await fetch(`${functionsBaseUrl}/deploy-bot-data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'update_timestamp', facility_id: '999999' }),
    });

    const body = await response.json() as Record<string, unknown>;

    // 기대 결과: 로그아웃 후 재사용 토큰은 401이어야 한다.
    // 실패 시 의미: access token이 로그아웃 직후에도 유효해 즉시 세션 폐기가 보장되지 않는다.
    expect(response.status).toBe(401);
    expect(body).toMatchObject({ success: false, error: 'Unauthorized' });
  });
});
