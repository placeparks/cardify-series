-- =====================================================
-- FIX USER_ASSETS SYNC FOR FEATURED FLAG
-- =====================================================
-- This script fixes the user_assets table to properly sync featured flags

-- 1. First, let's update the existing function to handle both INSERT and UPDATE
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

-- 2. Drop existing triggers
DROP TRIGGER IF EXISTS trigger_sync_generated_featured ON public.generated_images;
DROP TRIGGER IF EXISTS trigger_sync_uploaded_featured ON public.uploaded_images;

-- 3. Create new triggers for both INSERT and UPDATE
CREATE TRIGGER trigger_sync_generated_featured
    AFTER INSERT OR UPDATE OF featured ON public.generated_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_featured_flag();

CREATE TRIGGER trigger_sync_uploaded_featured
    AFTER INSERT OR UPDATE OF featured ON public.uploaded_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_featured_flag();

-- 4. Also sync series_id when it changes
CREATE OR REPLACE FUNCTION sync_series_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_assets when generated_images series_id changes
    IF TG_TABLE_NAME = 'generated_images' THEN
        UPDATE public.user_assets 
        SET series_id = NEW.series_id
        WHERE asset_type = 'generated' AND source_id = NEW.id;
    END IF;
    
    -- Update user_assets when uploaded_images series_id changes
    IF TG_TABLE_NAME = 'uploaded_images' THEN
        UPDATE public.user_assets 
        SET series_id = NEW.series_id
        WHERE asset_type = 'uploaded' AND source_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for series_id sync
CREATE TRIGGER trigger_sync_generated_series_id
    AFTER INSERT OR UPDATE OF series_id ON public.generated_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_series_id();

CREATE TRIGGER trigger_sync_uploaded_series_id
    AFTER INSERT OR UPDATE OF series_id ON public.uploaded_images
    FOR EACH ROW
    EXECUTE FUNCTION sync_series_id();

-- 5. Add series_id column to user_assets if it doesn't exist
ALTER TABLE public.user_assets 
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;

-- 6. Fix existing data - sync all featured flags
UPDATE public.user_assets ua
SET featured = gi.featured
FROM public.generated_images gi
WHERE ua.source_id = gi.id 
AND ua.asset_type = 'generated'
AND ua.featured != gi.featured;

UPDATE public.user_assets ua
SET featured = ui.featured
FROM public.uploaded_images ui
WHERE ua.source_id = ui.id 
AND ua.asset_type = 'uploaded'
AND ua.featured != ui.featured;

-- 7. Fix existing data - sync all series_id
UPDATE public.user_assets ua
SET series_id = gi.series_id
FROM public.generated_images gi
WHERE ua.source_id = gi.id 
AND ua.asset_type = 'generated'
AND (ua.series_id IS NULL OR ua.series_id != gi.series_id);

UPDATE public.user_assets ua
SET series_id = ui.series_id
FROM public.uploaded_images ui
WHERE ua.source_id = ui.id 
AND ua.asset_type = 'uploaded'
AND (ua.series_id IS NULL OR ua.series_id != ui.series_id);

-- 7. Verify the sync worked
SELECT 
    'Generated Images' as source,
    COUNT(*) as total_cards,
    COUNT(CASE WHEN featured = true THEN 1 END) as featured_cards,
    COUNT(CASE WHEN series_id IS NOT NULL THEN 1 END) as series_cards
FROM public.generated_images
UNION ALL
SELECT 
    'User Assets (Generated)' as source,
    COUNT(*) as total_cards,
    COUNT(CASE WHEN featured = true THEN 1 END) as featured_cards,
    COUNT(CASE WHEN series_id IS NOT NULL THEN 1 END) as series_cards
FROM public.user_assets
WHERE asset_type = 'generated'
UNION ALL
SELECT 
    'Uploaded Images' as source,
    COUNT(*) as total_cards,
    COUNT(CASE WHEN featured = true THEN 1 END) as featured_cards,
    COUNT(CASE WHEN series_id IS NOT NULL THEN 1 END) as series_cards
FROM public.uploaded_images
UNION ALL
SELECT 
    'User Assets (Uploaded)' as source,
    COUNT(*) as total_cards,
    COUNT(CASE WHEN featured = true THEN 1 END) as featured_cards,
    COUNT(CASE WHEN series_id IS NOT NULL THEN 1 END) as series_cards
FROM public.user_assets
WHERE asset_type = 'uploaded';
