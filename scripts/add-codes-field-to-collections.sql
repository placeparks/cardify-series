-- Add codes field to collections table to maintain compatibility
-- Run this in your Supabase SQL editor

-- Add codes field to collections table
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS codes JSONB DEFAULT '[]'::jsonb;

-- Add hashes field to collections table  
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS hashes JSONB DEFAULT '[]'::jsonb;

-- Add total_nfts field to collections table
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS total_nfts INTEGER DEFAULT 0;

-- Add processed_at field to collections table
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Create function to sync codes from collection_codes to collections
CREATE OR REPLACE FUNCTION sync_codes_to_collections()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the collections table with codes from collection_codes
  UPDATE public.collections 
  SET 
    codes = (
      SELECT jsonb_agg(code ORDER BY created_at)
      FROM public.collection_codes 
      WHERE collection_address = NEW.collection_address
    ),
    hashes = (
      SELECT jsonb_agg(hash ORDER BY created_at)
      FROM public.collection_codes 
      WHERE collection_address = NEW.collection_address
    ),
    total_nfts = (
      SELECT COUNT(*)
      FROM public.collection_codes 
      WHERE collection_address = NEW.collection_address
    )
  WHERE address = NEW.collection_address;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to sync codes when collection_codes changes
DROP TRIGGER IF EXISTS sync_codes_trigger ON public.collection_codes;
CREATE TRIGGER sync_codes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.collection_codes
  FOR EACH ROW
  EXECUTE FUNCTION sync_codes_to_collections();

-- Sync existing data
UPDATE public.collections 
SET 
  codes = (
    SELECT jsonb_agg(code ORDER BY created_at)
    FROM public.collection_codes 
    WHERE collection_address = collections.address
  ),
  hashes = (
    SELECT jsonb_agg(hash ORDER BY created_at)
    FROM public.collection_codes 
    WHERE collection_address = collections.address
  ),
  total_nfts = (
    SELECT COUNT(*)
    FROM public.collection_codes 
    WHERE collection_address = collections.address
  )
WHERE EXISTS (
  SELECT 1 FROM public.collection_codes 
  WHERE collection_address = collections.address
);

-- Add comments for documentation
COMMENT ON COLUMN public.collections.codes IS 'JSON array of codes for this collection (synced from collection_codes)';
COMMENT ON COLUMN public.collections.hashes IS 'JSON array of hashes for this collection (synced from collection_codes)';
COMMENT ON COLUMN public.collections.total_nfts IS 'Total number of NFTs/codes for this collection';
COMMENT ON COLUMN public.collections.processed_at IS 'When the collection was processed/synced';
