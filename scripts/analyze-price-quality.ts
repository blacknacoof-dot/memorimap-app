
import { supabase } from '../lib/supabaseClient';

async function analyzePriceQuality() {
    console.log('Starting price data quality analysis...');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, prices, price_info');

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log(`Total facilities: ${facilities.length}`);

    let stats = {
        total: facilities.length,
        funeral: { total: 0, missing: 0, empty: 0, placeholder: 0, good: 0 },
        memorial: { total: 0, missing: 0, empty: 0, placeholder: 0, good: 0 },
    };

    const missingList: any[] = [];

    for (const facility of facilities) {
        const isFuneral = facility.type === 'funeral';
        const category = isFuneral ? stats.funeral : stats.memorial;
        category.total++;

        const prices = facility.prices;
        const priceInfo = facility.price_info;

        // 1. Completely missing (null)
        if (!prices && !priceInfo) {
            category.missing++;
            missingList.push({ id: facility.id, name: facility.name, type: facility.type, reason: 'NULL' });
            continue;
        }

        // 2. Empty Object or Array
        if (prices && typeof prices === 'object' && Object.keys(prices).length === 0 && !priceInfo) {
            category.empty++;
            missingList.push({ id: facility.id, name: facility.name, type: facility.type, reason: 'EMPTY_OBJ' });
            continue;
        }

        // check content of prices if it exists
        let hasValidPrice = false;
        if (prices) {
            if (Array.isArray(prices)) {
                // Case: Array of price objects [{item:..., price:...}]
                for (const item of prices) {
                    if (item && item.price && /\d/.test(String(item.price))) {
                        hasValidPrice = true;
                    }
                }
            } else if (typeof prices === 'object') {
                // Case: Key-value object
                const values = Object.values(prices);
                for (const val of values) {
                    if (typeof val === 'number' && val > 0) hasValidPrice = true;
                    if (typeof val === 'string' && /\d/.test(val)) hasValidPrice = true;
                }
            }
        }

        // If no valid keys in prices, check price_info
        if (!hasValidPrice) {
            if (priceInfo && priceInfo.length > 10) {
                // Assume valid if textual description exists
                category.good++;
            } else {
                category.placeholder++;
                missingList.push({ id: facility.id, name: facility.name, type: facility.type, reason: 'PLACEHOLDER/INVALID' });
            }
        } else {
            category.good++;
        }
    }

    console.log('\n=== Analysis Results ===');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n=== Summary ===');
    console.log(`Total Effectively Missing: ${stats.funeral.missing + stats.funeral.empty + stats.funeral.placeholder + stats.memorial.missing + stats.memorial.empty + stats.memorial.placeholder}`);
    console.log(`- Funeral Missing: ${stats.funeral.missing + stats.funeral.empty + stats.funeral.placeholder}`);
    console.log(`- Memorial Missing: ${stats.memorial.missing + stats.memorial.empty + stats.memorial.placeholder}`);

}

analyzePriceQuality();
