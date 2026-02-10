
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

async function removeDuplicate() {
  console.log('Deleting duplicate ID: 9...');
  const { error } = await supabase.from('memorial_spaces').delete().eq('id', 9);
  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log('Successfully deleted duplicate ID: 9');
  }
}

removeDuplicate();
