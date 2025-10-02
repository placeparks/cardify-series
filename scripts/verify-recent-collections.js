const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/your-key';
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_ERC1155;

// Factory Contract ABI (minimal for event reading)
const factoryAbi = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "collection", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "mintPrice", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "maxSupply", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "symbol", "type": "string"},
      {"indexed": false, "internalType": "address", "name": "royaltyRecipient", "type": "address"},
      {"indexed": false, "internalType": "uint96", "name": "royaltyBps", "type": "uint96"}
    ],
    "name": "CollectionDeployed",
    "type": "event"
  }
];

// Collection Contract ABI
const collectionAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function maxSupply() view returns (uint256)",
  "function validCodes(bytes32) view returns (bool)",
  "function usedCodes(bytes32) view returns (bool)",
  "function totalMinted() view returns (uint256)"
];

async function getRecentCollections(blockRange = 1000) {
  try {
    console.log('🔍 [Recent Collections] Fetching recent collections...');
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - blockRange);
    
    console.log(`📊 [Recent Collections] Scanning blocks ${fromBlock} to ${currentBlock}`);
    
    // Get CollectionDeployed events
    const filter = factoryContract.filters.CollectionDeployed();
    const events = await factoryContract.queryFilter(filter, fromBlock, currentBlock);
    
    console.log(`📋 [Recent Collections] Found ${events.length} collections in recent blocks`);
    
    const collections = events.map(event => ({
      address: event.args.collection,
      creator: event.args.creator,
      name: event.args.name,
      symbol: event.args.symbol,
      maxSupply: event.args.maxSupply.toString(),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }));
    
    return collections;
    
  } catch (error) {
    console.error('💥 [Recent Collections] Error fetching collections:', error);
    return [];
  }
}

async function verifyCollection(collectionAddress, sampleCodes = []) {
  try {
    console.log(`\n🔍 [Verify] Checking collection: ${collectionAddress}`);
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(collectionAddress, collectionAbi, provider);
    
    // Get basic info
    try {
      const name = await contract.name();
      const symbol = await contract.symbol();
      const maxSupply = await contract.maxSupply();
      const totalMinted = await contract.totalMinted();
      
      console.log(`   📊 Name: ${name}`);
      console.log(`   📊 Symbol: ${symbol}`);
      console.log(`   📊 Max Supply: ${maxSupply}`);
      console.log(`   📊 Total Minted: ${totalMinted}`);
    } catch (error) {
      console.log(`   ⚠️  Could not fetch contract info: ${error.message}`);
    }
    
    // Test sample codes if provided
    if (sampleCodes.length > 0) {
      console.log(`   🔐 Testing ${sampleCodes.length} sample codes...`);
      
      let validCount = 0;
      let usedCount = 0;
      
      for (const code of sampleCodes) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(code));
        try {
          const isValid = await contract.validCodes(hash);
          const isUsed = await contract.usedCodes(hash);
          
          if (isValid && !isUsed) {
            validCount++;
            console.log(`     ✅ ${code}: Valid & Unused`);
          } else if (isUsed) {
            usedCount++;
            console.log(`     🔄 ${code}: Used`);
          } else {
            console.log(`     ❌ ${code}: Invalid`);
          }
        } catch (error) {
          console.log(`     ⚠️  ${code}: Error checking`);
        }
      }
      
      console.log(`   📈 Results: ${validCount} valid, ${usedCount} used`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`💥 [Verify] Error checking collection ${collectionAddress}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 [Verification] Starting comprehensive verification...');
  
  if (!FACTORY_ADDRESS) {
    console.log('❌ [Verification] FACTORY_ADDRESS not set in environment');
    process.exit(1);
  }
  
  // Get recent collections
  const collections = await getRecentCollections();
  
  if (collections.length === 0) {
    console.log('📭 [Verification] No recent collections found');
    return;
  }
  
  console.log('\n📋 [Verification] Recent Collections:');
  collections.forEach((collection, index) => {
    console.log(`   ${index + 1}. ${collection.name} (${collection.symbol})`);
    console.log(`      Address: ${collection.address}`);
    console.log(`      Creator: ${collection.creator}`);
    console.log(`      Block: ${collection.blockNumber}`);
    console.log(`      TX: ${collection.transactionHash}`);
    console.log('');
  });
  
  // Verify each collection
  console.log('🔍 [Verification] Verifying collections...');
  for (const collection of collections) {
    await verifyCollection(collection.address);
  }
  
  console.log('\n✅ [Verification] Verification complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getRecentCollections, verifyCollection };
