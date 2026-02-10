const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMisclassification() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type')
        .ilike('name', '%추모공원%');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    const misclassified = [];
    const correctlyClassified = [];

    data.forEach((item) => {
        if (item.type !== 'park' && item.type !== 'complex') {
            misclassified.push({ name: item.name, currentType: item.type });
        } else {
            correctlyClassified.push({ name: item.name, currentType: item.type });
        }
    });

    console.log(`Total facilities with '추모공원' in name: ${data.length}`);
    console.log(`Classified as Park/Complex: ${correctlyClassified.length}`);
    console.log(`Classified as OTHER: ${misclassified.length}`);
    console.log('--- Examples of Misclassified (?) ---');
    console.table(misclassified.slice(0, 20)); // Show top 20
}

checkMisclassification();
