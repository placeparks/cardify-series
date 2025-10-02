# 🔍 Contract Hash Verification Scripts

These scripts help you verify that hashes are successfully added to your deployed ERC1155 collection contracts.

## 📁 Available Scripts

### 1. `quick-verify.js` - Quick Contract Check
**Purpose**: Quickly check if a contract is deployed and accessible.

```bash
node scripts/quick-verify.js <collection-address>
```

**Example**:
```bash
node scripts/quick-verify.js 0x1234567890123456789012345678901234567890
```

**What it does**:
- ✅ Checks if contract is accessible
- ✅ Gets basic contract info (name, symbol, maxSupply)
- ✅ Tests a few sample hashes
- ✅ Shows if hashes are valid/used

### 2. `verify-contract-hashes.js` - Comprehensive Hash Verification
**Purpose**: Thoroughly verify that specific codes/hashes are properly added to a contract.

```bash
node scripts/verify-contract-hashes.js <collection-address> <code1,code2,code3>
```

**Example**:
```bash
node scripts/verify-contract-hashes.js 0x1234... ABC123,XYZ789,TEST456
```

**What it does**:
- ✅ Verifies each provided code
- ✅ Checks if hashes are valid and unused
- ✅ Shows detailed results for each code
- ✅ Calculates success rate
- ✅ Provides comprehensive summary

### 3. `verify-recent-collections.js` - Recent Collections Scanner
**Purpose**: Find and verify recently deployed collections from your factory.

```bash
node scripts/verify-recent-collections.js
```

**What it does**:
- ✅ Scans recent blockchain blocks for CollectionDeployed events
- ✅ Lists all recent collections with details
- ✅ Verifies each collection's basic info
- ✅ Tests sample codes on each collection

### 4. `test-verification.js` - Test Hash Generation
**Purpose**: Test the hash generation process without connecting to blockchain.

```bash
node scripts/test-verification.js
```

**What it does**:
- ✅ Tests hash generation with sample codes
- ✅ Shows how codes are converted to hashes
- ✅ Provides usage instructions

## 🚀 How to Use

### Step 1: Deploy a Collection
1. Use your NFT generation feature in the app
2. Fill out the collection form
3. Submit to generate a collection
4. **Copy the collection address from the logs/response**

### Step 2: Verify the Collection
```bash
# Quick check
node scripts/quick-verify.js 0xYourCollectionAddress

# Detailed verification with specific codes
node scripts/verify-contract-hashes.js 0xYourCollectionAddress CODE1,CODE2,CODE3

# Find recent collections
node scripts/verify-recent-collections.js
```

## 📊 Understanding the Results

### ✅ Success Indicators
- **Valid & Unused**: Hash is properly added and ready to use
- **Used**: Hash was added but already used (normal for testing)
- **High Success Rate**: Most hashes are properly added

### ❌ Failure Indicators
- **Invalid**: Hash not found in contract
- **Low Success Rate**: Many hashes missing
- **Contract Not Found**: Address doesn't exist or isn't accessible

## 🔧 Environment Setup

Make sure you have these environment variables set:
```bash
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/your-key
NEXT_PUBLIC_FACTORY_ADDRESS_ERC1155=0xYourFactoryAddress
```

## 🐛 Troubleshooting

### "Contract not found"
- Check if the address is correct
- Verify the contract is deployed
- Check your RPC URL

### "No recent collections found"
- Make sure FACTORY_ADDRESS is set
- Check if any collections were deployed recently
- Try increasing the block range in the script

### "All hashes invalid"
- The `addValidCodes` transaction might have failed
- Check the deployment logs for errors
- Verify the contract has the `addValidCodes` function

## 📝 Example Workflow

1. **Deploy Collection**:
   ```
   User fills NFT form → API deploys contract → Returns collection address
   ```

2. **Get Collection Address**:
   ```
   Copy address from API response or logs
   Example: 0x8d10142C9e328828c4195D6E66d3cdA4ff0211f4
   ```

3. **Verify Collection**:
   ```bash
   node scripts/quick-verify.js 0x8d10142C9e328828c4195D6E66d3cdA4ff0211f4
   ```

4. **Check Specific Codes**:
   ```bash
   node scripts/verify-contract-hashes.js 0x8d10142C9e328828c4195D6E66d3cdA4ff0211f4 ABC123,XYZ789,TEST456
   ```

## 🎯 Expected Results

A successful verification should show:
- ✅ Contract is accessible
- ✅ Basic info (name, symbol, maxSupply) is correct
- ✅ Most or all hashes are "Valid & Unused"
- ✅ Success rate > 90%

This confirms that your NFT collection deployment and hash addition process is working correctly!
