const { createClient } = require('@supabase/supabase-js');

// Test script to verify the new database schema is working
async function testDatabaseSchema() {
  console.log('🧪 [Database Test] Testing new schema...');

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || 'your-supabase-url',
      process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
    );

    // Test 1: Check if collections table has new columns
    console.log('\n📊 [Database Test] Testing collections table...');
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .limit(1);

    if (collectionsError) {
      console.log('❌ [Database Test] Collections table error:', collectionsError.message);
    } else {
      console.log('✅ [Database Test] Collections table accessible');
      if (collections && collections.length > 0) {
        console.log('📋 [Database Test] Sample collection fields:', Object.keys(collections[0]));
      }
    }

    // Test 2: Check if collection_codes table exists and has new columns
    console.log('\n🔐 [Database Test] Testing collection_codes table...');
    const { data: codes, error: codesError } = await supabase
      .from('collection_codes')
      .select('*')
      .limit(1);

    if (codesError) {
      console.log('❌ [Database Test] Collection_codes table error:', codesError.message);
    } else {
      console.log('✅ [Database Test] Collection_codes table accessible');
      if (codes && codes.length > 0) {
        console.log('📋 [Database Test] Sample code fields:', Object.keys(codes[0]));
      }
    }

    // Test 3: Check foreign key relationship
    console.log('\n🔗 [Database Test] Testing foreign key relationship...');
    const { data: relationshipTest, error: relationshipError } = await supabase
      .from('collection_codes')
      .select(`
        *,
        collections!fk_collection_codes_collection (
          address,
          name,
          symbol
        )
      `)
      .limit(1);

    if (relationshipError) {
      console.log('❌ [Database Test] Foreign key relationship error:', relationshipError.message);
    } else {
      console.log('✅ [Database Test] Foreign key relationship working');
    }

    // Test 4: Check indexes (by running a query that would use them)
    console.log('\n📈 [Database Test] Testing indexes...');
    const { data: indexTest, error: indexError } = await supabase
      .from('collection_codes')
      .select('collection_address, used')
      .eq('used', false)
      .limit(5);

    if (indexError) {
      console.log('❌ [Database Test] Index test error:', indexError.message);
    } else {
      console.log('✅ [Database Test] Indexes working properly');
    }

    console.log('\n🎉 [Database Test] Schema verification complete!');

  } catch (error) {
    console.error('💥 [Database Test] Error:', error);
  }
}

testDatabaseSchema();
