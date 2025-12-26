
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);
const KAKAO_KEY = process.env.VITE_KAKAO_REST_API_KEY;

interface Facility {
    id: number;
    name: string;
    address: string;
    type: string;
    lat: number;
    lng: number;
    is_verified: boolean;
}

interface MisplacedItem {
    facility: Facility;
    currentLoc: string;
    suggestedLoc: { lat: number, lng: number, address: string } | null;
    distance: number; // meters
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

async function findMisplaced() {
    console.log("🔍 Scanning for Misplaced Facilities (Same Coords, Different Address)...\n");

    // Fetch All
    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type, lat, lng, is_verified')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    // Group by Lat,Lng
    const coordMap = new Map<string, Facility[]>();
    allFacilities.forEach(f => {
        if (!f.lat || !f.lng) return;
        const key = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}`;
        if (!coordMap.has(key)) coordMap.set(key, []);
        coordMap.get(key)?.push(f);
    });

    const misplacedItems: MisplacedItem[] = [];

    // Filter for clusters with different addresses (First 5 chars distinct?)
    for (const [key, list] of coordMap.entries()) {
        if (list.length < 2) continue;

        // Check address diversity
        // If addresses are "Seoul, Mapo..." vs "Seoul, Gangnam...", clearly different.
        // We compare against the "Majority" address or checking if unique addresses > 1.

        const uniqueAddresses = new Set(list.map(f => f.address?.substring(0, 10))); // compare first 10 chars
        if (uniqueAddresses.size < 2) continue;

        console.log(`⚠️  Suspicious Cluster at ${key} (${list.length} items)`);

        // Check each item with Kakao API
        for (const f of list) {
            if (!KAKAO_KEY) {
                console.log("   Skipping API check (No Key)");
                continue;
            }

            try {
                // Search by Name + Address slightly
                // If we search by Name only, we might get the right place.
                const query = f.name; // Search primarily by Name
                const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
                const res = await axios.get(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });

                if (res.data.documents.length > 0) {
                    const bestMatch = res.data.documents[0];
                    const newLat = Number(bestMatch.y);
                    const newLng = Number(bestMatch.x);

                    const dist = getDistance(f.lat, f.lng, newLat, newLng);

                    // If distance is significant (> 500m?), likely misplaced
                    if (dist > 500) {
                        misplacedItems.push({
                            facility: f,
                            currentLoc: key,
                            suggestedLoc: { lat: newLat, lng: newLng, address: bestMatch.address_name },
                            distance: dist
                        });
                        console.log(`   🚨 [${f.name}] Current: ${key} -> Suggested: ${newLat},${newLng} (Dist: ${Math.round(dist)}m)`);
                    }
                }
            } catch (e) {
                console.error(`   Error checking ${f.name}`);
            }
        }
    }

    // Report
    let report = "# 📍 Misplaced Facilities Report\n\n";
    report += `Generated at: ${new Date().toLocaleString()}\n`;
    report += `Found ${misplacedItems.length} potential misplaced facilities.\n\n`;

    misplacedItems.sort((a, b) => b.distance - a.distance);

    misplacedItems.forEach(item => {
        report += `### ${item.facility.name} (ID: ${item.facility.id})\n`;
        report += `- **Current Address**: ${item.facility.address}\n`;
        report += `- **Current Coords**: ${item.currentLoc}\n`;
        report += `- **Suggested Coords**: ${item.suggestedLoc?.lat.toFixed(6)}, ${item.suggestedLoc?.lng.toFixed(6)}\n`;
        report += `- **Suggested Address**: ${item.suggestedLoc?.address}\n`;
        report += `- **Distance Error**: ${Math.round(item.distance / 1000)} km (${Math.round(item.distance)} m)\n\n`;
    });

    fs.writeFileSync('misplaced_report.md', report, 'utf8');
    console.log(`\n✅ Report generated: misplaced_report.md`);
}

findMisplaced();
