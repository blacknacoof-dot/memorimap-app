
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePetKnightImage() {
    console.log('Updating Pet Knight Image...');

    // Use a generic, calm, facility-focused image for Pet Knight
    // This is a placeholder or a safer bet than random crawling
    const safeImage = "https://images.unsplash.com/photo-1596272875729-ed2c21d50c6d?q=80&w=800&auto=format&fit=crop";

    const { error } = await supabase
        .from('memorial_spaces')
        .update({ image_url: safeImage })
        .ilike('name', '%펫나잇%');

    if (error) {
        console.error('Error updating image:', error);
    } else {
        console.log('✅ Successfully updated Pet Knight image to safe version.');
    }
}

updatePetKnightImage();
