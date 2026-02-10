const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
// Using Service Role Key to bypass RLS for verification
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI1MTYwNCwiZXhwIjoyMDg1NjExNjA0fQ.TDmo5ltVxUfDBFxmb7jHjpYAfpKzXevBxDXjBqPn5Io';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLead() {
    console.log('Checking for latest lead...');
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching leads:', error);
        // Try consultations table if leads fails (fallback check)
        checkConsultations();
        return;
    }

    if (data && data.length > 0) {
        console.log('Found ' + data.length + ' leads.');
        console.log('Latest Lead:', JSON.stringify(data[0], null, 2));

        // Check if it matches the test data
        const latest = data[0];
        if (latest.contact_name === '테스트' || latest.contact_phone === '010-0000-0000') {
            console.log('MATCH FOUND: Test data confirmed.');
        } else {
            console.log('WARNING: Latest data does not match test data (Name: 테스트, Phone: 010-0000-0000).');
        }
    } else {
        console.log('No leads found in "leads" table.');
        checkConsultations();
    }
}

async function checkConsultations() {
    console.log('Checking "consultations" table...');
    const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching consultations:', error);
    } else if (data && data.length > 0) {
        console.log('Latest Consultation:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No data in consultations table either.');
    }
}

checkLead();
