/**
 * Supabase Connection Test Script
 *
 * This script tests your Supabase connection and verifies all tables are accessible.
 * Run with: npx tsx test-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file!');
  console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  let allTestsPassed = true;

  // Test 1: Connection
  console.log('1️⃣  Testing connection...');
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) {
      console.log('   ❌ Connection failed:', error.message);
      allTestsPassed = false;
    } else {
      console.log('   ✅ Connection successful!');
    }
  } catch (err) {
    console.log('   ❌ Connection error:', err);
    allTestsPassed = false;
  }

  // Test 2: Check all tables exist
  console.log('\n2️⃣  Checking tables...');
  const tables = [
    'users',
    'categories',
    'topics',
    'scenarios',
    'personas',
    'rubrics',
    'training_sessions',
    'content_assignments'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ❌ Table "${table}" - Error: ${error.message}`);
        allTestsPassed = false;
      } else {
        console.log(`   ✅ Table "${table}" exists`);
      }
    } catch (err) {
      console.log(`   ❌ Table "${table}" - Error:`, err);
      allTestsPassed = false;
    }
  }

  // Test 3: Try inserting and reading a test category
  console.log('\n3️⃣  Testing insert & read operations...');
  try {
    // Note: This will fail if RLS is enabled and user is not authenticated
    // We'll test without auth for now
    const testCategory = {
      name: 'Test Category',
      details: 'This is a test category created by the connection test',
      is_public: true,
      is_ai_generated_image: false
    };

    const { data: insertData, error: insertError } = await supabase
      .from('categories')
      .insert([testCategory])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '42501') {
        console.log('   ⚠️  Insert blocked by RLS (Row Level Security)');
        console.log('   ℹ️  This is expected if RLS is enabled and you\'re not authenticated');
        console.log('   💡 RLS is working correctly! You\'ll need to authenticate users in your app.');
      } else {
        console.log('   ❌ Insert failed:', insertError.message);
        allTestsPassed = false;
      }
    } else {
      console.log('   ✅ Insert successful! Created category:', insertData.name);

      // Clean up - delete the test category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.log('   ⚠️  Could not delete test category (ID:', insertData.id, ')');
      } else {
        console.log('   ✅ Test category cleaned up');
      }
    }
  } catch (err) {
    console.log('   ❌ Insert/Read test error:', err);
    allTestsPassed = false;
  }

  // Test 4: Check table counts
  console.log('\n4️⃣  Checking table row counts...');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ⚠️  Table "${table}" - Could not get count: ${error.message}`);
      } else {
        console.log(`   📊 Table "${table}" has ${count} rows`);
      }
    } catch (err) {
      console.log(`   ⚠️  Table "${table}" - Error getting count`);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ All critical tests passed!');
    console.log('🎉 Your Supabase database is ready to use!');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    console.log('💡 Common issues:');
    console.log('   - Check your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('   - Verify all tables were created in Supabase');
    console.log('   - Check RLS policies if insert/update operations fail');
  }
  console.log('='.repeat(50));

  // Additional info
  console.log('\n📚 Next Steps:');
  console.log('   1. Set up Supabase Authentication in your app');
  console.log('   2. Replace mock data with actual Supabase queries');
  console.log('   3. Test RLS policies with authenticated users');
  console.log('   4. See SUPABASE_DATABASE_GUIDE.md for implementation examples\n');
}

// Run the test
testSupabaseConnection()
  .then(() => {
    console.log('Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
