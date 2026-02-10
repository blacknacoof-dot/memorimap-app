import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const FUNERAL_COMPANIES_STATIC = [
    { id: 'fc_new_7', name: '부모사랑' }
];

async function simulate() {
    console.log("🚀 Simulating FuneralCompanyView logic...");

    // 1. Fetch Companies
    const { data: companies } = await supabase
        .from('funeral_companies')
        .select('*')
        .ilike('name', '%부모사랑%');

    if (!companies || companies.length === 0) {
        console.error("❌ No companies found for '부모사랑'");
        return;
    }

    const company = companies[0];
    console.log(`🏢 Found Company: ${company.name}, ID: ${company.id}`);

    // 2. Prepare IDs for review fetch
    const companyIds = [company.id];
    const staticMatch = FUNERAL_COMPANIES_STATIC.find(c => c.name === company.name.replace(/\s/g, '')) ||
        FUNERAL_COMPANIES_STATIC.find(c => company.name.includes(c.name));

    const staticIds = [staticMatch?.id].filter(Boolean) as string[];
    const allTargetIds = Array.from(new Set([...companyIds, ...staticIds]));
    console.log(`🎯 Targeting IDs for reviews:`, allTargetIds);

    // 3. Fetch Reviews
    const idsString = allTargetIds.map(id => `"${id}"`).join(',');
    const { data: allReviews, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .or(`facility_id.in.(${idsString}),memorial_space_id.in.(${idsString})`);

    if (reviewError) {
        console.error("❌ Review fetch error:", reviewError);
        return;
    }

    console.log(`📝 Total reviews fetched: ${allReviews?.length || 0}`);

    // 4. Group reviews
    const reviewsByCompany = new Map<string, any[]>();
    allReviews?.forEach(review => {
        const companyId = review.facility_id || (review.memorial_space_id ? String(review.memorial_space_id) : null);
        if (companyId) {
            if (!reviewsByCompany.has(companyId)) {
                reviewsByCompany.set(companyId, []);
            }
            reviewsByCompany.get(companyId)!.push(review);
        }
    });

    console.log(`📊 Groups in Map:`, Array.from(reviewsByCompany.keys()));

    // 5. Map back
    const reviews = [
        ...(reviewsByCompany.get(company.id) || []),
        ...(staticMatch ? (reviewsByCompany.get(staticMatch.id) || []) : [])
    ];

    const uniqueReviews = Array.from(new Map(reviews.map(r => [r.id, r])).values());
    console.log(`✨ Final Mapped Review Count for ${company.name}: ${uniqueReviews.length}`);
    if (uniqueReviews.length > 0) {
        console.log(`✅ Sample Review Content:`, uniqueReviews[0].content);
    } else {
        console.error("❌ FAILURE: No reviews mapped to company!");
    }
}

simulate();
