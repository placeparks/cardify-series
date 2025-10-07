import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      stripeSessionId,
      paymentIntentId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      billingAddress,
      totalAmountCents,
      currency = 'usd',
      quantity,
      productType,
      productDetails,
      cardFinish,
      includeDisplayCase = false,
      displayCaseQuantity = 0,
      imageUrl,
      originalFilename,
      shippingCountry,
      shippingCostCents,
      shippingRateId,
      status = 'pending',
      paymentStatus = 'pending',
      metadata = {},
      stripeMetadata = {}
    } = body

    // Validate required fields
    if (!stripeSessionId || !customerEmail || !shippingAddress || !totalAmountCents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Prepare order data
    const orderData = {
      stripe_session_id: stripeSessionId,
      payment_intent_id: paymentIntentId,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      total_amount_cents: totalAmountCents,
      currency,
      quantity: quantity || 1,
      product_type: productType,
      product_details: productDetails,
      card_finish: cardFinish,
      include_display_case: includeDisplayCase,
      display_case_quantity: displayCaseQuantity,
      image_url: imageUrl,
      original_filename: originalFilename,
      shipping_country: shippingCountry,
      shipping_cost_cents: shippingCostCents,
      shipping_rate_id: shippingRateId,
      status,
      payment_status: paymentStatus,
      metadata,
      stripe_metadata: stripeMetadata
    }

    // Insert order details
    const { data, error } = await supabase
      .from('order_details')
      .insert(orderData)
      .select('id')
      .single()

    if (error) {
      console.error('Error saving order details:', error)
      return NextResponse.json(
        { error: 'Failed to save order details', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      message: 'Order details saved successfully'
    })

  } catch (error) {
    console.error('Error in save order details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get order details by session ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const email = searchParams.get('email')

    if (!sessionId && !email) {
      return NextResponse.json(
        { error: 'Session ID or email required' },
        { status: 400 }
      )
    }

    let query = supabase.from('order_details').select('*')

    if (sessionId) {
      query = query.eq('stripe_session_id', sessionId)
    } else if (email) {
      query = query.eq('customer_email', email)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching order details:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order details' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orders: data
    })

  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
