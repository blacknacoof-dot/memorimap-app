
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpvwqboflhxcenbxjzhv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdndxYm9mbGh4Y2VuYnhqemh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNjkzODIsImV4cCI6MjA0OTk0NTM4Mn0.Lh07GF765-XkMndzPGIY-tLnF_7LlH2F7hhaVRy7wng';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updatePrice() {
    console.log("Updating pricing for 증촌추모공원...");

    // 1. Find the facility
    const { data: facilities, error: searchError } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, prices')
        .ilike('name', '%증촌추모공원%');

    if (searchError) {
        console.error('Error searching:', searchError);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('Facility not found.');
        return;
    }

    const facility = facilities[0];
    console.log('Found facility:', facility.name, facility.id);
    console.log('Old prices:', JSON.stringify(facility.prices));

    // 2. Define new correct prices format for Park (Empty for now to fix UI)
    // Using the structure expected by FacilitySheet.tsx for non-funeral types
    // It expects an array of objects.
    const newPrices = [
        {
            type: "개인단",
            price: null, // null will trigger "상담 문의" in UI or "가격 정보 없음" depending on logic
            priceDisplay: "상담문의"
        },
        {
            type: "부부단",
            price: null,
            priceDisplay: "상담문의"
        }
    ];

    // 3. Update
    const { error: updateError } = await supabase
        .from('memorial_spaces')
        .update({
            prices: newPrices,
            // Ensure type is 'park' just in case
            type: 'park'
        })
        .eq('id', facility.id);

    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('Update successful!');
        console.log('New prices set to:', JSON.stringify(newPrices));
    }
}

updatePrice();
