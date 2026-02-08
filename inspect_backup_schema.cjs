const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSchema() {
    console.log('--- [Inspecting facilities_backup_v4] ---')
    // Get one record to see all keys
    const { data, error } = await supabase.from('facilities_backup_v4').select('*').limit(1)
    if (error) {
        console.error('Error:', error.message)
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
        console.log('Sample Data:', data[0])
    } else {
        console.log('No data in facilities_backup_v4')
    }
}

inspectSchema()
