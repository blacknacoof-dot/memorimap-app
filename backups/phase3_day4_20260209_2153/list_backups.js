const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
    const { data: tables, error } = await supabase.rpc('get_tables')
    if (error) {
        console.log('RPC get_tables failed. Trying query...')
        const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%backup%';`
        // We can't run raw SQL via supabase-js easily without an RPC. 
        // Let's just try to check common names
        const checks = ['facilities_backup', 'memorial_spaces_backup', 'facilities_backup_20260204', 'memorial_spaces_backup_20260204']
        for (const t of checks) {
            const { data, error: e } = await supabase.from(t).select('id').limit(1)
            if (!e) console.log(`Table exists: ${t}`)
        }
    } else {
        console.log('Tables:', tables)
    }
}

listTables()
