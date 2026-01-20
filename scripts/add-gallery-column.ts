import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addGalleryImagesColumn() {
    console.log('🔧 Adding gallery_images column to facilities table...\n');

    // Add the column
    const { error } = await supabase.rpc('exec_sql', {
        query: `
            -- Add gallery_images column (array of text URLs)
            ALTER TABLE facilities
            ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

            -- Add comment
            COMMENT ON COLUMN facilities.gallery_images IS 'Array of gallery image URLs for the facility';

            -- Create index for better query performance
            CREATE INDEX IF NOT EXISTS idx_facilities_gallery_images 
            ON facilities USING GIN (gallery_images);
        `
    });

    if (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📝 You may need to run this SQL directly in Supabase Dashboard:\n');
        console.log('ALTER TABLE facilities ADD COLUMN IF NOT EXISTS gallery_images TEXT[];');
        console.log('CREATE INDEX IF NOT EXISTS idx_facilities_gallery_images ON facilities USING GIN (gallery_images);');
        process.exit(1);
    }

    console.log('✅ Successfully added gallery_images column!\n');
}

addGalleryImagesColumn();
