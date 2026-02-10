import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mimic constants.ts
const FUNERAL_COMPANIES = [
    { id: 'fc_new_7', name: '부모사랑' },
    // others...
];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function simulate() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch Companies
    const { data: dbCompanies } = await supabase.from('funeral_companies').select('*');

    // 2. Prepare IDs
    const companyIds = dbCompanies.map(item => item.id);
    const staticIds = dbCompanies.map(item => {
        const match = FUNERAL_COMPANIES.find(c => c.name.replace(/\s/g, '') === item.name.replace(/\s/g, ''));
        return match?.id;
    }).filter(Boolean);

    const allTargetIds = Array.from(new Set([...companyIds, ...staticIds]));

    // 3. Fetch Reviews
    const { data: allReviews } = await supabase
        .from('reviews')
        .select('*')
        .in('facility_id', allTargetIds);

    // 4. Group (Current Logic)
    const reviewsByCompany = new Map();
    allReviews?.forEach(review => {
        const companyId = review.facility_id?.toString();
        if (companyId) {
            if (!reviewsByCompany.has(companyId)) {
                reviewsByCompany.set(companyId, []);
            }
            reviewsByCompany.get(companyId).push(review);
        }
    });

    // 5. Map (Current Logic)
    const mappingResults = dbCompanies.map(item => {
        const staticMatch = FUNERAL_COMPANIES.find(c => c.name.replace(/\s/g, '') === item.name.replace(/\s/g, ''));
        const dbId = item.id.toString();
        const staticId = staticMatch?.id?.toString();

        const reviews = [
            ...(reviewsByCompany.get(dbId) || []),
            ...(staticId ? (reviewsByCompany.get(staticId) || []) : [])
        ];

        return {
            name: item.name,
            dbId,
            staticId,
            reviewCount: reviews.length,
            foundInMap: {
                dbId: reviewsByCompany.has(dbId),
                staticId: staticId ? reviewsByCompany.has(staticId) : false
            }
        };
    });

    fs.writeFileSync('debug_mapping_simulation.json', JSON.stringify({
        allTargetIds,
        reviewCount: allReviews?.length,
        mappingResults: mappingResults.filter(r => r.reviewCount > 0 || r.name === '부모사랑')
    }, null, 2));
    console.log('DONE');
}

simulate();
