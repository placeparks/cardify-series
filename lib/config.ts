// Environment configuration for ERC1155 collection generation

export const config = {
  // Network configuration
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
  
  // Contract addresses
  factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS_ERC1155!,
  
  // Wallet configuration
  privateKey: process.env.WALLET_PRIVATE_KEY!,
  
  // Database configuration
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY!,
  
  // Application configuration
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  
  // Collection generation settings
  defaultRoyaltyBps: 250, // 2.5%
  codeLength: 8,
  batchSize: 50, // For adding codes to contract
  
  // Image upload settings
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
}

// Validation function
export function validateConfig() {
  const required = [
    'factoryAddress',
    'privateKey',
    'supabaseUrl',
    'supabaseServiceKey'
  ]
  
  const missing = required.filter(key => !config[key as keyof typeof config])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
