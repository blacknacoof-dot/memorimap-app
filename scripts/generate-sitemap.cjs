
/**
 * Sitemap Generator Script
 * Generates sitemap.xml for SEO
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://memorimap.kr';

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase config missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
    console.log('Generating sitemap...');

    // 1. Static Routes
    const staticRoutes = [
        '/',
        '/search',
        '/login',
        '/signup',
        '/find-password',
        '/my-page', // Check if this matches your route
        '/dashboard' // Check if this matches your route
    ];

    // 2. Dynamic Routes (Facilities)
    // Get all active facilities
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, updated_at')
        //.eq('is_active', true) // Add this if you have an active flag
        .limit(50000); // Verify limit

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log(`Found ${facilities.length} facilities.`);

    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add Static Routes
    staticRoutes.forEach(route => {
        sitemapContent += `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add Dynamic Routes
    facilities.forEach(facility => {
        const lastMod = facility.updated_at ? new Date(facility.updated_at).toISOString() : new Date().toISOString();
        sitemapContent += `
  <url>
    <loc>${SITE_URL}/facilities/${facility.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;
    });

    sitemapContent += `
</urlset>`;

    const publicDir = path.resolve(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);
    console.log(`✅ Sitemap generated at public/sitemap.xml with ${staticRoutes.length + facilities.length} URLs`);
}

generateSitemap();
