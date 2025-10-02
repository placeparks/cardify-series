import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    const { searchParams } = new URL(req.url)
    const used = searchParams.get('used') // Optional filter for used/unused codes

    let query = supabase
      .from('collection_codes')
      .select('*')
      .eq('collection_address', address.toLowerCase())
      .order('created_at', { ascending: false })

    // Filter by used status if specified
    if (used !== null) {
      query = query.eq('used', used === 'true')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch codes' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    // Mark code as used
    const { data, error } = await supabase
      .from('collection_codes')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('collection_address', address.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Code not found or already used' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, code: data[0] })
  } catch (error) {
    console.error('Error updating code:', error)
    return NextResponse.json(
      { error: 'Failed to update code' },
      { status: 500 }
    )
  }
}