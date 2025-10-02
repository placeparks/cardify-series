const { ethers } = require('ethers');

// Script to add test hashes to an existing deployed contract
async function addTestHashes() {
  const collectionAddress = process.argv[2];
  
  if (!collectionAddress) {
    console.log('❌ Usage: node add-test-hashes.js <collection-address>');
    console.log('Example: node add-test-hashes.js 0x0b4e06E4D217429b92E357FdD43628Df852e1464');
    process.exit(1);
  }

  console.log('🔧 [Add Hashes] Adding test hashes to contract...');
  console.log('📍 [Add Hashes] Contract Address:', collectionAddress);

  try {
    // Setup
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
    const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
    
    if (!PRIVATE_KEY) {
      console.log('❌ [Add Hashes] WALLET_PRIVATE_KEY not set in environment');
      console.log('💡 [Add Hashes] Set your private key: export WALLET_PRIVATE_KEY=your_private_key');
      process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('👛 [Add Hashes] Wallet address:', wallet.address);

    // Generate test codes and hashes
    const testCodes = [
      'TEST12345',
      'DEMO67890',
      'SAMPLE123',
      'VERIFY456',
      'CHECK789',
      'HASH001',
      'HASH002',
      'HASH003',
      'HASH004',
      'HASH005'
    ];

    const hashes = testCodes.map(code => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(code));
      console.log(`   ${code} -> ${hash}`);
      return hash;
    });

    console.log(`\n📦 [Add Hashes] Generated ${hashes.length} test hashes`);

    // Contract ABI for addValidCodes function
    const contractAbi = [
      {
        "inputs": [{"internalType": "bytes32[]", "name": "hashes", "type": "bytes32[]"}],
        "name": "addValidCodes",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    const contract = new ethers.Contract(collectionAddress, contractAbi, wallet);

    // Add hashes to contract
    console.log('\n🔐 [Add Hashes] Adding hashes to contract...');
    const tx = await contract.addValidCodes(hashes);
    
    console.log('⏳ [Add Hashes] Transaction sent:', tx.hash);
    console.log('⏳ [Add Hashes] Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ [Add Hashes] Transaction confirmed:', receipt.hash);
    console.log('✅ [Add Hashes] Gas used:', receipt.gasUsed.toString());

    // Verify the hashes were added
    console.log('\n🔍 [Add Hashes] Verifying hashes were added...');
    
    const verificationAbi = [
      {
        "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "name": "validCodes",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    const verificationContract = new ethers.Contract(collectionAddress, verificationAbi, provider);
    
    let validCount = 0;
    for (let i = 0; i < testCodes.length; i++) {
      const code = testCodes[i];
      const hash = hashes[i];
      
      try {
        const isValid = await verificationContract.validCodes(hash);
        if (isValid) {
          validCount++;
          console.log(`   ✅ ${code}: Valid`);
        } else {
          console.log(`   ❌ ${code}: Invalid`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${code}: Error checking`);
      }
    }

    console.log(`\n📊 [Add Hashes] Results: ${validCount}/${testCodes.length} hashes successfully added`);
    
    if (validCount === testCodes.length) {
      console.log('🎉 [Add Hashes] SUCCESS: All test hashes added successfully!');
      console.log('\n💡 [Add Hashes] You can now test the contract with:');
      console.log(`   node scripts/quick-verify.js ${collectionAddress}`);
    } else {
      console.log('⚠️  [Add Hashes] Some hashes may not have been added correctly');
    }

  } catch (error) {
    console.error('💥 [Add Hashes] Error:', error);
    
    if (error.message.includes('nonce')) {
      console.log('\n💡 [Add Hashes] Nonce error detected. Try again in a few seconds.');
    } else if (error.message.includes('insufficient funds')) {
      console.log('\n💡 [Add Hashes] Insufficient funds for gas. Check your wallet balance.');
    } else if (error.message.includes('execution reverted')) {
      console.log('\n💡 [Add Hashes] Transaction reverted. Check if you have permission to add codes.');
    }
  }
}

addTestHashes();
