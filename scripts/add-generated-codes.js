const { ethers } = require('ethers');

// Script to add the specific codes from your console output
async function addGeneratedCodes() {
  const collectionAddress = process.argv[2];
  
  if (!collectionAddress) {
    console.log('❌ Usage: node add-generated-codes.js <collection-address>');
    console.log('Example: node add-generated-codes.js 0x0b4e06E4D217429b92E357FdD43628Df852e1464');
    process.exit(1);
  }

  console.log('🔧 [Add Codes] Adding generated codes to contract...');
  console.log('📍 [Add Codes] Contract Address:', collectionAddress);

  try {
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
    const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
    
    if (!PRIVATE_KEY) {
      console.log('❌ [Add Codes] WALLET_PRIVATE_KEY not set in environment');
      console.log('💡 [Add Codes] Set your private key: export WALLET_PRIVATE_KEY=your_private_key');
      process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('👛 [Add Codes] Wallet address:', wallet.address);

    // The exact codes from your console output
    const generatedCodes = [
      'EF121060', '5AC9F322', 'EFBE4A3D', 'CF180E54', '24A4E620', '0B5B4CA3', '307DD0F5', '41F837DA', 'F0C5EB6A', '09F9A046',
      'BD4679A6', 'C35ADCB9', '5091CDF1', '1913E0F5', '6C65B754', '8ABA441C', '6FF1DE4F', '1FAB1459', '49E771CF', '1156197E',
      'EADA8CAE', '8024DDC9', '74A55C07', '2F2CAA06', 'F34B987B', '27641BBC', 'EC24F606', '110E2C27', 'EC351891', '0ECC4814',
      '851528BD', 'B3690C8A', 'C99EAE9B', '02A1AE52', '05D23708', 'B685E432', '9F8DFECF', 'C90F37CA', 'CDE5C550', 'A754FB6C',
      'F6B9F166', '74EC5F54', '3D2F6741', 'DDF18102', 'A1FD1F5B', '8029738D', 'AA5114DD', '3A35812C', '0E5B3CD7', '52859DEB',
      'CB40D9BD', '53D4A782', '5E5708E7', '425FEB9F', '3BB9EFD9', 'F017CCBF', '92A53DE7', 'C10400AE', 'A4902AED', '49041770',
      '000A25DB', 'E3212811', 'ACA54454', '94759783', '95D8C351', 'DC66B4FE', '0EBB09F1', '51A83806', 'FFAAB3D8', 'B1E19253',
      '1F5E5E40', '530A883F', 'FBFFE3FF', '9D26A6B4', '6F5236EC', 'DBD459AA', 'C51A0384', 'A921B6D8', 'E7D1073C', '171D7FFB',
      '172750F1', '34A0FC52', '6269B17D', '87D0DC8F', '3A060129', '61A7ED4D', 'C7FB7CD5', '1D7C84D3', '7D4DF5DE', '4209B4F6',
      '3CA19A5D', '719712E0', '1023CC2E', '05D1FFB0', 'B2E4470D', '71AA912E', '2D4F6AD6', '7E9BB532', '5A4F9682', '78342B1F'
    ];

    console.log(`📦 [Add Codes] Generated ${generatedCodes.length} codes from console output`);

    // Convert codes to hashes
    const hashes = generatedCodes.map(code => {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(code));
      return hash;
    });

    console.log(`🔐 [Add Codes] Converted to ${hashes.length} hashes`);

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
    console.log('\n🔐 [Add Codes] Adding hashes to contract...');
    console.log('⏳ [Add Codes] This may take a moment for 100 hashes...');
    
    const tx = await contract.addValidCodes(hashes);
    
    console.log('⏳ [Add Codes] Transaction sent:', tx.hash);
    console.log('⏳ [Add Codes] Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ [Add Codes] Transaction confirmed:', receipt.hash);
    console.log('✅ [Add Codes] Gas used:', receipt.gasUsed.toString());

    // Verify the hashes were added
    console.log('\n🔍 [Add Codes] Verifying hashes were added...');
    
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
    const sampleCodes = generatedCodes.slice(0, 10); // Check first 10 codes
    
    for (let i = 0; i < sampleCodes.length; i++) {
      const code = sampleCodes[i];
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

    console.log(`\n📊 [Add Codes] Sample verification: ${validCount}/${sampleCodes.length} hashes valid`);
    
    if (validCount > 0) {
      console.log('🎉 [Add Codes] SUCCESS: Codes have been added to the contract!');
      console.log('\n💡 [Add Codes] You can now verify with:');
      console.log(`   node scripts/quick-verify.js ${collectionAddress}`);
      console.log(`   node scripts/check-contract-info.js ${collectionAddress}`);
    } else {
      console.log('⚠️  [Add Codes] Verification failed - codes may not have been added');
    }

  } catch (error) {
    console.error('💥 [Add Codes] Error:', error);
    
    if (error.message.includes('nonce')) {
      console.log('\n💡 [Add Codes] Nonce error detected. Try again in a few seconds.');
    } else if (error.message.includes('insufficient funds')) {
      console.log('\n💡 [Add Codes] Insufficient funds for gas. Check your wallet balance.');
    } else if (error.message.includes('execution reverted')) {
      console.log('\n💡 [Add Codes] Transaction reverted. Check if you have permission to add codes.');
    }
  }
}

addGeneratedCodes();
