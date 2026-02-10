import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables')
    if (error) {
        // Fallback: search_facilities_v2 might give us a clue or just query information_schema if we have an RPC for it
        console.log('RPC get_tables failed. Trying direct query if possible...')
        const { data: tables, error: schemaError } = await supabase.from('facilities').select('id').limit(1)
        if (schemaError) console.error('facilities error:', schemaError)
        else console.log('facilities table exists')

        const { data: spaces, error: spacesError } = await supabase.from('memorial_spaces').select('id').limit(1)
        if (spacesError) console.error('memorial_spaces error:', spacesError)
        else console.log('memorial_spaces table exists')
    } else {
        console.log('Tables:', data)
    }
}

listTables()
