
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSkyCastle() {
  console.log('=== Checking 스카이캐슬 facilities ===\n');

  const { data, error } = await supabase
    .from('memorial_spaces')
    .select('id, name, address, phone, type')
    .or('name.ilike.%스카이캐슬%,name.ilike.%분당%스카이%');

  if (error) { 
    console.error('Error:', error); 
    return; 
  }

  console.log(`Found ${data?.length || 0} facilities:\n`);
  data?.forEach(f => {
    console.log(`ID: ${f.id}`);
    console.log(`Name: ${f.name}`);
    console.log(`Address: ${f.address}`);
    console.log(`Phone: ${f.phone}`);
    console.log(`Type: ${f.type}`);
    console.log('---');
  });

  // Expected from Excel: 분당 스카이캐슬 - 경기도 광주시 오포읍 신현로 116 - 031-712-2000
  console.log('\n=== Expected from Excel ===');
  console.log('Name: 분당 스카이캐슬');
  console.log('Address: 경기도 광주시 오포읍 신현로 116');
  console.log('Phone: 031-712-2000');
}

checkSkyCastle();
