-- =====================================================
-- FIX SERIES CARD LINKING
-- =====================================================
-- This script fixes cards that were created without being properly linked to their series

-- STEP 1: Link the card to the series
-- Replace the IDs with your actual card and series IDs
UPDATE public.generated_images 
SET 
    series_id = '59bfee75-7023-4ec6-b217-137414aa18e6', -- Your series ID
    featured = true
WHERE id = '0444b345-d2f2-4915-95a0-0568359e385f'; -- Your card ID

-- STEP 2: Update user_assets to sync the featured flag
-- This should happen automatically via trigger, but we'll manually update just in case
UPDATE public.user_assets 
SET featured = true
WHERE source_id = '0444b345-d2f2-4915-95a0-0568359e385f' 
AND asset_type = 'generated';

-- STEP 3: Create marketplace listing
-- Replace the IDs with your actual values
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
    '4141ef49-ce8c-429e-a0ac-79057fcf8d2c', -- Your user ID
    '0444b345-d2f2-4915-95a0-0568359e385f', -- Your card ID
    'Generated Card',
    'Generated Card',
    900, -- $9.00
    'USD',
    'active',
    ARRAY['featured']::text[],
    true,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING; -- Prevent duplicates if listing already exists

-- STEP 4: Verify the changes
-- Check if card is now linked to series
SELECT 
    gi.id as card_id,
    gi.title as card_title,
    gi.series_id,
    gi.featured,
    s.title as series_title
FROM public.generated_images gi
LEFT JOIN public.series s ON gi.series_id = s.id
WHERE gi.id = '0444b345-d2f2-4915-95a0-0568359e385f';

-- Check if user_assets has the featured flag
SELECT 
    ua.id,
    ua.asset_type,
    ua.source_id,
    ua.featured
FROM public.user_assets ua
WHERE ua.source_id = '0444b345-d2f2-4915-95a0-0568359e385f';

-- Check if marketplace listing was created
SELECT 
    ml.id,
    ml.title,
    ml.price_cents,
    ml.featured,
    ml.status
FROM public.marketplace_listings ml
WHERE ml.asset_id = '0444b345-d2f2-4915-95a0-0568359e385f';

-- =====================================================
-- AUTOMATED FIX FOR ALL CARDS IN SERIES
-- =====================================================
-- Use this if you have multiple cards that need to be linked

-- Link all featured cards with no series_id to the specified series
UPDATE public.generated_images 
SET series_id = '59bfee75-7023-4ec6-b217-137414aa18e6'
WHERE featured = true 
AND series_id IS NULL
AND user_id = '4141ef49-ce8c-429e-a0ac-79057fcf8d2c';

-- Sync user_assets
UPDATE public.user_assets ua
SET featured = gi.featured
FROM public.generated_images gi
WHERE ua.source_id = gi.id 
AND ua.asset_type = 'generated'
AND gi.featured = true;

-- Create marketplace listings for all featured cards without listings
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
)
SELECT DISTINCT
    gi.user_id,
    gi.id,
    gi.title,
    gi.title,
    900,
    'USD',
    'active',
    ARRAY['featured']::text[],
    true,
    NOW(),
    NOW()
FROM public.generated_images gi
WHERE gi.featured = true
AND gi.series_id = '59bfee75-7023-4ec6-b217-137414aa18e6'
AND NOT EXISTS (
    SELECT 1 FROM public.marketplace_listings ml 
    WHERE ml.asset_id = gi.id
)
ON CONFLICT DO NOTHING;
