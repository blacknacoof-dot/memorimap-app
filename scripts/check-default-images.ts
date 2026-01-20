import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 기본 이미지 URL 패턴들
const DEFAULT_IMAGE_PATTERNS = [
    '/images/default_sangjo.png',
    'default',
    'placeholder',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400' // 기본 Unsplash 이미지
];

async function checkDefaultImages() {
    console.log('🔍 Checking for companies with default images...\n');

    const { data: companies, error } = await supabase
        .from('funeral_companies')
        .select('id, name, image_url')
        .order('name');

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (!companies) {
        console.log('No companies found');
        return;
    }

    console.log(`📊 Total companies: ${companies.length}\n`);

    const companiesWithDefaultImages = companies.filter(company => {
        if (!company.image_url) return true; // null or undefined

        // Check if image_url matches any default pattern
        return DEFAULT_IMAGE_PATTERNS.some(pattern =>
            company.image_url.includes(pattern)
        );
    });

    console.log('🖼️  Companies with default images:\n');
    console.log('━'.repeat(60));

    companiesWithDefaultImages.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Image: ${company.image_url || 'NULL'}`);
        console.log('');
    });

    console.log('━'.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total companies: ${companies.length}`);
    console.log(`   With default images: ${companiesWithDefaultImages.length}`);
    console.log(`   With custom images: ${companies.length - companiesWithDefaultImages.length}`);
    console.log(`   Percentage with defaults: ${((companiesWithDefaultImages.length / companies.length) * 100).toFixed(1)}%`);
}

checkDefaultImages();
