const { ethers } = require('ethers');

// Script to check contract info without requiring private key
async function checkContractInfo() {
  const collectionAddress = process.argv[2];
  
  if (!collectionAddress) {
    console.log('❌ Usage: node check-contract-info.js <collection-address>');
    console.log('Example: node check-contract-info.js 0x0b4e06E4D217429b92E357FdD43628Df852e1464');
    process.exit(1);
  }

  console.log('🔍 [Contract Info] Checking contract information...');
  console.log('📍 [Contract Info] Contract Address:', collectionAddress);

  try {
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Contract ABI for checking basic info
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

    // Check basic contract info
    console.log('\n📊 [Contract Info] Contract Information:');
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

    // Check current hash status
    console.log('\n🔍 [Contract Info] Current hash status:');
    const testCodes = ['TEST123', 'DEMO456', 'SAMPLE789', 'VERIFY123', 'CHECK456'];
    
    let validCount = 0;
    for (const code of testCodes) {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(code));
      try {
        const isValid = await contract.validCodes(hash);
        const isUsed = await contract.usedCodes(hash);
        
        if (isValid) {
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

    console.log(`\n📈 [Contract Info] Hash Status: ${validCount}/${testCodes.length} valid codes found`);

    if (validCount === 0) {
      console.log('\n💡 [Contract Info] No valid codes found. This means:');
      console.log('   - The contract was deployed but no codes were added yet');
      console.log('   - You need to add codes using the addValidCodes function');
      console.log('   - Only the contract owner can add codes');
      
      console.log('\n🚀 [Contract Info] Next steps:');
      console.log('   1. Check who deployed this contract (the owner)');
      console.log('   2. Use that wallet to add codes');
      console.log('   3. Or deploy a new collection with codes via your API');
    } else {
      console.log('\n✅ [Contract Info] Contract has valid codes!');
    }

  } catch (error) {
    console.error('💥 [Contract Info] Error:', error);
  }
}

checkContractInfo();
