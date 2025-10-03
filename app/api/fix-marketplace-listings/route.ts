import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Find all featured cards that don't have marketplace listings
    const { data: featuredGeneratedCards, error: generatedError } = await supabase
      .from('generated_images')
      .select(`
        id, 
        user_id, 
        title, 
        featured, 
        series_id,
        series!left(title)
      `)
      .eq('user_id', user.id)
      .eq('featured', true)

    const { data: featuredUploadedCards, error: uploadedError } = await supabase
      .from('uploaded_images')
      .select(`
        id, 
        user_id, 
        title, 
        featured, 
        series_id,
        series!left(title)
      `)
      .eq('user_id', user.id)
      .eq('featured', true)

    if (generatedError || uploadedError) {
      return NextResponse.json({ error: 'Failed to fetch featured cards' }, { status: 500 })
    }

    const allFeaturedCards = [
      ...(featuredGeneratedCards || []).map(card => ({ ...card, assetType: 'generated' })),
      ...(featuredUploadedCards || []).map(card => ({ ...card, assetType: 'uploaded' }))
    ]

    let createdListings = 0
    let skippedListings = 0

    // Create marketplace listings for cards that don't have them
    for (const card of allFeaturedCards) {
      try {
        // Check if listing already exists
        const { data: existingListing } = await supabase
          .from('marketplace_listings')
          .select('id')
          .eq('asset_id', card.id)
          .eq('status', 'active')
          .single()

        if (existingListing) {
          skippedListings++
          continue
        }

        // Create marketplace listing
        const listingData = {
          seller_id: user.id,
          asset_id: card.id,
          title: card.title || (card.series ? `Featured Card - ${card.series.title}` : 'Featured Card'),
          description: card.title || (card.series ? `Featured Card - ${card.series.title}` : 'Featured Card'),
          price_cents: 900, // $9.00 for featured cards
          currency: 'USD',
          status: 'active',
          categories: ['featured'],
          featured: true
        }

        const { error: listingError } = await supabase
          .from('marketplace_listings')
          .insert(listingData)

        if (listingError) {
          console.error(`Failed to create listing for card ${card.id}:`, listingError)
        } else {
          createdListings++
        }
      } catch (error) {
        console.error(`Error processing card ${card.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${allFeaturedCards.length} featured cards. Created ${createdListings} new listings, skipped ${skippedListings} existing listings.`,
      totalCards: allFeaturedCards.length,
      createdListings,
      skippedListings
    })

  } catch (error: any) {
    console.error('Fix marketplace listings error:', error)
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 })
  }
}
