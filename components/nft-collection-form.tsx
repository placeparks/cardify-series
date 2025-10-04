"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { collectionAPI } from '@/lib/collection-api'

interface NFTCollectionFormProps {
  onCollectionGenerated: (address: string, codes: string[]) => void
  onClose: () => void
  baseImage: string // The generated/uploaded card image
  collectionNumber: number
  cardId?: string | null // Optional: Card ID for linking NFT to physical card supply
}

export function NFTCollectionForm({ 
  onCollectionGenerated, 
  onClose, 
  baseImage,
  collectionNumber,
  cardId
}: NFTCollectionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    maxSupply: '50',
    royaltyRecipient: '',
    royaltyBps: '250'
  })
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    collectionAddress?: string
    codes?: string[]
    error?: string
  } | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate max supply (5-1000)
    const maxSupply = parseInt(formData.maxSupply)
    if (maxSupply < 5 || maxSupply > 1000) {
      setResult({
        success: false,
        error: 'Max supply must be between 5 and 1000'
      })
      return
    }
    
    setLoading(true)
    setResult(null)

    try {
      // First upload image to Pinata using chunked upload
      const imageResponse = await fetch(baseImage);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const imageBlob = await imageResponse.blob();
      const file = new File([imageBlob], 'collection-image.jpg', { type: 'image/jpeg' });
      
      // Generate a unique file ID
      const fileId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Convert file to base64
      const reader = new FileReader();
      const pinataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1]; // Remove data URL prefix
            
            // Split into 2MB chunks (to stay under Vercel's limit)
            const chunkSize = 2 * 1024 * 1024; // 2MB
            const chunks = [];
            for (let i = 0; i < base64Data.length; i += chunkSize) {
              chunks.push(base64Data.slice(i, i + chunkSize));
            }

            // Upload chunks
            for (let i = 0; i < chunks.length; i++) {
              const response = await fetch('/api/upload-chunk', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chunk: chunks[i],
                  chunkIndex: i,
                  totalChunks: chunks.length,
                  fileId
                })
              });

              if (!response.ok) {
                throw new Error('Chunk upload failed');
              }

              const result = await response.json();
              
              // If this was the last chunk and upload is complete
              if (result.pinataUrl) {
                resolve(result.pinataUrl);
                return;
              }
            }
          } catch (error) {
            console.error('Chunked upload failed:', error);
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Then generate collection with Pinata URL
      const response = await collectionAPI.generateCollection({
        collectionNumber,
        name: formData.name,
        symbol: formData.symbol,
        image: pinataUrl,
        description: formData.description,
        maxSupply: parseInt(formData.maxSupply),
        royaltyRecipient: formData.royaltyRecipient || undefined,
        royaltyBps: parseInt(formData.royaltyBps)
      })

      setResult(response)
      
      if (response.success && response.collectionAddress && response.codes) {
        // Link card to NFT collection series (if cardId provided)
        if (cardId) {
          try {
            console.log('🔗 Linking card to NFT collection...', { 
              cardId, 
              collectionAddress: response.collectionAddress 
            })
            
            const { getSupabaseBrowserClient } = await import('@/lib/supabase-browser')
            const supabase = getSupabaseBrowserClient()
            
            // Step 1: Link card to series
            const { data: linkData, error: linkError } = await supabase.rpc('link_collection_and_card', {
              p_collection_address: response.collectionAddress,
              p_card_id: cardId
            })
            
            if (linkError) {
              console.error('❌ Failed to link card to NFT series:', linkError)
            } else {
              console.log('✅ Card linked to NFT series:', linkData)
              
              // Step 2: Auto-list the card in marketplace
              const { data: assetData } = await supabase
                .from('user_assets')
                .select('title, series_id')
                .eq('id', cardId)
                .single()
              
              if (assetData?.series_id) {
                const response = await fetch('/api/series/auto-list', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    asset_id: cardId,
                    series_id: assetData.series_id,
                    title: assetData.title || 'NFT-Backed Card',
                    description: 'Limited edition NFT-backed physical card',
                    price_cents: 900 // $9.00
                  })
                })
                
                if (!response.ok) {
                  console.error('❌ Failed to auto-list card:', await response.text())
                } else {
                  console.log('✅ Card auto-listed in marketplace')
                }
              }
            }
          } catch (error) {
            console.error('❌ Error linking/listing card:', error)
          }
        } else {
          console.log('ℹ️ No cardId provided - skipping series linking')
        }
        
        onCollectionGenerated(response.collectionAddress, response.codes)
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (result?.success) {
    return (
      <Card className="bg-gradient-to-r from-green-900/20 to-cyber-dark/80 border-green-500/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Collection Generated Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Collection Address:</span>
              <Badge className="bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50">
                {result.collectionAddress?.slice(0, 6)}...{result.collectionAddress?.slice(-4)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Codes Generated:</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                {result.codes?.length} codes
              </Badge>
            </div>
          </div>

          {result.codes && result.codes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Sample Codes:</Label>
              <div className="grid grid-cols-5 gap-2">
                {result.codes.slice(0, 10).map((code, index) => (
                  <div key={index} className="bg-cyber-dark/50 p-2 rounded text-xs font-mono text-center border border-cyber-cyan/30">
                    {code}
                  </div>
                ))}
                {result.codes.length > 10 && (
                  <div className="col-span-5 text-xs text-gray-400 text-center">
                    ...and {result.codes.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => {
                onCollectionGenerated(result.collectionAddress!, result.codes!)
                onClose()
              }}
              className="flex-1 cyber-button"
            >
              Continue
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://etherscan.io/address/${result.collectionAddress}`, '_blank')}
              className="border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-cyber-dark/80 to-purple-900/20 border-cyber-cyan/50 shadow-lg shadow-cyber-cyan/10">
      <CardHeader>
        <CardTitle className="text-white tracking-wider">
          NFT Collection Details
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Configure your ERC1155 collection settings
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-white">Collection Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="My Awesome Collection"
                required
                className="bg-cyber-dark/50 border-cyber-cyan/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="symbol" className="text-white">Symbol</Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="MAC"
                required
                className="bg-cyber-dark/50 border-cyber-cyan/30 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your collection..."
              rows={3}
              className="bg-cyber-dark/50 border-cyber-cyan/30 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxSupply" className="text-white">Max Supply</Label>
              <Input
                id="maxSupply"
                name="maxSupply"
                type="number"
                value={formData.maxSupply}
                onChange={handleInputChange}
                min="5"
                max="1000"
                required
                className="bg-cyber-dark/50 border-cyber-cyan/30 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Must be between 5 and 1000
              </p>
            </div>
            <div>
              <Label htmlFor="royaltyBps" className="text-white">Royalty (%)</Label>
              <Input
                id="royaltyBps"
                name="royaltyBps"
                type="number"
                value={formData.royaltyBps}
                onChange={handleInputChange}
                min="0"
                max="1000"
                step="10"
                className="bg-cyber-dark/50 border-cyber-cyan/30 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="royaltyRecipient" className="text-white">Royalty Recipient (optional)</Label>
            <Input
              id="royaltyRecipient"
              name="royaltyRecipient"
              value={formData.royaltyRecipient}
              onChange={handleInputChange}
              placeholder="0x..."
              className="bg-cyber-dark/50 border-cyber-cyan/30 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to use your wallet address
            </p>
          </div>

          {result && !result.success && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm text-red-300 mt-1">{result.error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 cyber-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Collection...
                </>
              ) : (
                'Generate Collection'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
