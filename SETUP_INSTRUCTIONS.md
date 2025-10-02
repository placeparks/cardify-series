# ERC1155 Collection Generator Backend API

This backend API allows you to generate ERC1155 collections with your wallet's private key, upload images, generate hashes, and return codes to the frontend.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Network Configuration
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
NEXT_PUBLIC_FACTORY_ADDRESS_ERC1155=0x_your_factory_contract_address_here

# Wallet Configuration (REQUIRED - This is your wallet's private key)
WALLET_PRIVATE_KEY=your_wallet_private_key_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Database Setup

Run the SQL script in `database-schema.sql` in your Supabase SQL editor to create the required tables.

### 3. Deploy Smart Contracts

Make sure your ERC1155 Factory contract is deployed and you have the contract address.

### 4. Install Dependencies

The required dependencies are already in your `package.json`:
- `ethers` for blockchain interactions
- `@supabase/supabase-js` for database operations
- `crypto` for generating random codes

## API Endpoints

### POST /api/generate-collection

Generates a new ERC1155 collection with codes.

**Request Body:**
```json
{
  "collectionNumber": 1,
  "name": "My Collection",
  "symbol": "MC",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "description": "My awesome collection",
  "maxSupply": 100,
  "royaltyRecipient": "0x...",
  "royaltyBps": 250
}
```

**Response:**
```json
{
  "success": true,
  "collectionAddress": "0x...",
  "codes": ["ABC12345", "DEF67890", ...],
  "transactionHash": "0x..."
}
```

### GET /api/collections/[address]/codes

Retrieves codes for a specific collection.

**Query Parameters:**
- `used` (optional): Filter by used status (true/false)

### POST /api/collections/[address]/codes

Marks a code as used.

**Request Body:**
```json
{
  "code": "ABC12345"
}
```

## Usage Example

```typescript
import { collectionAPI } from '@/lib/collection-api'

// Generate a collection
const result = await collectionAPI.generateCollection({
  collectionNumber: 1,
  name: "My Collection",
  symbol: "MC",
  image: base64ImageString,
  maxSupply: 100
})

if (result.success) {
  console.log('Collection Address:', result.collectionAddress)
  console.log('Generated Codes:', result.codes)
}
```

## Security Notes

1. **Private Key Security**: Never commit your private key to version control. Use environment variables and consider using a dedicated wallet for this purpose.

2. **Database Security**: Use Supabase RLS (Row Level Security) policies to protect your data.

3. **Image Storage**: Consider using IPFS or cloud storage for production instead of local file storage.

4. **Rate Limiting**: Implement rate limiting to prevent abuse.

## Features

- ✅ Deploy ERC1155 contracts using your wallet
- ✅ Upload and store collection images
- ✅ Generate random codes and hashes
- ✅ Add codes to deployed contracts
- ✅ Store collection and code data in database
- ✅ Retrieve codes for collections
- ✅ Mark codes as used
- ✅ Frontend integration ready

## File Structure

```
app/
├── api/
│   ├── generate-collection/
│   │   └── route.ts          # Main collection generation endpoint
│   └── collections/
│       └── [address]/
│           └── codes/
│               └── route.ts  # Code management endpoints
lib/
├── collection-api.ts         # Frontend API client
├── config.ts                 # Configuration utilities
└── erc1155-factory.ts        # Existing factory ABI
components/
└── CollectionGenerator.tsx   # Example React component
database-schema.sql           # Database setup script
```

## Next Steps

1. Set up your environment variables
2. Run the database schema script
3. Deploy your factory contract
4. Test the API endpoints
5. Integrate with your frontend
