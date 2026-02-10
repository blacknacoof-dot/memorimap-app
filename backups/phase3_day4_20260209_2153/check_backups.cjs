const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBackups() {
    const backupTables = ['facilities_backup_v4', 'facilities_backup_20260122', 'funeral_companies_backup']
    for (const t of backupTables) {
        console.log(`\n--- [Checking ${t}] ---`)
        const { data, error } = await supabase.from(t).select('name, image_url, rating').limit(3)
        if (error) {
            console.log(`${t} does not exist or access denied: ${error.message}`)
        } else {
            console.table(data)
        }
    }
}

checkBackups()
