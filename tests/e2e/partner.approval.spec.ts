import { test, expect } from '@playwright/test';
import { supabase } from './db.utils';

interface UserFixture {
  id: string;
  email: string;
  password: string;
}

interface PartnerFixture {
  admin: UserFixture;
  applicant: UserFixture;
}

const randomToken = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createFixtureUser = async (role: 'user' | 'super_admin', marker: string): Promise<UserFixture> => {
  const token = randomToken();
  const email = `${marker}.${role}.${token}@example.com`.toLowerCase();
  const password = `Partner!${token}Aa`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user?.id) {
    throw new Error(`Failed to create fixture user (${role}): ${error?.message || 'unknown'}`);
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
      throw new Error(`Failed to upsert super_admins fixture: ${superAdminError.message}`);
    }
  }

  return { id: userId, email, password };
};

const marker = `partner-flow-${Date.now()}`;
const companyName = `${marker}-company`;
const companyEmail = `${marker}@example.com`;

let fixture: PartnerFixture | null = null;
let inquiryId: number | null = null;
const createdInquiryIds: number[] = [];

test.describe('Flow C: Partner Approval -> Permission -> Facility Access', () => {
  test.beforeAll(async () => {
    const admin = await createFixtureUser('super_admin', marker);
    const applicant = await createFixtureUser('user', marker);
    fixture = { admin, applicant };
  });

  test.afterAll(async () => {
    if (!fixture) return;

    await supabase.from('facilities').delete().eq('user_id', fixture.applicant.id);
    await supabase.from('partners').delete().like('contact_email', `${marker}%`);
    await supabase.from('sangjo_hq_admins').delete().eq('user_id', fixture.applicant.id);
    await supabase.from('sangjo_dashboard_users').delete().eq('id', fixture.applicant.id);
    if (createdInquiryIds.length > 0) {
      await supabase.from('partner_inquiries').delete().in('id', createdInquiryIds);
    }
    await supabase.from('super_admins').delete().eq('user_id', fixture.admin.id);
    await supabase.from('profiles').delete().in('clerk_id', [fixture.admin.id, fixture.applicant.id]);

    await Promise.all([
      supabase.auth.admin.deleteUser(fixture.admin.id),
      supabase.auth.admin.deleteUser(fixture.applicant.id),
    ]);
  });

  test('C-1: Create partner inquiry with pending status', async () => {
    const fx = fixture!;
    const { data, error } = await supabase
      .from('partner_inquiries')
      .insert({
        company_name: companyName,
        company_email: companyEmail,
        contact_person: 'E2E Partner Applicant',
        contact_number: '010-0000-0000',
        manager_name: 'E2E Partner Applicant',
        phone: '010-0000-0000',
        type: 'join',
        business_type: 'sangjo_hq',
        status: 'pending',
        user_id: fx.applicant.id,
        message: 'E2E partner approval test',
        email: companyEmail,
        manager_mobile: '010-0000-0000',
        address: 'E2E partner address',
      })
      .select('id, status')
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.status).toBe('pending');

    inquiryId = Number(data!.id);
    createdInquiryIds.push(inquiryId);
  });

  test('C-2: Pre-approval applicant is user and has no facility', async () => {
    const fx = fixture!;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', fx.applicant.id)
      .single();
    expect(profile?.role).toBe('user');

    const { data: facilities } = await supabase
      .from('facilities')
      .select('id')
      .eq('user_id', fx.applicant.id);
    expect(facilities?.length).toBe(0);
  });

  test('C-3: approve_partner_transaction succeeds', async () => {
    const fx = fixture!;
    expect(inquiryId).not.toBeNull();

    const { data, error } = await supabase.rpc('approve_partner_transaction', {
      p_inquiry_id: inquiryId!,
      p_admin_id: fx.admin.id,
    });

    expect(error).toBeNull();
    const payload = (data as { success?: boolean; facility_id?: string; partner_id?: string; error?: string } | null) ?? null;
    expect(payload?.success, payload?.error || 'approve_partner_transaction returned success=false').toBe(true);
    expect(payload?.facility_id).toBeTruthy();
    expect(payload?.partner_id).toBeTruthy();
  });

  test('C-4: Applicant role is upgraded after approval', async () => {
    const fx = fixture!;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', fx.applicant.id)
      .single();

    expect(error).toBeNull();
    expect(profile?.role).not.toBe('user');
    expect(['sangjo_hq_admin', 'sangjo_user', 'facility_admin']).toContain(profile!.role);
  });

  test('C-5: Approved inquiry creates verified facility', async () => {
    const fx = fixture!;
    const { data: facilities, error } = await supabase
      .from('facilities')
      .select('id, name, user_id, verified')
      .eq('user_id', fx.applicant.id);

    expect(error).toBeNull();
    expect(facilities).toBeDefined();
    expect(facilities!.length).toBeGreaterThanOrEqual(1);

    const created = facilities![0];
    expect(created.user_id).toBe(fx.applicant.id);
    expect(created.verified).toBe(true);
  });

  test('C-6: Approved inquiry creates partner record', async () => {
    const { data: partner, error } = await supabase
      .from('partners')
      .select('status, company_name, contact_email')
      .eq('contact_email', companyEmail)
      .single();

    expect(error).toBeNull();
    expect(partner!.status).toBe('approved');
    expect(partner!.company_name).toBe(companyName);
  });

  test('C-7: Re-approving same inquiry is blocked', async () => {
    const fx = fixture!;
    const { data, error } = await supabase.rpc('approve_partner_transaction', {
      p_inquiry_id: inquiryId!,
      p_admin_id: fx.admin.id,
    });

    expect(error).toBeNull();
    const payload = (data as { success?: boolean; error?: string } | null) ?? null;
    expect(payload?.success).toBe(false);
    expect(payload?.error).toBeTruthy();
  });

  test('C-8: reject_partner_transaction sets rejected status', async () => {
    const fx = fixture!;
    const rejectEmail = `${marker}.reject.${Date.now()}@example.com`;
    const { data: pending, error: createError } = await supabase
      .from('partner_inquiries')
      .insert({
        company_name: `${companyName}-reject`,
        company_email: rejectEmail,
        contact_person: 'E2E Reject Candidate',
        contact_number: '010-9999-9999',
        manager_name: 'E2E Reject Candidate',
        phone: '010-9999-9999',
        type: 'join',
        business_type: 'funeral_home',
        status: 'pending',
        user_id: fx.applicant.id,
        message: 'E2E rejection test',
      })
      .select('id')
      .single();

    expect(createError).toBeNull();
    const rejectInquiryId = Number(pending!.id);
    createdInquiryIds.push(rejectInquiryId);

    const { data, error } = await supabase.rpc('reject_partner_transaction', {
      p_inquiry_id: rejectInquiryId,
      p_admin_id: fx.admin.id,
      p_reason: 'E2E rejection path',
    });

    expect(error).toBeNull();
    const payload = (data as { success?: boolean; action?: string } | null) ?? null;
    expect(payload?.success).toBe(true);
    expect(payload?.action).toBe('rejected');

    const { data: rejected, error: rejectedError } = await supabase
      .from('partner_inquiries')
      .select('status')
      .eq('id', rejectInquiryId)
      .single();

    expect(rejectedError).toBeNull();
    expect(rejected!.status).toBe('rejected');
  });
});
