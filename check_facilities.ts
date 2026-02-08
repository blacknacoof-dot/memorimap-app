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

async function checkSchema() {
    const { data, error } = await supabase.from('facilities').select('*').limit(1)
    if (error) {
        console.error('Error:', error)
        return
    }
    console.log('Sample Row Keys:', Object.keys(data[0]))
    console.log('Sample Row Data:', data[0])
}

checkSchema()
