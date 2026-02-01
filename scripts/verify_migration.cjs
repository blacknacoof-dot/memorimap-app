const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyMigration() {
    console.log('🔍 ===== Migration Verification =====\n');

    try {
        // 1. Check funeral_company_legacy_mapping table
        const { data: mappings, error: mapError } = await supabase
            .from('funeral_company_legacy_mapping')
            .select('*')
            .order('old_id');

        if (mapError) {
            console.error('❌ Error fetching mappings:', mapError);
        } else {
            console.log(`✅ Total ID mappings: ${mappings.length}`);
            console.log('\n📋 Sample mappings:');
            mappings.slice(0, 5).forEach(m => {
                console.log(`   ${m.old_id} → ${m.new_id} (${m.company_name})`);
            });
        }

        // 2. Check for remaining legacy IDs in facility_reviews
        const { data: legacyReviews, error: reviewError } = await supabase
            .from('facility_reviews')
            .select('facility_id')
            .like('facility_id', 'fc%');

        if (reviewError) {
            console.error('❌ Error checking reviews:', reviewError);
        } else {
            if (legacyReviews.length > 0) {
                console.log(`\n⚠️  WARNING: ${legacyReviews.length} reviews still have legacy IDs`);
                console.log('Sample legacy review IDs:',
                    [...new Set(legacyReviews.map(r => r.facility_id))].slice(0, 5)
                );
            } else {
                console.log('\n✅ No legacy IDs found in facility_reviews');
            }
        }

        // 3. Check for remaining legacy IDs in sangjo_favorites
        const { data: legacyFavs, error: favError } = await supabase
            .from('sangjo_favorites')
            .select('company_id')
            .like('company_id', 'fc%');

        if (favError) {
            console.error('❌ Error checking favorites:', favError);
        } else {
            if (legacyFavs.length > 0) {
                console.log(`\n⚠️  WARNING: ${legacyFavs.length} favorites still have legacy IDs`);
            } else {
                console.log('✅ No legacy IDs found in sangjo_favorites');
            }
        }

        // 4. Verify 프리드라이프 specifically
        const { data: preed, error: preedError } = await supabase
            .from('funeral_companies')
            .select('id, name')
            .ilike('name', '%프리드라이프%')
            .single();

        if (preedError) {
            console.error('❌ Error fetching Preed Life:', preedError);
        } else {
            console.log('\n🏢 프리드라이프 verification:');
            console.log(`   ID: ${preed.id}`);
            console.log(`   Is UUID: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(preed.id) ? '✅' : '❌'}`);

            // Check its reviews
            const { data: preedReviews } = await supabase
                .from('facility_reviews')
                .select('id')
                .eq('facility_id', preed.id);

            console.log(`   Reviews: ${preedReviews?.length || 0}`);
        }

        // 5. Count totals
        const { count: fcCount } = await supabase
            .from('funeral_companies')
            .select('*', { count: 'exact', head: true });

        const { count: facCount } = await supabase
            .from('facilities')
            .select('*', { count: 'exact', head: true })
            .eq('type', '상조');

        console.log('\n📊 Final Counts:');
        console.log(`   funeral_companies: ${fcCount}`);
        console.log(`   facilities (상조): ${facCount}`);

        console.log('\n✨ Verification Complete!\n');

    } catch (error) {
        console.error('💥 Verification failed:', error);
    }
}

verifyMigration();
