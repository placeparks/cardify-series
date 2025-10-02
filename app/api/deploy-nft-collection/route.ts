import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ethers } from 'ethers'

// ERC1155 Factory ABI
const ERC1155_FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name_", "type": "string" },
      { "internalType": "string", "name": "symbol_", "type": "string" },
      { "internalType": "string", "name": "baseURI_", "type": "string" },
      { "internalType": "uint256", "name": "maxSupply_", "type": "uint256" },
      { "internalType": "uint256", "name": "mintPrice_", "type": "uint256" },
      { "internalType": "uint96", "name": "royaltyBps_", "type": "uint96" },
      { "internalType": "address", "name": "royaltyReceiver_", "type": "address" }
    ],
    "name": "createCollection",
    "outputs": [{ "internalType": "address", "name": "clone", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "collection", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "symbol", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "mintPrice", "type": "uint256" },
      { "indexed": false, "internalType": "uint96", "name": "royaltyBps", "type": "uint96" },
      { "indexed": false, "internalType": "address", "name": "royaltyReceiver", "type": "address" }
    ],
    "name": "CollectionDeployed",
    "type": "event"
  }
]

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_NFT_ONLY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      symbol,
      description,
      baseUri,
      maxSupply,
      mintPrice,
      royaltyBps,
      royaltyRecipient,
      ownerAddress
    } = body

    // Validate required fields
    if (!name || !symbol || !baseUri || !maxSupply || !ownerAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate max supply (5-1000)
    if (maxSupply < 5 || maxSupply > 1000) {
      return NextResponse.json(
        { success: false, error: 'Max supply must be between 5 and 1000' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Get user from request (you'll need to implement auth)
    const authHeader = request.headers.get('authorization')
    console.log('🔐 [API Debug] Auth header present:', !!authHeader)
    console.log('🔐 [API Debug] Auth header value:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      console.log('❌ [API Debug] No authorization header found')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔐 [API Debug] Token length:', token.length)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    console.log('🔐 [API Debug] Auth error:', authError)
    console.log('🔐 [API Debug] User exists:', !!user)
    console.log('🔐 [API Debug] User ID:', user?.id)
    
    if (authError || !user) {
      console.log('❌ [API Debug] Authentication failed')
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Check user credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < 20) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits. You need 20 credits to deploy an NFT collection.' },
        { status: 400 }
      )
    }

    // Initialize blockchain connection with ADMIN WALLET
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org')
    const adminWallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, provider)
    
    console.log('🔑 [Admin Wallet] Using admin wallet for deployment:', adminWallet.address)
    console.log('💰 [Admin Wallet] Admin wallet balance:', (await adminWallet.provider.getBalance(adminWallet.address)).toString())

    // Create factory contract instance with ADMIN WALLET
    const factory = new ethers.Contract(FACTORY_ADDRESS, ERC1155_FACTORY_ABI, adminWallet)

    // Convert mint price to wei
    const mintPriceWei = ethers.parseEther(mintPrice.toString())

    console.log('🚀 [NFT Collection] Deploying collection with ADMIN WALLET...')
    console.log('📝 [NFT Collection] Name:', name)
    console.log('🏷️ [NFT Collection] Symbol:', symbol)
    console.log('🔗 [NFT Collection] Base URI:', baseUri)
    console.log('📊 [NFT Collection] Max Supply:', maxSupply)
    console.log('💰 [NFT Collection] Mint Price:', mintPriceWei.toString())
    console.log('👑 [NFT Collection] Royalty BPS:', royaltyBps)
    console.log('🎯 [NFT Collection] Royalty Recipient:', royaltyRecipient)
    console.log('👤 [NFT Collection] Final Owner (after transfer):', ownerAddress)
    console.log('🏭 [NFT Collection] Factory Address:', FACTORY_ADDRESS)
    console.log('🔧 [NFT Collection] Factory Contract:', factory.address)

    // Ensure royalty recipient is a valid address
    if (!ethers.isAddress(royaltyRecipient)) {
      throw new Error('Invalid royalty recipient address')
    }

    // Deploy the collection
    console.log('🚀 [NFT Collection] Calling factory.createCollection with admin wallet as msg.sender')
    console.log('👤 [NFT Collection] Admin wallet (msg.sender):', adminWallet.address)
    
    const tx = await factory.createCollection(
      name,
      symbol,
      baseUri,
      maxSupply,
      mintPriceWei,
      royaltyBps,
      royaltyRecipient
    )

    console.log('⏳ [NFT Collection] Transaction sent:', tx.hash)
    const receipt = await tx.wait()
    console.log('✅ [NFT Collection] Transaction confirmed:', receipt.hash)

    // Extract collection address from events
    console.log('🔍 [NFT Collection] Parsing transaction logs...')
    console.log('📋 [NFT Collection] Total logs:', receipt.logs.length)
    
    let collectionAddress = null
    let parsedEvent = null
    
    // Try to find the CollectionDeployed event
    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log)
        console.log('📝 [NFT Collection] Parsed log:', parsed?.name)
        
        if (parsed?.name === 'CollectionDeployed') {
          parsedEvent = parsed
          // Based on the contract: CollectionDeployed(creator, collection, name, symbol, mintPrice, royaltyBps, royaltyReceiver)
          // collection is at index 1 (second argument)
          collectionAddress = parsed.args[1] // collection address is the second argument
          console.log('✅ [NFT Collection] Found CollectionDeployed event!')
          console.log('📍 [NFT Collection] Collection address:', collectionAddress)
          console.log('👤 [NFT Collection] Creator:', parsed.args[0])
          console.log('📝 [NFT Collection] Name:', parsed.args[2])
          console.log('🏷️ [NFT Collection] Symbol:', parsed.args[3])
          console.log('💰 [NFT Collection] Mint Price:', parsed.args[4])
          console.log('👑 [NFT Collection] Royalty BPS:', parsed.args[5])
          console.log('🎯 [NFT Collection] Royalty Receiver:', parsed.args[6])
          break
        }
      } catch (error) {
        console.log('⚠️ [NFT Collection] Failed to parse log:', error)
        continue
      }
    }

    // If no event found, try alternative approach
    if (!collectionAddress) {
      console.log('🔄 [NFT Collection] No CollectionDeployed event found, trying alternative approach...')
      
      // Check if the transaction was successful and try to get the return value
      if (receipt.status === 1) {
        console.log('✅ [NFT Collection] Transaction successful, but no event found')
        console.log('📋 [NFT Collection] All logs:', receipt.logs.map((log, index) => ({
          index,
          topics: log.topics,
          data: log.data
        })))
        
        // Try to get the return value from the transaction
        try {
          const returnData = await adminWallet.provider.call({
            to: FACTORY_ADDRESS,
            data: tx.data
          })
          console.log('📋 [NFT Collection] Return data:', returnData)
          
          // If we can't find the event, we might need to use a different approach
          // For now, let's throw a more helpful error
          throw new Error(`Collection deployment event not found. Transaction successful but no CollectionDeployed event emitted. Please check:
1. Factory contract ABI is correct
2. Factory contract address is correct: ${FACTORY_ADDRESS}
3. Event name matches: CollectionDeployed
4. Contract actually emits this event`)
        } catch (callError) {
          console.error('❌ [NFT Collection] Failed to get return data:', callError)
          throw new Error('Collection deployment event not found. Please check the factory contract implementation.')
        }
      } else {
        throw new Error('Transaction failed')
      }
    }

    if (!collectionAddress) {
      throw new Error('Failed to extract collection address from deployment event')
    }

    console.log('🎉 [NFT Collection] Collection deployed at:', collectionAddress)

    // Wait a moment to ensure contract is fully deployed and initialized
    console.log('⏳ [NFT Collection] Waiting for contract initialization...')
    await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay for contract to be fully ready

    // Verify the contract is deployed and accessible
    console.log('🔍 [NFT Collection] Verifying contract deployment...')
    try {
      const collectionContract = new ethers.Contract(collectionAddress, [
        {
          "inputs": [],
          "name": "owner",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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
        },
        {
          "inputs": [],
          "name": "mintPrice",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
          "name": "transferOwnership",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ], adminWallet)

      // Check contract state after deployment
      console.log('🔍 [NFT Collection] Checking contract state...')
      
      try {
        const currentOwner = await collectionContract.owner()
        console.log('👤 [NFT Collection] Current owner:', currentOwner)
        console.log('👤 [NFT Collection] Expected admin:', adminWallet.address)
        
        // Check if contract has been initialized
        const contractName = await collectionContract.name()
        const contractSymbol = await collectionContract.symbol()
        const contractMaxSupply = await collectionContract.maxSupply()
        const contractMintPrice = await collectionContract.mintPrice()
        
        console.log('📝 [NFT Collection] Contract name:', contractName)
        console.log('🏷️ [NFT Collection] Contract symbol:', contractSymbol)
        console.log('📊 [NFT Collection] Contract max supply:', contractMaxSupply.toString())
        console.log('💰 [NFT Collection] Contract mint price:', contractMintPrice.toString())
        
        if (currentOwner.toLowerCase() !== adminWallet.address.toLowerCase()) {
          throw new Error(`Contract owner mismatch. Expected: ${adminWallet.address}, Got: ${currentOwner}`)
        }
        
        if (contractName === '' || contractSymbol === '') {
          throw new Error(`Contract not properly initialized. Name: "${contractName}", Symbol: "${contractSymbol}"`)
        }
        
      } catch (error) {
        console.error('❌ [NFT Collection] Contract state check failed:', error)
        throw new Error(`Contract state verification failed: ${error.message}`)
      }

      console.log('✅ [NFT Collection] Contract verified and ready for ownership transfer')

      // Transfer ownership to the user's embedded wallet (using ADMIN WALLET)
      console.log('🔄 [NFT Collection] Transferring ownership from admin to user...')
      console.log('👤 [NFT Collection] From (Admin):', adminWallet.address)
      console.log('👤 [NFT Collection] To (User):', ownerAddress)
      
      const transferTx = await collectionContract.transferOwnership(ownerAddress)
      console.log('⏳ [NFT Collection] Ownership transfer sent:', transferTx.hash)
      const transferReceipt = await transferTx.wait()
      console.log('✅ [NFT Collection] Ownership transferred successfully!')

      // Verify ownership was transferred
      const newOwner = await collectionContract.owner()
      console.log('👤 [NFT Collection] New owner:', newOwner)
      console.log('👤 [NFT Collection] Expected user:', ownerAddress)
      
      if (newOwner.toLowerCase() !== ownerAddress.toLowerCase()) {
        throw new Error(`Ownership transfer failed. Expected: ${ownerAddress}, Got: ${newOwner}`)
      }

      console.log('🎉 [NFT Collection] User now owns the collection at:', collectionAddress)
    } catch (error) {
      console.error('❌ [NFT Collection] Contract verification or ownership transfer failed:', error)
      throw new Error(`Failed to verify contract or transfer ownership: ${error.message}`)
    }

    // Extract CID from Pinata URL
    const extractCidFromPinataUrl = (pinataUrl: string): string | null => {
      try {
        const url = new URL(pinataUrl)
        const pathParts = url.pathname.split('/')
        const ipfsIndex = pathParts.indexOf('ipfs')
        if (ipfsIndex !== -1 && pathParts[ipfsIndex + 1]) {
          return pathParts[ipfsIndex + 1]
        }
        const pathSegments = url.pathname.split('/')
        const lastSegment = pathSegments[pathSegments.length - 1]
        if (lastSegment && (lastSegment.startsWith('Qm') || lastSegment.startsWith('bafy'))) {
          return lastSegment
        }
        return null
      } catch (error) {
        console.error('❌ [CID Extraction] Error extracting CID:', error)
        return null
      }
    }

    const pinataCid = extractCidFromPinataUrl(baseUri)

    // Save collection to database
    const { error: collectionError } = await supabase
      .from('nft_collections')
      .insert({
        collection_address: collectionAddress.toLowerCase(),
        owner_address: ownerAddress.toLowerCase(),
        user_id: user.id,
        name,
        symbol,
        description,
        base_uri: baseUri,
        image_uri: baseUri,
        max_supply: maxSupply,
        mint_price: mintPriceWei.toString(),
        royalty_bps: royaltyBps,
        royalty_recipient: royaltyRecipient.toLowerCase(),
        cid: pinataCid,
        active: true
      })

    if (collectionError) {
      console.error('❌ [NFT Collection] Database error:', collectionError)
      throw new Error('Failed to save collection to database')
    }

    // Deduct credits
    console.log('💰 [NFT Collection] Deducting credits...')
    console.log('💰 [NFT Collection] Current credits:', profile.credits)
    console.log('💰 [NFT Collection] Deducting: 20 credits')
    console.log('💰 [NFT Collection] New balance will be:', profile.credits - 20)
    
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ 
        credits: profile.credits - 20 
      })
      .eq('id', user.id)

    if (creditError) {
      console.error('❌ [NFT Collection] Credit deduction error:', creditError)
      throw new Error('Failed to deduct credits')
    }

    // Verify credits were actually deducted
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (verifyError) {
      console.error('❌ [NFT Collection] Credit verification error:', verifyError)
    } else {
      console.log('✅ [NFT Collection] Credits verified - New balance:', updatedProfile.credits)
    }

    console.log('✅ [NFT Collection] Credits deducted: 20')
    console.log('✅ [NFT Collection] Collection saved to database')

    return NextResponse.json({
      success: true,
      collectionAddress,
      transactionHash: receipt.hash,
      creditsDeducted: 20,
      message: 'NFT collection deployed successfully!'
    })

  } catch (error) {
    console.error('❌ [NFT Collection] Deployment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}
