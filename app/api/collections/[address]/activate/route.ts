import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/* shorthand for the context object that Next.js passes */
type Ctx = { params: Promise<{ address: string }> };

/* PUT /api/collections/:address/activate   body → { cid, active } */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const addrLc = (await params).address.toLowerCase();    // always lowercase
  const { cid, active } = await req.json();
  
  // If cid is provided without active flag, default to activating
  const shouldActivate = active !== undefined ? active : true;

  /* Update the collection's active state (and optionally cid) */
  const updateData: any = { active: shouldActivate };
  if (cid) {
    updateData.cid = cid;
  }

  const { error: updErr } = await supabase
    .from('collections')
    .update(updateData)
    .eq('address', addrLc);

  if (updErr) {
    if (updErr.code === 'PGRST116')        /* no such row (not found) */
      return NextResponse.json({ error: 'collection not found' }, { status: 404 });
    return NextResponse.json({ error: updErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
