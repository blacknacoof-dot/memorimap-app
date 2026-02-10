import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addGalleryColumn() {
    console.log('🔧 Attempting to add gallery_images column...\n');

    try {
        // First, let's try to create an RPC function to execute SQL
        console.log('Step 1: Creating exec_sql RPC function...');

        const createFunctionSQL = `
            CREATE OR REPLACE FUNCTION exec_sql(query text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                EXECUTE query;
            END;
            $$;
        `;

        // We can't execute DDL directly via Supabase client, 
        // but we can use a workaround with the PostgREST API

        console.log('\n📝 Please execute this SQL in Supabase Dashboard > SQL Editor:\n');
        console.log('='.repeat(70));
        console.log(createFunctionSQL);
        console.log('\n-- Then run this:');
        console.log(`
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

COMMENT ON COLUMN facilities.gallery_images IS 'Array of gallery image URLs for the facility';

CREATE INDEX IF NOT EXISTS idx_facilities_gallery_images 
ON facilities USING GIN (gallery_images);
        `);
        console.log('='.repeat(70));

        console.log('\n💡 Alternative: 브라우저에서 Supabase 대시보드를 열어드릴까요?\n');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

addGalleryColumn();
