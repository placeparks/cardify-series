const { ethers } = require('ethers');

// Configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/your-key';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ERC1155 Collection Contract ABI (minimal for verification)
const collectionAbi = [
  {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "validCodes",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "usedCodes",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function verifyContractHashes(collectionAddress, codes) {
  try {
    console.log('🔍 [Verification] Starting hash verification...');
    console.log('📍 [Verification] Collection address:', collectionAddress);
    console.log('📋 [Verification] Codes to verify:', codes.length);

    // Setup provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(collectionAddress, collectionAbi, provider);

    // Get basic contract info
    console.log('\n📊 [Verification] Contract Information:');
    try {
      const name = await contract.name();
      const symbol = await contract.symbol();
      const maxSupply = await contract.maxSupply();
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Max Supply: ${maxSupply}`);
    } catch (error) {
      console.log('   ⚠️  Could not fetch contract info:', error.message);
    }

    // Verify each hash
    console.log('\n🔐 [Verification] Checking hashes...');
    const hashes = codes.map(code => ethers.keccak256(ethers.toUtf8Bytes(code)));
    
    let validCount = 0;
    let usedCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < hashes.length; i++) {
      const hash = hashes[i];
      const code = codes[i];
      
      try {
        const isValid = await contract.validCodes(hash);
        const isUsed = await contract.usedCodes(hash);
        
        if (isValid && !isUsed) {
          validCount++;
          if (i < 5) { // Show first 5 valid codes
            console.log(`   ✅ ${code} -> ${hash} (Valid & Unused)`);
          }
        } else if (isUsed) {
          usedCount++;
          if (i < 5) { // Show first 5 used codes
            console.log(`   🔄 ${code} -> ${hash} (Used)`);
          }
        } else {
          invalidCount++;
          if (i < 5) { // Show first 5 invalid codes
            console.log(`   ❌ ${code} -> ${hash} (Invalid)`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Error checking ${code}:`, error.message);
        invalidCount++;
      }
    }

    // Summary
    console.log('\n📈 [Verification] Summary:');
    console.log(`   Total codes checked: ${codes.length}`);
    console.log(`   ✅ Valid & Unused: ${validCount}`);
    console.log(`   🔄 Used: ${usedCount}`);
    console.log(`   ❌ Invalid: ${invalidCount}`);
    
    const successRate = ((validCount + usedCount) / codes.length * 100).toFixed(2);
    console.log(`   📊 Success Rate: ${successRate}%`);

    if (validCount > 0) {
      console.log('\n🎉 [Verification] SUCCESS: Hashes are properly added to the contract!');
      return true;
    } else {
      console.log('\n❌ [Verification] FAILED: No valid hashes found in the contract!');
      return false;
    }

  } catch (error) {
    console.error('💥 [Verification] Error during verification:', error);
    return false;
  }
}

// Test function with sample data
async function testVerification() {
  console.log('🧪 [Test] Running verification test...');
  
  // Sample collection address (replace with actual deployed address)
  const testCollectionAddress = '0x1234567890123456789012345678901234567890';
  
  // Sample codes
  const testCodes = [
    'ABC12345',
    'XYZ67890',
    'TEST1234',
    'DEMO5678',
    'SAMPLE9'
  ];

  console.log('⚠️  [Test] This is a test with sample data.');
  console.log('⚠️  [Test] Replace testCollectionAddress with your actual deployed contract address.');
  
  // Uncomment the line below to run the actual verification
  // await verifyContractHashes(testCollectionAddress, testCodes);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node verify-contract-hashes.js <collection-address> <code1,code2,code3...>');
    console.log('Example: node verify-contract-hashes.js 0x1234... ABC123,XYZ789,TEST456');
    console.log('\nOr run test mode:');
    testVerification();
    process.exit(1);
  }

  const collectionAddress = args[0];
  const codesString = args[1];
  const codes = codesString.split(',').map(code => code.trim());

  console.log('🚀 [Verification] Starting hash verification...');
  verifyContractHashes(collectionAddress, codes)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 [Verification] Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyContractHashes };
