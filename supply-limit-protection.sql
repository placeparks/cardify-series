-- =====================================================
-- SUPPLY LIMIT PROTECTION SYSTEM
-- =====================================================
-- This script implements comprehensive supply limit protection

-- 1. Create function to check if series has remaining supply
CREATE OR REPLACE FUNCTION check_series_supply(asset_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    series_id_found UUID;
    remaining_supply_count INTEGER;
BEGIN
    -- Get series_id for the asset
    SELECT series_id INTO series_id_found
    FROM (
        SELECT series_id FROM generated_images WHERE id = asset_id_param
        UNION ALL
        SELECT series_id FROM uploaded_images WHERE id = asset_id_param
    ) AS asset_series
    WHERE series_id IS NOT NULL
    LIMIT 1;
    
    -- If no series found, allow purchase (not a featured card)
    IF series_id_found IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check remaining supply
    SELECT remaining_supply INTO remaining_supply_count
    FROM series
    WHERE id = series_id_found;
    
    -- Allow purchase if supply > 0
    RETURN remaining_supply_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 2. Create function to prevent overselling at purchase time
CREATE OR REPLACE FUNCTION prevent_overselling()
RETURNS TRIGGER AS $$
DECLARE
    series_id_found UUID;
    remaining_supply_count INTEGER;
BEGIN
    -- Only check for featured cards (those with series_id)
    IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
        -- Get series_id for the asset
        SELECT series_id INTO series_id_found
        FROM (
            SELECT series_id FROM generated_images WHERE id = NEW.asset_id
            UNION ALL
            SELECT series_id FROM uploaded_images WHERE id = NEW.asset_id
        ) AS asset_series
        WHERE series_id IS NOT NULL
        LIMIT 1;
        
        -- If series found, check supply
        IF series_id_found IS NOT NULL THEN
            SELECT remaining_supply INTO remaining_supply_count
            FROM series
            WHERE id = series_id_found;
            
            -- Prevent sale if no supply left
            IF remaining_supply_count <= 0 THEN
                RAISE EXCEPTION 'Series is sold out. Cannot complete purchase.';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to prevent overselling
DROP TRIGGER IF EXISTS trigger_prevent_overselling ON marketplace_listings;
CREATE TRIGGER trigger_prevent_overselling
    BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION prevent_overselling();

-- 4. Create function to update series supply after successful purchase
CREATE OR REPLACE FUNCTION update_series_supply_after_purchase()
RETURNS TRIGGER AS $$
DECLARE
    series_id_found UUID;
BEGIN
    -- Only process featured cards
    IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
        -- Get series_id for the asset
        SELECT series_id INTO series_id_found
        FROM (
            SELECT series_id FROM generated_images WHERE id = NEW.asset_id
            UNION ALL
            SELECT series_id FROM uploaded_images WHERE id = NEW.asset_id
        ) AS asset_series
        WHERE series_id IS NOT NULL
        LIMIT 1;
        
        -- If series found, update supply
        IF series_id_found IS NOT NULL THEN
            -- Decrease remaining supply
            UPDATE series 
            SET 
                remaining_supply = remaining_supply - 1,
                updated_at = NOW()
            WHERE id = series_id_found;
            
            -- Check if series is now sold out
            UPDATE series 
            SET 
                status = 'sold_out',
                updated_at = NOW()
            WHERE id = series_id_found 
            AND remaining_supply <= 0 
            AND status = 'active';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to update supply after purchase
DROP TRIGGER IF EXISTS trigger_update_supply_after_purchase ON marketplace_listings;
CREATE TRIGGER trigger_update_supply_after_purchase
    AFTER UPDATE ON marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_series_supply_after_purchase();

-- 6. Create function to prevent new listings when series is sold out
CREATE OR REPLACE FUNCTION prevent_sold_out_listings()
RETURNS TRIGGER AS $$
DECLARE
    series_id_found UUID;
    series_status TEXT;
    remaining_supply_count INTEGER;
BEGIN
    -- Only check for featured cards
    SELECT series_id INTO series_id_found
    FROM (
        SELECT series_id FROM generated_images WHERE id = NEW.asset_id
        UNION ALL
        SELECT series_id FROM uploaded_images WHERE id = NEW.asset_id
    ) AS asset_series
    WHERE series_id IS NOT NULL
    LIMIT 1;
    
    -- If series found, check if it's sold out
    IF series_id_found IS NOT NULL THEN
        SELECT status, remaining_supply 
        INTO series_status, remaining_supply_count
        FROM series
        WHERE id = series_id_found;
        
        -- Prevent listing if series is sold out
        IF series_status = 'sold_out' OR remaining_supply_count <= 0 THEN
            RAISE EXCEPTION 'Cannot create listing for sold-out series.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to prevent sold-out listings
DROP TRIGGER IF EXISTS trigger_prevent_sold_out_listings ON marketplace_listings;
CREATE TRIGGER trigger_prevent_sold_out_listings
    BEFORE INSERT ON marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION prevent_sold_out_listings();

-- 8. Test the protection system
-- This query shows which series are at risk of overselling
SELECT 
    s.title as series_title,
    s.total_supply,
    s.remaining_supply,
    s.status,
    COUNT(ml.id) as active_listings,
    COUNT(CASE WHEN ml.status = 'sold' THEN 1 END) as sold_count,
    CASE 
        WHEN s.remaining_supply <= 0 THEN 'SOLD OUT'
        WHEN s.remaining_supply <= 5 THEN 'LOW STOCK'
        ELSE 'IN STOCK'
    END as stock_status
FROM series s
LEFT JOIN generated_images gi ON s.id = gi.series_id
LEFT JOIN uploaded_images ui ON s.id = ui.series_id
LEFT JOIN marketplace_listings ml ON ml.asset_id = COALESCE(gi.id, ui.id)
WHERE s.featured = true
GROUP BY s.id, s.title, s.total_supply, s.remaining_supply, s.status
ORDER BY s.remaining_supply ASC;
