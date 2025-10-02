import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type')
    
    let file: File
    
    if (contentType?.includes('application/json')) {
      // Handle JSON request with imageUrl
      const { imageUrl } = await req.json()
      
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Image URL is required' },
          { status: 400 }
        )
      }

      // Fetch the image from the URL
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image')
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const blob = new Blob([imageBuffer], { type: 'image/png' })
      file = new File([blob], 'card-image.png', { type: 'image/png' })
    } else {
      // Handle FormData request with file
      const formData = await req.formData()
      const uploadedFile = formData.get('file') as File
      
      if (!uploadedFile) {
        return NextResponse.json(
          { error: 'File is required' },
          { status: 400 }
        )
      }
      
      file = uploadedFile
    }

    const pinataFormData = new FormData()
    pinataFormData.append('file', file)
    
    // Add metadata
    const metadata = JSON.stringify({
      name: 'Cardify Card Image',
      description: 'AI-generated trading card image',
      keyvalues: {
        type: 'cardify-card',
        generated: new Date().toISOString()
      }
    })
    pinataFormData.append('pinataMetadata', metadata)
    
    // Add options
    const options = JSON.stringify({
      cidVersion: 1
    })
    pinataFormData.append('pinataOptions', options)

    // Upload to Pinata using JWT
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: pinataFormData,
    })

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      console.error('Pinata upload failed:', errorText)
      throw new Error('Failed to upload to Pinata')
    }

    const result = await pinataResponse.json()
    const pinataUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`

    return NextResponse.json({
      success: true,
      pinataUrl,
      ipfsHash: result.IpfsHash
    })

  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
