const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
    console.log('--- [Facilities Sample] ---')
    const { data: facilities, error: fError } = await supabase
        .from('facilities')
        .select('name, image_url, rating, review_count')
        .limit(5)

    if (fError) console.error('facilities error:', fError)
    else console.table(facilities)

    console.log('\n--- [Funeral Companies Sample] ---')
    const { data: companies, error: cError } = await supabase
        .from('funeral_companies')
        .select('name, image_url, rating, review_count')
        .limit(5)

    if (cError) console.error('funeral_companies error:', cError)
    else console.table(companies)
}

checkData()
