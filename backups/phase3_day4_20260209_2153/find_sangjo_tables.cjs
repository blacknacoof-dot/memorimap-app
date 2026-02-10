const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function findTables() {
    // List some common names
    const names = [
        'funeral_companies_backup_v1',
        'funeral_companies_backup_v2',
        'memorial_spaces',
        'sangjo_hq_admins',
        'facility_submissions'
    ]
    for (const n of names) {
        const { data, error } = await supabase.from(n).select('id').limit(1)
        if (!error) console.log(`Table exists: ${n}`)
    }
}

findTables()
