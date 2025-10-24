import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRubrics() {
  console.log('Testing rubrics table...\n');

  // Test 1: Try to fetch rubrics
  console.log('1. Fetching all rubrics:');
  const { data: rubrics, error: fetchError } = await supabase
    .from('rubrics')
    .select('*');

  if (fetchError) {
    console.error('   ❌ Error fetching:', fetchError);
  } else {
    console.log(`   ✅ Success! Found ${rubrics?.length || 0} rubrics`);
  }

  // Test 2: Try to insert a rubric (using a real scenario ID)
  console.log('\n2. Fetching a scenario to test with:');
  const { data: scenarios, error: scenarioError } = await supabase
    .from('scenarios')
    .select('id, title')
    .limit(1);

  if (scenarioError || !scenarios || scenarios.length === 0) {
    console.error('   ❌ No scenarios found to test with');
    return;
  }

  const testScenarioId = scenarios[0].id;
  console.log(`   ✅ Using scenario: ${scenarios[0].title} (${testScenarioId})`);

  console.log('\n3. Attempting to insert a test rubric:');
  const { data: insertData, error: insertError } = await supabase
    .from('rubrics')
    .insert([{
      scenario_id: testScenarioId,
      metric_name: 'Test Metric',
      description: 'This is a test rubric',
      min_score: 0,
      max_score: 10,
      weight: 1.0
    }])
    .select();

  if (insertError) {
    console.error('   ❌ Error inserting:', insertError);
    console.error('   Error details:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('   ✅ Success! Inserted rubric:', insertData);

    // Clean up - delete the test rubric
    if (insertData && insertData[0]) {
      console.log('\n4. Cleaning up test rubric:');
      const { error: deleteError } = await supabase
        .from('rubrics')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('   ❌ Error deleting:', deleteError);
      } else {
        console.log('   ✅ Test rubric deleted');
      }
    }
  }
}

testRubrics().catch(console.error);
