import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'
// ERC1155 Factory Contract ABI
const erc1155FactoryAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "collection",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "mintPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxSupply",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "royaltyRecipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint96",
        "name": "royaltyBps",
        "type": "uint96"
      }
    ],
    "name": "CollectionDeployed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "baseUri",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "mintPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxSupply",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "royaltyRecipient",
        "type": "address"
      },
      {
        "internalType": "uint96",
        "name": "royaltyBps",
        "type": "uint96"
      }
    ],
    "name": "createCollection",
    "outputs": [
      {
        "internalType": "address",
        "name": "collection",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
import crypto from 'crypto'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ERC1155 Factory contract address
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_ERC1155!

// Network configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!

interface GenerateCollectionRequest {
  collectionNumber: number
  name: string
  symbol: string
  image: string // Base64 encoded image
  description?: string
  maxSupply: number
  royaltyRecipient: string
  royaltyBps: number
}

interface GenerateCollectionResponse {
  success: boolean
  collectionAddress?: string
  codes?: string[]
  transactionHash?: string
  error?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<GenerateCollectionResponse>> {
  console.log('🚀 [NFT Collection] Starting collection generation...')
  
  try {
    const body: GenerateCollectionRequest = await req.json()
    console.log('📝 [NFT Collection] Request body:', {
      collectionNumber: body.collectionNumber,
      name: body.name,
      symbol: body.symbol,
      maxSupply: body.maxSupply,
      imageLength: body.image?.length || 0
    })
    
    // Validate required fields
    if (!body.collectionNumber || !body.name || !body.symbol || !body.image || !body.maxSupply) {
      console.log('❌ [NFT Collection] Missing required fields')
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: collectionNumber, name, symbol, image, maxSupply'
      }, { status: 400 })
    }

    // Check authentication using cookies
    console.log('🔐 [NFT Collection] Checking authentication...')
    const supabaseServer = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization')
    console.log('🔑 [NFT Collection] Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('❌ [NFT Collection] No auth header found')
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(authHeader.replace('Bearer ', ''))
    console.log('👤 [NFT Collection] User authenticated:', !!user, 'Error:', authError?.message)
    
    if (authError || !user) {
      console.log('❌ [NFT Collection] Authentication failed')
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Check user credits (need 10 extra credits for NFT generation)
    console.log('💰 [NFT Collection] Checking user credits...')
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    console.log('💳 [NFT Collection] Profile data:', { credits: profile?.credits, error: profileError?.message })

    if (profileError || !profile) {
      console.log('❌ [NFT Collection] User profile not found')
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 })
    }

    const requiredCredits = 10 // Extra credits for NFT generation
    console.log('💵 [NFT Collection] Credit check:', { userCredits: profile.credits, required: requiredCredits })
    
    if (profile.credits < requiredCredits) {
      console.log('❌ [NFT Collection] Insufficient credits')
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. You need ${requiredCredits} credits for NFT generation.`
      }, { status: 400 })
    }

    // Validate private key
    if (!PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Wallet private key not configured'
      }, { status: 500 })
    }

    // Setup provider and wallet
    console.log('🔗 [NFT Collection] Setting up blockchain connection...')
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    console.log('👛 [NFT Collection] Wallet address:', wallet.address)

    // Use the provided image URI (should be Pinata URL)
    const imageUri = body.image
    console.log('🖼️ [NFT Collection] Image URI:', imageUri.substring(0, 50) + '...')
    
    // Extract CID from Pinata URL
    const pinataCid = extractCidFromPinataUrl(imageUri)
    console.log('🔗 [NFT Collection] Pinata CID extracted:', pinataCid ? 'Yes' : 'No')
    
    // Generate random codes
    console.log('🎲 [NFT Collection] Generating codes...')
    const codes = generateRandomCodes(body.maxSupply)
    const hashes = codes.map(code => ethers.keccak256(ethers.toUtf8Bytes(code)))
    console.log('🔐 [NFT Collection] Generated', codes.length, 'codes')

    // Deploy ERC1155 collection contract
    console.log('📄 [NFT Collection] Deploying contract...')
    const factoryContract = new ethers.Contract(FACTORY_ADDRESS, erc1155FactoryAbi, wallet)
    
    console.log('🏭 [NFT Collection] Factory address:', FACTORY_ADDRESS)
    console.log('📋 [NFT Collection] Collection params:', {
      name: body.name,
      symbol: body.symbol,
      maxSupply: body.maxSupply,
      royaltyBps: body.royaltyBps || 250
    })
    
    const tx = await factoryContract.createCollection(
      imageUri, // baseUri
      0, // mintPrice (always 0 as requested)
      body.maxSupply,
      body.name,
      body.symbol,
      body.description || '',
      body.royaltyRecipient || wallet.address,
      body.royaltyBps || 250 // 2.5% default royalty
    )

    console.log('⏳ [NFT Collection] Transaction sent:', tx.hash)
    console.log('⏳ [NFT Collection] Waiting for confirmation...')

    const receipt = await tx.wait()
    console.log('✅ [NFT Collection] Contract deployed:', receipt.hash)
    
    // Get the deployed collection address from the event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = factoryContract.interface.parseLog(log)
        return parsed?.name === 'CollectionDeployed'
      } catch {
        return false
      }
    })

    if (!event) {
      throw new Error('Collection deployment event not found')
    }

    const parsedEvent = factoryContract.interface.parseLog(event)
    const collectionAddress = parsedEvent?.args.collection
    console.log('📍 [NFT Collection] Collection address:', collectionAddress)

    // Wait a bit before adding codes to avoid nonce conflicts
    console.log('⏳ [NFT Collection] Waiting before adding codes...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Add all codes to the deployed contract in one transaction
    console.log('🔐 [NFT Collection] Adding all codes to contract...')
    const collectionContract = new ethers.Contract(
      collectionAddress,
      [
        {
          "inputs": [{"internalType": "bytes32[]", "name": "hashes", "type": "bytes32[]"}],
          "name": "addValidCodes",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      wallet
    )

    console.log(`📦 [NFT Collection] Adding ${hashes.length} codes in one transaction...`)
    const addCodesTx = await collectionContract.addValidCodes(hashes)
    console.log(`⏳ [NFT Collection] Codes transaction sent:`, addCodesTx.hash)
    
      await addCodesTx.wait()
    console.log(`✅ [NFT Collection] All codes added successfully`)

    // Store collection info in database with enhanced schema
    console.log('💾 [NFT Collection] Storing collection in database...', {
      address: collectionAddress.toLowerCase(),
      name: body.name,
      symbol: body.symbol,
      maxSupply: body.maxSupply,
      active: true // All user collections are active by default
    })
    
    const { error: collectionError } = await supabaseServer.from('collections').insert({
      address: collectionAddress.toLowerCase(),
      owner: user.id, // Use user ID instead of wallet address
      cid: pinataCid, // Pinata Content ID from image upload
      collection_type: 'erc1155',
      name: body.name,
      symbol: body.symbol,
      description: body.description,
      max_supply: body.maxSupply,
      mint_price: 0, // Always 0 as per your contract
      image_uri: imageUri,
      base_uri: imageUri, // Using imageUri as base_uri for ERC1155
      royalty_recipient: body.royaltyRecipient || wallet.address,
      royalty_bps: body.royaltyBps || 250,
      active: true, // All user collections are active by default
      created_at: new Date().toISOString()
    })

    if (collectionError) {
      console.error('❌ [NFT Collection] Error storing collection:', collectionError)
      return NextResponse.json({
        success: false,
        error: 'Failed to store collection in database'
      }, { status: 500 })
    }

    // Store codes in database with enhanced schema
    const codesData = codes.map((code, index) => ({
      collection_address: collectionAddress.toLowerCase(),
      code: code,
      hash: hashes[index],
      used: false,
      used_by: null,
      used_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error: codesError } = await supabaseServer.from('collection_codes').insert(codesData)
    
    if (codesError) {
      console.error('❌ [NFT Collection] Error storing codes:', codesError)
      return NextResponse.json({
        success: false,
        error: 'Failed to store codes in database'
      }, { status: 500 })
    }

    // Deduct credits from user
    console.log('💰 [NFT Collection] Deducting credits...', {
      userId: user.id,
      currentCredits: profile.credits,
      deducting: requiredCredits,
      newBalance: profile.credits - requiredCredits
    })
    
    const { error: creditError } = await supabaseServer
      .from('profiles')
      .update({ 
        credits: profile.credits - requiredCredits 
      })
      .eq('id', user.id)

    if (creditError) {
      console.error('❌ [NFT Collection] Error deducting credits:', creditError)
      return NextResponse.json({
        success: false,
        error: 'Failed to deduct credits'
      }, { status: 500 })
    }
    
    console.log('✅ [NFT Collection] Credits deducted successfully')
    
    // Verify credits were actually deducted
    const { data: updatedProfile, error: verifyError } = await supabaseServer
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()
    
    if (verifyError) {
      console.error('❌ [NFT Collection] Error verifying credit deduction:', verifyError)
    } else {
      console.log('✅ [NFT Collection] Credit verification:', {
        originalCredits: profile.credits,
        newCredits: updatedProfile.credits,
        deducted: profile.credits - updatedProfile.credits
      })
    }

    return NextResponse.json({
      success: true,
      collectionAddress,
      codes,
      transactionHash: receipt.hash,
      creditsDeducted: requiredCredits,
      newCreditBalance: updatedProfile?.credits || 'unknown',
      collection: {
        address: collectionAddress,
        name: body.name,
        symbol: body.symbol,
        maxSupply: body.maxSupply,
        active: true,
        type: 'erc1155'
      }
    })

  } catch (error) {
    console.error('💥 [NFT Collection] Error generating collection:', error)
    console.error('💥 [NFT Collection] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// Image upload is now handled by Pinata in the frontend

function generateRandomCodes(count: number): string[] {
  const codes: string[] = []
  const usedCodes = new Set<string>()
  
  while (codes.length < count) {
    // Generate a random 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    
    if (!usedCodes.has(code)) {
      codes.push(code)
      usedCodes.add(code)
    }
  }
  
  return codes
}

function extractCidFromPinataUrl(pinataUrl: string): string | null {
  try {
    // Pinata URLs typically look like: https://gateway.pinata.cloud/ipfs/QmHash...
    // or https://ipfs.io/ipfs/QmHash...
    const url = new URL(pinataUrl)
    
    // Extract CID from pathname (e.g., /ipfs/QmHash...)
    const pathParts = url.pathname.split('/')
    const ipfsIndex = pathParts.indexOf('ipfs')
    
    if (ipfsIndex !== -1 && pathParts[ipfsIndex + 1]) {
      return pathParts[ipfsIndex + 1]
    }
    
    // Fallback: try to extract from the end of the URL
    const pathSegments = url.pathname.split('/')
    const lastSegment = pathSegments[pathSegments.length - 1]
    
    // Check if it looks like a CID (starts with Qm, bafy, etc.)
    if (lastSegment && (lastSegment.startsWith('Qm') || lastSegment.startsWith('bafy'))) {
      return lastSegment
    }
    
    console.log('⚠️ [CID Extraction] Could not extract CID from URL:', pinataUrl)
    return null
  } catch (error) {
    console.error('❌ [CID Extraction] Error extracting CID:', error)
    return null
  }
}
