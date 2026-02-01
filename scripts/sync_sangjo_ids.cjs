const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function syncSangjo() {
    console.log('🚀 Starting Sangjo ID Synchronization...');

    // 1. Fetch all existing funeral_companies
    const { data: fcData, error: fcError } = await supabase
        .from('funeral_companies')
        .select('*');

    if (fcError) {
        console.error('Error fetching funeral_companies:', fcError);
        return;
    }
    console.log(`Found ${fcData.length} records in funeral_companies.`);

    // 2. Fetch all facilities with type='상조'
    const { data: facData, error: facError } = await supabase
        .from('facilities')
        .select('*')
        .eq('type', '상조');

    if (facError) {
        console.error('Error fetching facilities:', facError);
        return;
    }
    console.log(`Found ${facData.length} sangjo facilities.`);

    const idMap = new Map(); // Map originalId -> newId (UUID)

    for (const fc of fcData) {
        // Find existing match by name
        let match = facData.find(fac =>
            fac.name.replace(/\s/g, '').includes(fc.name.replace(/\s/g, '')) ||
            fc.name.replace(/\s/g, '').includes(fac.name.replace(/\s/g, ''))
        );

        let targetId;

        if (match) {
            targetId = match.id;
            console.log(`✅ Match found: ${fc.name} -> ${match.name} (${targetId})`);
        } else {
            // Register new facility
            const newFacility = {
                name: fc.name,
                type: '상조',
                description: fc.description,
                phone: fc.phone,
                image_url: fc.image_url,
                price_range: fc.price_range,
                status: 'active'
            };

            const { data: created, error: createError } = await supabase
                .from('facilities')
                .insert([newFacility])
                .select()
                .single();

            if (createError) {
                console.error(`❌ Failed to register ${fc.name}:`, createError);
                continue;
            }
            targetId = created.id;
            console.log(`🆕 Registered new facility: ${fc.name} -> ${targetId}`);
        }

        idMap.set(fc.id, targetId);
    }

    // 3. Update references in facility_reviews
    console.log('\n🔄 Updating facility_reviews references...');
    for (const [oldId, newId] of idMap.entries()) {
        const { data, error } = await supabase
            .from('facility_reviews')
            .update({ facility_id: newId })
            .eq('facility_id', oldId);

        if (error) {
            console.error(`❌ Failed to update reviews for ${oldId}:`, error);
        } else {
            console.log(`✅ Updated reviews for ${oldId} -> ${newId}`);
        }
    }

    // 4. Update references in sangjo_favorites
    console.log('\n🔄 Updating sangjo_favorites references...');
    for (const [oldId, newId] of idMap.entries()) {
        const { error } = await supabase
            .from('sangjo_favorites')
            .update({ company_id: newId })
            .eq('company_id', oldId);

        if (error) {
            console.error(`❌ Failed to update favorites for ${oldId}:`, error);
        } else {
            console.log(`✅ Updated favorites for ${oldId} -> ${newId}`);
        }
    }

    // 5. Replace funeral_companies records with new UUID IDs
    // Since ID is a primary key, we insert new then delete old.
    console.log('\n🔄 Replacing funeral_companies primary keys...');
    for (const fc of fcData) {
        const newId = idMap.get(fc.id);
        if (!newId || newId === fc.id) continue;

        const { id, created_at, updated_at, ...updateData } = fc;
        const insertData = {
            ...updateData,
            id: newId
        };

        const { error: insertError } = await supabase
            .from('funeral_companies')
            .insert([insertData]);

        if (insertError) {
            if (insertError.code === '23505') {
                console.log(`⚠️ New ID ${newId} already exists in funeral_companies, skipping insert.`);
            } else {
                console.error(`❌ Failed to insert new funeral_company record for ${fc.name}:`, insertError);
                continue;
            }
        }

        const { error: deleteError } = await supabase
            .from('funeral_companies')
            .delete()
            .eq('id', fc.id);

        if (deleteError) {
            console.error(`❌ Failed to delete old record for ${fc.name}:`, deleteError);
        } else {
            console.log(`✅ Successfully migrated ${fc.name} to UUID ${newId}`);
        }
    }

    console.log('\n✨ Synchronization Complete!');
}

syncSangjo();
