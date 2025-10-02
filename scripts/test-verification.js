const { ethers } = require('ethers');

// Test verification with a specific collection address
async function testVerification() {
  // You can replace this with an actual deployed collection address
  const collectionAddress = '0x1234567890123456789012345678901234567890';
  
  console.log('🧪 [Test] Testing verification with sample address...');
  console.log('📍 [Test] Collection Address:', collectionAddress);
  
  // Sample codes to test
  const testCodes = [
    'TEST12345',
    'DEMO67890', 
    'SAMPLE123',
    'VERIFY456',
    'CHECK789'
  ];
  
  console.log('📋 [Test] Sample codes:', testCodes);
  
  // Generate hashes
  const hashes = testCodes.map(code => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(code));
    console.log(`   ${code} -> ${hash}`);
    return hash;
  });
  
  console.log('\n✅ [Test] Hash generation test complete!');
  console.log('💡 [Test] To test with a real contract:');
  console.log('   1. Deploy a collection using your API');
  console.log('   2. Copy the collection address from the logs');
  console.log('   3. Run: node scripts/quick-verify.js <collection-address>');
  console.log('   4. Or run: node scripts/verify-contract-hashes.js <collection-address> <code1,code2,code3>');
}

testVerification().catch(console.error);
