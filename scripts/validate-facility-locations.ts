/**
 * Facility Location Validation Script
 * 
 * This script validates that facility coordinates match their registered addresses
 * by checking:
 * 1. Coordinates are within Korea boundaries (33-43°N, 124-132°E)
 * 2. Region extracted from address matches coordinate location
 * 3. No null/missing coordinate data
 * 
 * Usage: npx tsx scripts/validate-facility-locations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Initialize Supabase client
const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg1MTAxOSwiZXhwIjoyMDgxNDI3MDE5fQ.F98y7OtBTjRCNeDycy3YQrKJdjM6-Hs_-ZYZHluWHio';
const supabase = createClient(supabaseUrl, supabaseKey);

// Korea geographic boundaries
const KOREA_BOUNDS = {
    minLat: 33.0,
    maxLat: 43.0,
    minLng: 124.0,
    maxLng: 132.0
};

// Major Korean regions with approximate coordinate ranges
const REGION_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
    '서울': { minLat: 37.4, maxLat: 37.7, minLng: 126.7, maxLng: 127.2 },
    '부산': { minLat: 35.0, maxLat: 35.4, minLng: 128.9, maxLng: 129.3 },
    '인천': { minLat: 37.3, maxLat: 37.6, minLng: 126.4, maxLng: 126.8 },
    '대구': { minLat: 35.7, maxLat: 36.0, minLng: 128.4, maxLng: 128.8 },
    '대전': { minLat: 36.2, maxLat: 36.5, minLng: 127.3, maxLng: 127.5 },
    '광주': { minLat: 35.0, maxLat: 35.3, minLng: 126.7, maxLng: 127.0 },
    '울산': { minLat: 35.4, maxLat: 35.7, minLng: 128.9, maxLng: 129.5 },
    '세종': { minLat: 36.4, maxLat: 36.7, minLng: 127.2, maxLng: 127.4 },
    '경기': { minLat: 36.8, maxLat: 38.3, minLng: 126.4, maxLng: 127.6 },
    '강원': { minLat: 37.0, maxLat: 38.6, minLng: 127.5, maxLng: 129.4 },
    '충북': { minLat: 36.3, maxLat: 37.3, minLng: 127.4, maxLng: 128.5 },
    '충남': { minLat: 36.0, maxLat: 37.0, minLng: 126.2, maxLng: 127.7 },
    '전북': { minLat: 35.5, maxLat: 36.3, minLng: 126.5, maxLng: 127.9 },
    '전남': { minLat: 34.2, maxLat: 35.5, minLng: 126.1, maxLng: 127.8 },
    '경북': { minLat: 35.7, maxLat: 37.5, minLng: 128.3, maxLng: 129.6 },
    '경남': { minLat: 34.7, maxLat: 35.9, minLng: 127.7, maxLng: 129.3 },
    '제주': { minLat: 33.2, maxLat: 33.6, minLng: 126.1, maxLng: 126.9 }
};

interface ValidationIssue {
    facility_id: string;
    facility_name: string;
    category: string;
    address: string;
    lat: number;
    lng: number;
    issue_type: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

async function validateFacilityLocations() {
    console.log('🔍 Starting facility location validation...\n');

    const issues: ValidationIssue[] = [];
    let totalFacilities = 0;
    let validFacilities = 0;

    try {
        // Fetch all facilities with location data
        const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, name, category, address, lat, lng')
            .order('name');

        if (error) {
            throw new Error(`Failed to fetch facilities: ${error.message}`);
        }

        if (!facilities || facilities.length === 0) {
            console.log('No facilities found in database.');
            return;
        }

        totalFacilities = facilities.length;
        console.log(`📊 Total facilities to validate: ${totalFacilities}\n`);

        // Validate each facility
        for (const facility of facilities) {
            let hasIssue = false;

            // Check 1: Missing coordinates
            if (!facility.lat || !facility.lng) {
                issues.push({
                    facility_id: facility.id,
                    facility_name: facility.name,
                    category: facility.category,
                    address: facility.address,
                    lat: facility.lat,
                    lng: facility.lng,
                    issue_type: 'MISSING_COORDINATES',
                    description: 'Latitude or longitude is null/missing',
                    severity: 'CRITICAL'
                });
                hasIssue = true;
                continue;
            }

            // Check 2: Out of Korea bounds
            if (
                facility.lat < KOREA_BOUNDS.minLat ||
                facility.lat > KOREA_BOUNDS.maxLat ||
                facility.lng < KOREA_BOUNDS.minLng ||
                facility.lng > KOREA_BOUNDS.maxLng
            ) {
                issues.push({
                    facility_id: facility.id,
                    facility_name: facility.name,
                    category: facility.category,
                    address: facility.address,
                    lat: facility.lat,
                    lng: facility.lng,
                    issue_type: 'OUT_OF_BOUNDS',
                    description: `Coordinates (${facility.lat}, ${facility.lng}) are outside Korea boundaries`,
                    severity: 'CRITICAL'
                });
                hasIssue = true;
                continue;
            }

            // Check 3: Region mismatch
            if (facility.address) {
                const addressRegion = extractRegionFromAddress(facility.address);
                if (addressRegion && REGION_BOUNDS[addressRegion]) {
                    const bounds = REGION_BOUNDS[addressRegion];
                    if (
                        facility.lat < bounds.minLat ||
                        facility.lat > bounds.maxLat ||
                        facility.lng < bounds.minLng ||
                        facility.lng > bounds.maxLng
                    ) {
                        // Find which region the coordinates actually match
                        const actualRegion = findRegionByCoordinates(facility.lat, facility.lng);

                        issues.push({
                            facility_id: facility.id,
                            facility_name: facility.name,
                            category: facility.category,
                            address: facility.address,
                            lat: facility.lat,
                            lng: facility.lng,
                            issue_type: 'REGION_MISMATCH',
                            description: `Address says "${addressRegion}" but coordinates are in "${actualRegion || 'UNKNOWN'}"`,
                            severity: 'HIGH'
                        });
                        hasIssue = true;
                    }
                }
            }

            // Check 4: Suspicious coordinates (exact zeros or common default values)
            if (facility.lat === 0 && facility.lng === 0) {
                issues.push({
                    facility_id: facility.id,
                    facility_name: facility.name,
                    category: facility.category,
                    address: facility.address,
                    lat: facility.lat,
                    lng: facility.lng,
                    issue_type: 'DEFAULT_COORDINATES',
                    description: 'Coordinates are (0, 0) - likely default value',
                    severity: 'HIGH'
                });
                hasIssue = true;
            }

            if (!hasIssue) {
                validFacilities++;
            }
        }

        // Generate report
        generateReport(totalFacilities, validFacilities, issues);

    } catch (error) {
        console.error('❌ Error during validation:', error);
        throw error;
    }
}

function extractRegionFromAddress(address: string): string | null {
    if (!address) return null;

    // Try to match major regions in order of specificity
    const regions = Object.keys(REGION_BOUNDS);
    for (const region of regions) {
        if (address.includes(region)) {
            return region;
        }
    }

    return null;
}

function findRegionByCoordinates(lat: number, lng: number): string | null {
    for (const [region, bounds] of Object.entries(REGION_BOUNDS)) {
        if (
            lat >= bounds.minLat &&
            lat <= bounds.maxLat &&
            lng >= bounds.minLng &&
            lng <= bounds.maxLng
        ) {
            return region;
        }
    }
    return null;
}

function generateReport(total: number, valid: number, issues: ValidationIssue[]) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 FACILITY LOCATION VALIDATION REPORT');
    console.log('='.repeat(80) + '\n');

    console.log(`Total Facilities: ${total}`);
    console.log(`✅ Valid Locations: ${valid} (${((valid / total) * 100).toFixed(1)}%)`);
    console.log(`❌ Issues Found: ${issues.length} (${((issues.length / total) * 100).toFixed(1)}%)\n`);

    // Group by severity
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = issues.filter(i => i.severity === 'MEDIUM');
    const lowIssues = issues.filter(i => i.severity === 'LOW');

    console.log('Issues by Severity:');
    console.log(`  🔴 CRITICAL: ${criticalIssues.length}`);
    console.log(`  🟠 HIGH: ${highIssues.length}`);
    console.log(`  🟡 MEDIUM: ${mediumIssues.length}`);
    console.log(`  🟢 LOW: ${lowIssues.length}\n`);

    // Group by issue type
    const issuesByType = issues.reduce((acc, issue) => {
        if (!acc[issue.issue_type]) {
            acc[issue.issue_type] = [];
        }
        acc[issue.issue_type].push(issue);
        return acc;
    }, {} as Record<string, ValidationIssue[]>);

    console.log('Issues by Type:');
    for (const [type, typeIssues] of Object.entries(issuesByType)) {
        console.log(`  ${type}: ${typeIssues.length}`);
    }

    // Print detailed issues
    if (issues.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('DETAILED ISSUES');
        console.log('='.repeat(80) + '\n');

        // Sort by severity
        const sortedIssues = [...issues].sort((a, b) => {
            const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });

        sortedIssues.forEach((issue, index) => {
            const icon = {
                CRITICAL: '🔴',
                HIGH: '🟠',
                MEDIUM: '🟡',
                LOW: '🟢'
            }[issue.severity];

            console.log(`${icon} Issue #${index + 1} [${issue.severity}]`);
            console.log(`   Facility: ${issue.facility_name} (ID: ${issue.facility_id})`);
            console.log(`   Category: ${issue.category}`);
            console.log(`   Address: ${issue.address}`);
            console.log(`   Coordinates: (${issue.lat}, ${issue.lng})`);
            console.log(`   Problem: ${issue.description}`);
            console.log('');
        });
    }

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `location_validation_report_${timestamp}.json`;

    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total_facilities: total,
            valid_facilities: valid,
            total_issues: issues.length,
            by_severity: {
                critical: criticalIssues.length,
                high: highIssues.length,
                medium: mediumIssues.length,
                low: lowIssues.length
            },
            by_type: Object.fromEntries(
                Object.entries(issuesByType).map(([type, issues]) => [type, issues.length])
            )
        },
        issues: issues
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Full report saved to: ${reportPath}`);

    // Also save CSV for easy viewing
    const csvPath = `location_validation_report_${timestamp}.csv`;
    const csvContent = [
        'Severity,Issue Type,Facility ID,Facility Name,Category,Address,Latitude,Longitude,Description',
        ...issues.map(issue =>
            `"${issue.severity}","${issue.issue_type}","${issue.facility_id}","${issue.facility_name}","${issue.category}","${issue.address}",${issue.lat},${issue.lng},"${issue.description}"`
        )
    ].join('\n');

    fs.writeFileSync(csvPath, csvContent);
    console.log(`📊 CSV report saved to: ${csvPath}\n`);
}

// Run validation
validateFacilityLocations()
    .then(() => {
        console.log('✅ Validation complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
