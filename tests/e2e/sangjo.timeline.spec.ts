import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import type { SangjoContract } from '../../types';
import { addTimelineEvent, saveSangjoContract } from '../../lib/sangjoQueries';
import { supabase } from './db.utils';
import {
  createFacilityFixture,
  createHighRiskUser,
  createSangjoAdminLink,
  deleteHighRiskUser,
  type HighRiskUser,
} from './highRisk.helpers';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for sangjo timeline tests');
}

const marker = `sangjo-timeline-${Date.now()}`;

const createAuthenticatedClient = async (email: string, password: string) => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in sangjo fixture user: ${error.message}`);
  }

  return client;
};

let sangjoAdmin: HighRiskUser | null = null;
let sangjoFacility: { id: string; name: string; type: string } | null = null;

test.describe.serial('Sangjo AI timeline integration', () => {
  test.setTimeout(120000);

  test.beforeAll(async () => {
    sangjoAdmin = await createHighRiskUser('sangjo_hq_admin', marker);
    sangjoFacility = await createFacilityFixture({
      ownerId: sangjoAdmin.id,
      name: `${marker} Sangjo`,
      type: 'sangjo',
      verified: true,
      address: 'Sangjo timeline fixture address',
    });

    await createSangjoAdminLink({
      userId: sangjoAdmin.id,
      sangjoId: sangjoFacility.id,
      companyName: sangjoFacility.name,
    });
  });

  test.afterAll(async () => {
    if (sangjoFacility) {
      await supabase.from('sangjo_contract_timeline').delete().eq('contract_number', `TL-${marker}`);
      await supabase.from('sangjo_contracts').delete().eq('contract_number', `TL-${marker}`);
      await supabase.from('facilities').delete().eq('id', sangjoFacility.id);
    }

    if (sangjoAdmin) {
      await deleteHighRiskUser(sangjoAdmin.id);
    }
  });

  test('C-1: authenticated sangjo admin writes both contract and timeline records', async () => {
    const contractNumber = `TL-${marker}`;
    const customerPhone = `010-${String(Date.now()).slice(-4)}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const client = await createAuthenticatedClient(sangjoAdmin!.email, sangjoAdmin!.password);

    await supabase.from('sangjo_contract_timeline').delete().eq('contract_number', contractNumber);
    await supabase.from('sangjo_contracts').delete().eq('contract_number', contractNumber);

    const contract: SangjoContract = {
      id: crypto.randomUUID(),
      contract_number: contractNumber,
      sangjo_id: sangjoFacility!.id,
      customer_name: 'Timeline Test User',
      customer_phone: customerPhone,
      service_type: '채팅 상담',
      status: '상담신청',
      application_type: 'CONSULTATION',
      preferred_call_time: '14:00',
      total_price: 0,
      emergency_level: 'normal',
      created_at: new Date().toISOString(),
    };

    await saveSangjoContract(contract, client);
    await addTimelineEvent(
      contractNumber,
      '상담 요청',
      'AI 상조 상담 경로에서 생성된 타임라인 테스트',
      undefined,
      client,
    );

    const { data: savedContract, error: contractError } = await supabase
      .from('sangjo_contracts')
      .select('contract_number, sangjo_id, customer_name, status')
      .eq('contract_number', contractNumber)
      .single();

    expect(contractError).toBeNull();
    expect(savedContract).toMatchObject({
      contract_number: contractNumber,
      sangjo_id: sangjoFacility!.id,
      customer_name: 'Timeline Test User',
      status: '상담신청',
    });

    const { data: timelineRows, error: timelineError } = await supabase
      .from('sangjo_contract_timeline')
      .select('contract_number, event, notes')
      .eq('contract_number', contractNumber);

    expect(timelineError).toBeNull();
    expect(timelineRows).toBeTruthy();
    expect(timelineRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contract_number: contractNumber,
          event: '상담 요청',
          notes: 'AI 상조 상담 경로에서 생성된 타임라인 테스트',
        }),
      ]),
    );
  });
});
