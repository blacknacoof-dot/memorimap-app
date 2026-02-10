const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function compareTables() {
    console.log('--- [Facilities Sample] ---')
    const { data: fRecords } = await supabase.from('facilities').select('id, name, image_url').limit(5)
    console.table(fRecords)

    console.log('\n--- [Memorial Spaces Sample] ---')
    const { data: mRecords } = await supabase.from('memorial_spaces').select('id, name, image_url').limit(5)
    console.table(mRecords)
}

compareTables()
