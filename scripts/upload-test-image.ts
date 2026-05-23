/**
 * Upload Test Image Script
 *
 * Creates a simple test design image and uploads it to Supabase storage
 * for use in pressure testing the mockup generator.
 *
 * Usage: npx ts-node scripts/upload-test-image.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });
import sharp from 'sharp';

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DESIGNS_BUCKET = 'designs';
const TEST_IMAGE_PATH = 'test-assets/pressure-test-design.png';

async function createTestImage(): Promise<Buffer> {
  // Create a simple 1000x1000 test design with solid color and text
  // This is a valid design that Printful should accept
  const width = 1000;
  const height = 1000;

  // Create SVG with a simple design
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#2563eb"/>
      <circle cx="500" cy="400" r="200" fill="#fbbf24"/>
      <text x="500" y="650" font-family="Arial, sans-serif" font-size="80" fill="white" text-anchor="middle" font-weight="bold">
        TEST
      </text>
      <text x="500" y="750" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle">
        DESIGN
      </text>
    </svg>
  `;

  // Convert SVG to PNG using Sharp
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  console.log(`Created test image: ${(buffer.length / 1024).toFixed(2)} KB`);
  return buffer;
}

async function uploadTestImage() {
  console.log('=== Creating and Uploading Test Image ===\n');

  try {
    // Step 1: Create test image
    console.log('Step 1: Creating test image...');
    const imageBuffer = await createTestImage();

    // Step 2: Upload to Supabase
    console.log(`Step 2: Uploading to Supabase (${TEST_IMAGE_PATH})...`);

    const { data, error } = await supabase.storage
      .from(DESIGNS_BUCKET)
      .upload(TEST_IMAGE_PATH, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 year
        upsert: true, // Allow re-uploads
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Step 3: Get public URL
    const { data: urlData } = supabase.storage
      .from(DESIGNS_BUCKET)
      .getPublicUrl(TEST_IMAGE_PATH);

    const publicUrl = urlData.publicUrl;

    console.log('\n=== Upload Successful ===');
    console.log(`Path: ${TEST_IMAGE_PATH}`);
    console.log(`Public URL: ${publicUrl}`);
    console.log('\nUpdate pressure-test/route.ts with this URL:');
    console.log(`const TEST_DESIGN_URL = '${publicUrl}';`);

    // Verify URL is accessible
    console.log('\nVerifying URL is accessible...');
    const response = await fetch(publicUrl);
    if (response.ok) {
      console.log(`✓ URL is accessible (status: ${response.status})`);
    } else {
      console.log(`✗ URL may not be accessible (status: ${response.status})`);
    }

    return publicUrl;
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

uploadTestImage();
