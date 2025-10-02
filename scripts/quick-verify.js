const { ethers } = require('ethers');

// Quick verification script
async function quickVerify() {
  const collectionAddress = process.argv[2];
  
  if (!collectionAddress) {
    console.log('❌ Usage: node quick-verify.js <collection-address>');
    console.log('Example: node quick-verify.js 0x1234567890123456789012345678901234567890');
    process.exit(1);
  }

  console.log('🔍 [Quick Verify] Checking contract...');
  console.log('📍 [Quick Verify] Address:', collectionAddress);

  try {
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/your-key';
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Minimal ABI for basic checks
    const abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function maxSupply() view returns (uint256)",
      "function validCodes(bytes32) view returns (bool)",
      "function usedCodes(bytes32) view returns (bool)"
    ];
    
    const contract = new ethers.Contract(collectionAddress, abi, provider);
    
    // Get basic info
    console.log('\n📊 [Quick Verify] Contract Info:');
    try {
      const name = await contract.name();
      const symbol = await contract.symbol();
      const maxSupply = await contract.maxSupply();
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Max Supply: ${maxSupply}`);
    } catch (error) {
      console.log('   ⚠️  Could not fetch contract info');
    }

    // Test a few sample hashes
    console.log('\n🔐 [Quick Verify] Testing sample hashes...');
    const testCodes = ['TEST123', 'DEMO456', 'SAMPLE789'];
    
    for (const code of testCodes) {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(code));
      try {
        const isValid = await contract.validCodes(hash);
        const isUsed = await contract.usedCodes(hash);
        console.log(`   ${code}: Valid=${isValid}, Used=${isUsed}`);
      } catch (error) {
        console.log(`   ${code}: Error checking hash`);
      }
    }

    console.log('\n✅ [Quick Verify] Verification complete!');
    
  } catch (error) {
    console.error('💥 [Quick Verify] Error:', error.message);
    process.exit(1);
  }
}

quickVerify();
