-- NFT-Only Collections Table
-- This table stores NFT collections created through the NFT-only flow
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.nft_collections (
  id BIGSERIAL PRIMARY KEY,
  collection_address VARCHAR(42) NOT NULL UNIQUE,
  owner_address VARCHAR(42) NOT NULL, -- User's wallet address from Privy
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  description TEXT,
  base_uri TEXT NOT NULL, -- IPFS URI for the image
  image_uri TEXT NOT NULL, -- Same as base_uri for ERC1155
  max_supply INTEGER NOT NULL CHECK (max_supply >= 5 AND max_supply <= 1000),
  mint_price BIGINT NOT NULL, -- Price in wei
  royalty_bps INTEGER NOT NULL CHECK (royalty_bps >= 0 AND royalty_bps <= 10000),
  royalty_recipient VARCHAR(42) NOT NULL, -- Same as owner_address
  cid VARCHAR(255), -- IPFS Content ID
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nft_collections_owner ON public.nft_collections(owner_address);
CREATE INDEX IF NOT EXISTS idx_nft_collections_user ON public.nft_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_collections_address ON public.nft_collections(collection_address);
CREATE INDEX IF NOT EXISTS idx_nft_collections_active ON public.nft_collections(active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nft_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_nft_collections_updated_at ON public.nft_collections;
CREATE TRIGGER update_nft_collections_updated_at
  BEFORE UPDATE ON public.nft_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_nft_collections_updated_at();

-- Enable RLS
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY nft_collections_read ON public.nft_collections
  FOR SELECT USING (true);

CREATE POLICY nft_collections_write ON public.nft_collections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.nft_collections TO authenticated;
GRANT ALL ON public.nft_collections TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.nft_collections IS 'NFT-only collections created through the series flow';
COMMENT ON COLUMN public.nft_collections.owner_address IS 'User wallet address from Privy';
COMMENT ON COLUMN public.nft_collections.user_id IS 'Supabase user ID';
COMMENT ON COLUMN public.nft_collections.max_supply IS 'Maximum number of NFTs (5-1000)';
COMMENT ON COLUMN public.nft_collections.mint_price IS 'Price per NFT in wei';
COMMENT ON COLUMN public.nft_collections.royalty_bps IS 'Royalty in basis points (0-10000)';
