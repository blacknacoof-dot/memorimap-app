
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (value) process.env[key.trim()] = value;
            }
        });
        console.log('✅ Loaded .env.local');
    } else {
        console.log('❌ .env.local not found');
    }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase credentials missing in process.env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
    console.log('🔍 Testing connection to funeral_companies table...');

    // 1. Try to select
    const { data: selectData, error: selectError } = await supabase
        .from('funeral_companies')
        .select('*')
        .limit(1);

    if (selectError) {
        console.error('❌ Select Error:', selectError);
    } else {
        console.log('✅ Select successful. Found:', selectData?.length, 'rows');
    }

    // 2. Try to upsert a test record
    console.log('🧪 Testing upsert...');
    const testData = {
        id: 'test-diagnostic',
        name: 'Diagnostic Test Company',
        rating: 5.0,
        review_count: 0,
        features: ['Test Feature'],
        benefits: ['Test Benefit']
    };

    const { data: upsertData, error: upsertError } = await supabase
        .from('funeral_companies')
        .upsert(testData);

    if (upsertError) {
        console.error('❌ Upsert Error:', upsertError);
    } else {
        console.log('✅ Upsert successful');
    }

    // 3. Clean up
    if (!upsertError) {
        await supabase.from('funeral_companies').delete().eq('id', 'test-diagnostic');
        console.log('🧹 Cleaned up test record');
    }
}

diagnose();
