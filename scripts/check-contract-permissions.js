const { ethers } = require('ethers');

// Script to check contract permissions and ownership
async function checkPermissions() {
  const collectionAddress = process.argv[2];
  
  if (!collectionAddress) {
    console.log('❌ Usage: node check-contract-permissions.js <collection-address>');
    console.log('Example: node check-contract-permissions.js 0x0b4e06E4D217429b92E357FdD43628Df852e1464');
    process.exit(1);
  }

  console.log('🔍 [Permissions] Checking contract permissions...');
  console.log('📍 [Permissions] Contract Address:', collectionAddress);

  try {
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
    const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
    
    if (!PRIVATE_KEY) {
      console.log('❌ [Permissions] WALLET_PRIVATE_KEY not set in environment');
      process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('👛 [Permissions] Your wallet address:', wallet.address);

    // Contract ABI for checking permissions
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
    console.log('\n📊 [Permissions] Contract Information:');
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
      
      // Check if you're the owner
      if (owner.toLowerCase() === wallet.address.toLowerCase()) {
        console.log('   ✅ You are the owner of this contract');
      } else {
        console.log('   ❌ You are NOT the owner of this contract');
        console.log(`   💡 Owner is: ${owner}`);
        console.log('   💡 Only the owner can add codes to this contract');
      }
      
    } catch (error) {
      console.log('   ⚠️  Could not fetch contract info:', error.message);
    }

    // Test if you can call addValidCodes (without actually adding)
    console.log('\n🔐 [Permissions] Testing addValidCodes permission...');
    try {
      const testHash = ethers.keccak256(ethers.toUtf8Bytes('TEST_PERMISSION'));
      
      // Try to estimate gas for addValidCodes (this will fail if you don't have permission)
      const contractWithWallet = new ethers.Contract(collectionAddress, [
        {
          "inputs": [{"internalType": "bytes32[]", "name": "hashes", "type": "bytes32[]"}],
          "name": "addValidCodes",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ], wallet);
      
      const gasEstimate = await contractWithWallet.addValidCodes.estimateGas([testHash]);
      console.log(`   ✅ Gas estimate successful: ${gasEstimate.toString()} gas`);
      console.log('   ✅ You have permission to add codes');
      
    } catch (error) {
      console.log(`   ❌ Permission test failed: ${error.message}`);
      
      if (error.message.includes('execution reverted')) {
        console.log('   💡 This usually means you are not the owner of the contract');
      } else if (error.message.includes('insufficient funds')) {
        console.log('   💡 You have permission but insufficient funds for gas');
      }
    }

    // Check current hash status
    console.log('\n🔍 [Permissions] Current hash status:');
    const testCodes = ['TEST123', 'DEMO456', 'SAMPLE789'];
    
    for (const code of testCodes) {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(code));
      try {
        const isValid = await contract.validCodes(hash);
        const isUsed = await contract.usedCodes(hash);
        console.log(`   ${code}: Valid=${isValid}, Used=${isUsed}`);
      } catch (error) {
        console.log(`   ${code}: Error checking`);
      }
    }

    console.log('\n📋 [Permissions] Summary:');
    console.log('   - If you are the owner: You can add codes using add-test-hashes.js');
    console.log('   - If you are not the owner: You need the owner\'s private key');
    console.log('   - If you deployed via API: Check if the API used the correct wallet');

  } catch (error) {
    console.error('💥 [Permissions] Error:', error);
  }
}

checkPermissions();
