const { ethers } = require('ethers');

// Debug script to check what's happening with the contract
async function debugContract() {
  const collectionAddress = process.argv[2];
  
  if (!collectionAddress) {
    console.log('❌ Usage: node debug-contract.js <collection-address>');
    process.exit(1);
  }

  console.log('🔍 [Debug] Analyzing contract state...');
  console.log('📍 [Debug] Contract Address:', collectionAddress);

  try {
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Contract ABI
    const contractAbi = [
      "function owner() view returns (address)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function maxSupply() view returns (uint256)",
      "function totalMinted() view returns (uint256)",
      "function validCodes(bytes32) view returns (bool)",
      "function usedCodes(bytes32) view returns (bool)"
    ];

    const contract = new ethers.Contract(collectionAddress, contractAbi, provider);

    // Get contract info
    console.log('\n📊 [Debug] Contract Information:');
    try {
      const name = await contract.name();
      const symbol = await contract.symbol();
      const maxSupply = await contract.maxSupply();
      const totalMinted = await contract.totalMinted();
      const owner = await contract.owner();
      
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Max Supply: ${maxSupply}`);
      console.log(`   Total Minted: ${totalMinted}`);
      console.log(`   Owner: ${owner}`);
      
    } catch (error) {
      console.log('   ⚠️  Could not fetch contract info:', error.message);
    }

    // Test the exact codes from your console
    console.log('\n🔐 [Debug] Testing generated codes...');
    const generatedCodes = [
      'EF121060', '5AC9F322', 'EFBE4A3D', 'CF180E54', '24A4E620'
    ];
    
    let validCount = 0;
    for (const code of generatedCodes) {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(code));
      try {
        const isValid = await contract.validCodes(hash);
        const isUsed = await contract.usedCodes(hash);
        
        if (isValid && !isUsed) {
          validCount++;
          console.log(`   ✅ ${code}: Valid & Unused`);
        } else if (isUsed) {
          console.log(`   🔄 ${code}: Used`);
        } else {
          console.log(`   ❌ ${code}: Invalid`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${code}: Error checking`);
      }
    }

    console.log(`\n📈 [Debug] Results: ${validCount}/${generatedCodes.length} codes are valid`);

    if (validCount === 0) {
      console.log('\n💡 [Debug] Diagnosis:');
      console.log('   - Contract is deployed but no codes have been added');
      console.log('   - The addValidCodes transaction likely failed');
      console.log('   - You need to manually add the codes');
      
      console.log('\n🚀 [Debug] Solutions:');
      console.log('   1. Set WALLET_PRIVATE_KEY and run: node scripts/add-generated-codes.js');
      console.log('   2. Or deploy a new collection through your API');
      console.log('   3. Or check the API logs for transaction failures');
    } else {
      console.log('\n✅ [Debug] Contract has valid codes!');
    }

  } catch (error) {
    console.error('💥 [Debug] Error:', error);
  }
}

debugContract();
