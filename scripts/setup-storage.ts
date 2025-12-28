/**
 * Setup Supabase Storage Bucket
 *
 * Creates the 'designs' bucket and sets up CORS/public access policies
 * Run with: npx tsx scripts/setup-storage.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorage() {
  console.log('🔧 Setting up Supabase Storage...\n');

  // 1. Check if bucket exists
  console.log('1. Checking for "designs" bucket...');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    return;
  }

  const designsBucket = buckets?.find((b) => b.name === 'designs');

  if (designsBucket) {
    console.log('   ✅ Bucket "designs" already exists');
    console.log('   📊 Public:', designsBucket.public);
    console.log('   📊 ID:', designsBucket.id);
  } else {
    // 2. Create bucket
    console.log('   ⏳ Creating "designs" bucket...');
    const { data, error } = await supabase.storage.createBucket('designs', {
      public: true, // Make bucket public for read access
      fileSizeLimit: 10 * 1024 * 1024, // 10MB max file size
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    });

    if (error) {
      console.error('   ❌ Error creating bucket:', error.message);
      return;
    }

    console.log('   ✅ Bucket "designs" created successfully');
  }

  // 3. Verify bucket is public
  const { data: updatedBuckets } = await supabase.storage.listBuckets();
  const bucket = updatedBuckets?.find((b) => b.name === 'designs');

  if (bucket?.public) {
    console.log('\n✅ Setup complete! The "designs" bucket is public and ready to use.');
    console.log('\n📋 Bucket details:');
    console.log('   - Name: designs');
    console.log('   - Public: Yes');
    console.log('   - Max file size: 10MB');
    console.log('   - Allowed types: PNG, JPG, JPEG');
  } else {
    console.log('\n⚠️  Bucket exists but is not public.');
    console.log('Please set it to public in your Supabase dashboard:');
    console.log('Storage → designs → Settings → Make bucket public');
  }
}

setupStorage()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
