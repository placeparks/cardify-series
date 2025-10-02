-- =====================================================
-- LIMITED EDITION SERIES SCHEMA
-- =====================================================
-- Simple approach: One series table + link existing cards to series

-- =====================================================
-- SERIES TABLE - Simple series metadata
-- =====================================================

CREATE TABLE IF NOT EXISTS public.series (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    series_type TEXT NOT NULL CHECK (series_type IN ('physical_only', 'cards_with_nfts', 'nfts_only')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold_out', 'cancelled')),
    
    -- Series limits and inventory
    total_supply INTEGER NOT NULL CHECK (total_supply > 0),
    remaining_supply INTEGER NOT NULL CHECK (remaining_supply >= 0),
    -- Fixed price: $9.00 for all featured cards
    price_cents INTEGER DEFAULT 900, -- $9.00
    currency TEXT DEFAULT 'USD',
    
    -- Series metadata
    cover_image_url TEXT,
    tags TEXT[],
    featured BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    launched_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT series_supply_check CHECK (remaining_supply <= total_supply)
);

-- =====================================================
-- LINK EXISTING CARDS TO SERIES
-- =====================================================

-- Add series_id and featured flag to existing tables
ALTER TABLE public.generated_images 
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

ALTER TABLE public.uploaded_images 
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Add featured flag to marketplace listings
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Add featured flag to user_assets table
ALTER TABLE public.user_assets 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Series indexes
CREATE INDEX IF NOT EXISTS idx_series_creator ON public.series(creator_id);
CREATE INDEX IF NOT EXISTS idx_series_status ON public.series(status);
CREATE INDEX IF NOT EXISTS idx_series_featured ON public.series(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_series_created_at ON public.series(created_at DESC);

-- Series cards indexes
CREATE INDEX IF NOT EXISTS idx_generated_images_series ON public.generated_images(series_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_series ON public.uploaded_images(series_id);

-- Featured marketplace listings
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_featured ON public.marketplace_listings(featured) WHERE featured = TRUE;

-- =====================================================
-- FUNCTIONS FOR FEATURED CARDS MANAGEMENT
-- =====================================================

-- Function to sync featured flag from source tables to user_assets
CREATE OR REPLACE FUNCTION sync_featured_flag()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_assets when generated_images featured flag changes
    IF TG_TABLE_NAME = 'generated_images' THEN
        UPDATE public.user_assets 
        SET featured = NEW.featured
        WHERE asset_type = 'generated' AND source_id = NEW.id;
    END IF;
    
    -- Update user_assets when uploaded_images featured flag changes
    IF TG_TABLE_NAME = 'uploaded_images' THEN
        UPDATE public.user_assets 
        SET featured = NEW.featured
        WHERE asset_type = 'uploaded' AND source_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to sync featured flag
CREATE TRIGGER trigger_sync_generated_featured
    AFTER UPDATE OF featured ON public.generated_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_featured_flag();

CREATE TRIGGER trigger_sync_uploaded_featured
    AFTER UPDATE OF featured ON public.uploaded_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_featured_flag();

-- Function to update series remaining supply when cards are sold
CREATE OR REPLACE FUNCTION update_series_supply()
RETURNS TRIGGER AS $$
BEGIN
    -- Update remaining supply when a purchase is completed
    IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
        -- Update series remaining supply
        UPDATE public.series 
        SET remaining_supply = remaining_supply - 1,
            updated_at = NOW()
        WHERE id = (
            SELECT series_id FROM public.generated_images WHERE id = NEW.asset_id
            UNION
            SELECT series_id FROM public.uploaded_images WHERE id = NEW.asset_id
        );
        
        -- Check if series is sold out
        UPDATE public.series 
        SET status = 'sold_out',
            updated_at = NOW()
        WHERE remaining_supply <= 0 AND status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update series supply
CREATE TRIGGER trigger_update_series_supply
    AFTER UPDATE ON public.marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_series_supply();

-- =====================================================
-- RLS POLICIES FOR SERIES
-- =====================================================

-- Enable RLS on series table
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Series policies
CREATE POLICY "Users can view active series" ON public.series
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own series" ON public.series
    FOR ALL USING (auth.uid() = creator_id);

-- Featured marketplace listings
CREATE POLICY "Users can view featured listings" ON public.marketplace_listings
    FOR SELECT USING (featured = TRUE AND status = 'active');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('series', 'series_cards', 'series_listings', 'series_purchases')
ORDER BY table_name;

-- Verify indexes were created
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('series', 'series_cards', 'series_listings', 'series_purchases')
ORDER BY tablename, indexname;

-- Verify functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_series_supply', 'can_list_series')
ORDER BY routine_name;

-- Verify RLS policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('series', 'series_cards', 'series_listings', 'series_purchases')
ORDER BY tablename, policyname;
