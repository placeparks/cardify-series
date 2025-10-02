-- =====================================================
-- FEATURED CARDS LIMITED QUANTITY SYSTEM
-- =====================================================
-- This script explains and demonstrates how the limited quantity system works
-- for featured cards in the Cardify platform.

-- =====================================================
-- 1. SERIES TABLE - Controls the limited quantity
-- =====================================================

-- The series table tracks the total supply and remaining supply
-- Example: A series with 100 cards total, 50 remaining
SELECT 
    id,
    title,
    total_supply,      -- Total number of cards in the series (e.g., 100)
    remaining_supply,  -- How many cards can still be sold (e.g., 50)
    status,            -- 'active', 'sold_out', 'draft', 'cancelled'
    price_cents        -- Fixed $9.00 (900 cents) for featured cards
FROM public.series 
WHERE featured = true;

-- =====================================================
-- 2. CARDS LINKED TO SERIES
-- =====================================================

-- Each card is linked to a series via series_id
-- Cards are marked as featured = true
SELECT 
    gi.id as card_id,
    gi.title as card_title,
    gi.series_id,
    gi.featured,
    s.title as series_title,
    s.remaining_supply,
    s.status as series_status
FROM public.generated_images gi
JOIN public.series s ON gi.series_id = s.id
WHERE gi.featured = true
UNION ALL
SELECT 
    ui.id as card_id,
    ui.title as card_title,
    ui.series_id,
    ui.featured,
    s.title as series_title,
    s.remaining_supply,
    s.status as series_status
FROM public.uploaded_images ui
JOIN public.series s ON ui.series_id = s.id
WHERE ui.featured = true;

-- =====================================================
-- 3. MARKETPLACE LISTINGS
-- =====================================================

-- Marketplace listings are created for each card
-- They inherit the featured status and series constraints
SELECT 
    ml.id as listing_id,
    ml.title,
    ml.price_cents,
    ml.status as listing_status,
    ml.featured,
    s.title as series_title,
    s.remaining_supply,
    s.status as series_status
FROM public.marketplace_listings ml
JOIN public.user_assets ua ON ml.asset_id = ua.id
LEFT JOIN public.generated_images gi ON ua.source_id = gi.id AND ua.asset_type = 'generated'
LEFT JOIN public.uploaded_images ui ON ua.source_id = ui.id AND ua.asset_type = 'uploaded'
LEFT JOIN public.series s ON COALESCE(gi.series_id, ui.series_id) = s.id
WHERE ml.featured = true;

-- =====================================================
-- 4. AUTOMATIC SUPPLY TRACKING
-- =====================================================

-- When a card is sold, the trigger automatically:
-- 1. Decreases remaining_supply by 1
-- 2. Changes series status to 'sold_out' if remaining_supply reaches 0

-- Example: Check current supply status
SELECT 
    s.title as series_title,
    s.total_supply,
    s.remaining_supply,
    s.status,
    COUNT(ml.id) as active_listings,
    COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) as sold_count
FROM public.series s
LEFT JOIN public.generated_images gi ON s.id = gi.series_id
LEFT JOIN public.uploaded_images ui ON s.id = ui.series_id
LEFT JOIN public.marketplace_listings ml ON ml.asset_id = COALESCE(gi.id, ui.id)
WHERE s.featured = true
GROUP BY s.id, s.title, s.total_supply, s.remaining_supply, s.status;

-- =====================================================
-- 5. PREVENTING NEW LISTINGS WHEN SOLD OUT
-- =====================================================

-- The system prevents new listings when:
-- 1. remaining_supply <= 0
-- 2. series status = 'sold_out'

-- Example: Check which series are sold out
SELECT 
    s.title,
    s.total_supply,
    s.remaining_supply,
    s.status,
    CASE 
        WHEN s.remaining_supply <= 0 OR s.status = 'sold_out' 
        THEN 'CANNOT CREATE NEW LISTINGS'
        ELSE 'CAN CREATE NEW LISTINGS'
    END as listing_status
FROM public.series s
WHERE s.featured = true;

-- =====================================================
-- 6. MANUAL SERIES STATUS UPDATE
-- =====================================================

-- Admins can manually update series status
-- Example: Mark a series as sold out
-- UPDATE public.series 
-- SET status = 'sold_out', 
--     remaining_supply = 0,
--     updated_at = NOW()
-- WHERE id = 'your-series-id';

-- =====================================================
-- 7. SERIES CREATION EXAMPLE
-- =====================================================

-- When creating a new featured series:
-- 1. Create series with total_supply = 100, remaining_supply = 100
-- 2. Link cards to series (series_id)
-- 3. Mark cards as featured = true
-- 4. Auto-create marketplace listings
-- 5. As cards sell, remaining_supply decreases automatically
-- 6. When remaining_supply = 0, status changes to 'sold_out'

-- Example series creation:
/*
INSERT INTO public.series (
    creator_id,
    title,
    description,
    series_type,
    total_supply,
    remaining_supply,
    price_cents,
    featured,
    status
) VALUES (
    'user-id',
    'Limited Edition Dragons',
    'Exclusive dragon-themed cards',
    'physical_only',
    50,  -- Only 50 cards total
    50,  -- All 50 available initially
    900, -- $9.00 each
    true,
    'active'
);
*/

-- =====================================================
-- 8. MONITORING QUERIES
-- =====================================================

-- Monitor series health
SELECT 
    'Total Featured Series' as metric,
    COUNT(*) as value
FROM public.series 
WHERE featured = true
UNION ALL
SELECT 
    'Active Series' as metric,
    COUNT(*) as value
FROM public.series 
WHERE featured = true AND status = 'active'
UNION ALL
SELECT 
    'Sold Out Series' as metric,
    COUNT(*) as value
FROM public.series 
WHERE featured = true AND status = 'sold_out'
UNION ALL
SELECT 
    'Total Featured Cards' as metric,
    COUNT(*) as value
FROM public.user_assets 
WHERE featured = true
UNION ALL
SELECT 
    'Active Featured Listings' as metric,
    COUNT(*) as value
FROM public.marketplace_listings 
WHERE featured = true AND status = 'active';

-- =====================================================
-- 9. BUSINESS LOGIC SUMMARY
-- =====================================================

/*
LIMITED QUANTITY SYSTEM FLOW:

1. CREATE SERIES:
   - Set total_supply (e.g., 100 cards)
   - Set remaining_supply = total_supply
   - Status = 'active'

2. CREATE CARDS:
   - Link cards to series (series_id)
   - Mark cards as featured = true
   - Auto-create marketplace listings

3. SALES TRACKING:
   - When card sells: remaining_supply decreases by 1
   - When remaining_supply = 0: status changes to 'sold_out'

4. PREVENT NEW LISTINGS:
   - Check remaining_supply > 0
   - Check status != 'sold_out'
   - Block new listings if either condition fails

5. USER EXPERIENCE:
   - Users see "Series Sold Out" message
   - Cannot list new cards from sold-out series
   - Existing listings remain active until sold

This ensures that featured series maintain their limited edition status
and cannot exceed their predetermined supply limits.
*/
