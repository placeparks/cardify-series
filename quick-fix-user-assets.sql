-- =====================================================
-- QUICK FIX: SYNC FEATURED FLAG TO USER_ASSETS
-- =====================================================

-- 0. Add series_id column to user_assets if it doesn't exist
ALTER TABLE public.user_assets 
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;

-- 1. Fix the existing card that was created
UPDATE public.generated_images 
SET 
    series_id = '59bfee75-7023-4ec6-b217-137414aa18e6',
    featured = true
WHERE id = '0444b345-d2f2-4915-95a0-0568359e385f';

-- 2. Sync the featured flag and series_id to user_assets
UPDATE public.user_assets 
SET 
    featured = true,
    series_id = '59bfee75-7023-4ec6-b217-137414aa18e6'
WHERE source_id = '0444b345-d2f2-4915-95a0-0568359e385f' 
AND asset_type = 'generated';

-- 3. Create marketplace listing for this card
INSERT INTO public.marketplace_listings (
    seller_id,
    asset_id,
    title,
    description,
    price_cents,
    currency,
    status,
    categories,
    featured,
    created_at,
    updated_at
) VALUES (
    '4141ef49-ce8c-429e-a0ac-79057fcf8d2c',
    '0444b345-d2f2-4915-95a0-0568359e385f',
    'Generated Card',
    'Generated Card',
    900,
    'USD',
    'active',
    ARRAY['featured']::text[],
    true,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- 4. Verify the fix worked
SELECT 
    gi.id,
    gi.title,
    gi.featured,
    gi.series_id,
    ua.featured as user_assets_featured,
    ua.series_id as user_assets_series_id,
    ml.id as marketplace_listing_id,
    ml.featured as listing_featured
FROM public.generated_images gi
LEFT JOIN public.user_assets ua ON gi.id = ua.source_id AND ua.asset_type = 'generated'
LEFT JOIN public.marketplace_listings ml ON gi.id = ml.asset_id
WHERE gi.id = '0444b345-d2f2-4915-95a0-0568359e385f';
