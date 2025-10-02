const { createClient } = require('@supabase/supabase-js');

// Script to check the active status of collections
async function checkCollectionsStatus() {
  console.log('🔍 [Collections Status] Checking collections active status...');

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || 'your-supabase-url',
      process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
    );

    // Get all collections with their active status
    const { data: collections, error } = await supabase
      .from('collections')
      .select('address, name, symbol, active, collection_type, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ [Collections Status] Error fetching collections:', error.message);
      return;
    }

    console.log(`📊 [Collections Status] Found ${collections.length} collections`);

    if (collections.length === 0) {
      console.log('📭 [Collections Status] No collections found');
      return;
    }

    // Analyze active status
    const activeCollections = collections.filter(c => c.active === true);
    const inactiveCollections = collections.filter(c => c.active === false);
    const nullActiveCollections = collections.filter(c => c.active === null);

    console.log('\n📈 [Collections Status] Active Status Summary:');
    console.log(`   ✅ Active: ${activeCollections.length}`);
    console.log(`   ❌ Inactive: ${inactiveCollections.length}`);
    console.log(`   ❓ Null: ${nullActiveCollections.length}`);

    // Show recent collections
    console.log('\n📋 [Collections Status] Recent Collections:');
    collections.slice(0, 5).forEach((collection, index) => {
      const status = collection.active ? '✅ Active' : collection.active === false ? '❌ Inactive' : '❓ Unknown';
      console.log(`   ${index + 1}. ${collection.name} (${collection.symbol}) - ${status}`);
      console.log(`      Address: ${collection.address}`);
      console.log(`      Type: ${collection.collection_type}`);
      console.log(`      Created: ${collection.created_at}`);
      console.log('');
    });

    // Check if all ERC1155 collections are active
    const erc1155Collections = collections.filter(c => c.collection_type === 'erc1155');
    const activeERC1155Collections = erc1155Collections.filter(c => c.active === true);

    console.log('🎯 [Collections Status] ERC1155 Collections:');
    console.log(`   Total ERC1155: ${erc1155Collections.length}`);
    console.log(`   Active ERC1155: ${activeERC1155Collections.length}`);

    if (erc1155Collections.length > 0 && activeERC1155Collections.length === erc1155Collections.length) {
      console.log('✅ [Collections Status] All ERC1155 collections are active!');
    } else if (erc1155Collections.length > 0) {
      console.log('⚠️  [Collections Status] Some ERC1155 collections are not active');
    }

  } catch (error) {
    console.error('💥 [Collections Status] Error:', error);
  }
}

checkCollectionsStatus();
