/**
 * Supabase Data Migration Script
 * 
 * This script migrates facility and funeral company data from constants.ts to Supabase.
 * Run this script using: npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { FACILITIES, FUNERAL_COMPANIES } from '../constants';
import * as path from 'path';
import * as fs from 'fs';

// --- Environment Setup ---
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
    }
}

loadEnv();

// ⚠️ IMPORTANT: Use Service Role Key for migration to bypass RLS
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase credentials missing. Please check .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateFacilities() {
    console.log('🏛️  Migrating facilities to Supabase...');

    const facilitiesData = FACILITIES.map(facility => ({
        id: facility.id,
        name: facility.name,
        type: facility.type,
        religion: facility.religion,
        address: facility.address,
        lat: facility.lat,
        lng: facility.lng,
        price_range: facility.priceRange,
        rating: facility.rating,
        review_count: facility.reviewCount,
        image_url: facility.imageUrl,
        description: facility.description,
        features: facility.features,
        phone: facility.phone,
        prices: facility.prices,
        gallery_images: facility.galleryImages,
        reviews: facility.reviews,
        naver_booking_url: facility.naverBookingUrl || null
    }));

    const { data, error } = await supabase
        .from('memorial_spaces')
        .upsert(facilitiesData, { onConflict: 'id' });

    if (error) {
        console.error('❌ Error migrating facilities:', error);
        throw error;
    }

    console.log(`✅ Successfully migrated ${FACILITIES.length} facilities`);
    return data;
}

async function migrateFuneralCompanies() {
    console.log('🏢 Migrating funeral companies to Supabase...');

    const companiesData = FUNERAL_COMPANIES.map(company => ({
        id: company.id,
        name: company.name,
        rating: company.rating,
        review_count: company.reviewCount,
        image_url: company.imageUrl,
        description: company.description,
        features: company.features,
        phone: company.phone,
        price_range: company.priceRange,
        benefits: company.benefits
    }));

    const { data, error } = await supabase
        .from('funeral_companies')
        .upsert(companiesData, { onConflict: 'id' });

    if (error) {
        console.error('❌ Error migrating funeral companies:', error);
        throw error;
    }

    console.log(`✅ Successfully migrated ${FUNERAL_COMPANIES.length} funeral companies`);

    // Log sample items to verify
    if (companiesData.length > 0) {
        console.log(`📝 Sample: ${companiesData[0].name} (ID: ${companiesData[0].id})`);
    }

    return data;
}

async function verifyMigration() {
    console.log('🔍 Verifying migration...');

    // Check facilities count
    const { count: facilityCount, error: facilityError } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true });

    if (facilityError) {
        console.error('❌ Error verifying facilities:', facilityError);
    } else {
        console.log(`📊 Total facilities in DB: ${facilityCount}`);
    }

    // Check funeral companies count
    const { count: companyCount, error: companyError } = await supabase
        .from('funeral_companies')
        .select('*', { count: 'exact', head: true });

    if (companyError) {
        console.error('❌ Error verifying funeral companies:', companyError);
    } else {
        console.log(`📊 Total funeral companies in DB: ${companyCount}`);
    }
}

async function main() {
    console.log('🚀 Starting Supabase data migration...\n');

    try {
        // Step 1: Migrate facilities
        await migrateFacilities();
        console.log('');

        // Step 2: Migrate funeral companies
        await migrateFuneralCompanies();
        console.log('');

        // Step 3: Verify migration
        await verifyMigration();
        console.log('');

        console.log('🎉 Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Check your Supabase dashboard to verify the data');
        console.log('2. Test the app to ensure data loads from Supabase');
        console.log('3. Consider removing constants.ts data after verification');

    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
main();
