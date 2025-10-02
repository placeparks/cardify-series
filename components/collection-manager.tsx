"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { collectionAPI } from '@/lib/collection-api'
import { useToast } from '@/hooks/use-toast'

interface Collection {
  address: string
  name: string
  symbol: string
  max_supply: number
  description?: string
  image_uri?: string
  created_at: string
}

interface CollectionCode {
  id: number
  collection_address: string
  code: string
  hash: string
  used: boolean
  used_by?: string
  used_at?: string
  created_at: string
}

interface CollectionManagerProps {
  userId: string
}

export function CollectionManager({ userId }: CollectionManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [codes, setCodes] = useState<CollectionCode[]>([])
  const [loading, setLoading] = useState(false)
  const [codesLoading, setCodesLoading] = useState(false)
  const [showUsedCodes, setShowUsedCodes] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { toast } = useToast()

  // Load user's collections
  const loadCollections = async () => {
    setLoading(true)
    try {
      const collections = await collectionAPI.getUserCollections(userId)
      setCollections(collections)
    } catch (error) {
      console.error('Error loading collections:', error)
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load codes for selected collection
  const loadCodes = async (collectionAddress: string) => {
    setCodesLoading(true)
    try {
      const codes = await collectionAPI.getCollectionCodes(collectionAddress)
      setCodes(codes)
    } catch (error) {
      console.error('Error loading codes:', error)
      toast({
        title: "Error",
        description: "Failed to load codes",
        variant: "destructive"
      })
    } finally {
      setCodesLoading(false)
    }
  }

  // Copy code to clipboard
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
      toast({
        title: "Copied",
        description: "Code copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive"
      })
    }
  }

  // Filter codes based on used status
  const filteredCodes = codes.filter(code => showUsedCodes ? code.used : !code.used)

  useEffect(() => {
    loadCollections()
  }, [userId])

  useEffect(() => {
    if (selectedCollection) {
      loadCodes(selectedCollection.address)
    }
  }, [selectedCollection])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-wider">
          My NFT Collections
        </h2>
        <Button
          onClick={loadCollections}
          disabled={loading}
          variant="outline"
          className="border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan" />
        </div>
      ) : collections.length === 0 ? (
        <Card className="bg-cyber-dark/60 border-cyber-cyan/30">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">No collections found</p>
            <p className="text-sm text-gray-500 mt-2">
              Create your first NFT collection by uploading or generating a card with NFT enabled
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map((collection) => (
            <Card 
              key={collection.address}
              className={`cursor-pointer transition-all duration-300 ${
                selectedCollection?.address === collection.address
                  ? 'bg-gradient-to-r from-cyber-dark/80 to-purple-900/20 border-cyber-cyan/50 shadow-lg shadow-cyber-cyan/10'
                  : 'bg-cyber-dark/60 border-cyber-cyan/30 hover:border-cyber-cyan/50'
              }`}
              onClick={() => setSelectedCollection(collection)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg">
                      {collection.name}
                    </CardTitle>
                    <p className="text-gray-400 text-sm">
                      {collection.symbol} • Max Supply: {collection.max_supply}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50">
                      {collection.address.slice(0, 6)}...{collection.address.slice(-4)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`https://etherscan.io/address/${collection.address}`, '_blank')
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Collection Details and Codes */}
      {selectedCollection && (
        <Card className="bg-cyber-dark/60 border-cyber-cyan/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Collection Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCollection(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Collection Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 text-sm">Name</Label>
                <p className="text-white font-medium">{selectedCollection.name}</p>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Symbol</Label>
                <p className="text-white font-medium">{selectedCollection.symbol}</p>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Max Supply</Label>
                <p className="text-white font-medium">{selectedCollection.max_supply}</p>
              </div>
              <div>
                <Label className="text-gray-400 text-sm">Created</Label>
                <p className="text-white font-medium">
                  {new Date(selectedCollection.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Codes Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Redemption Codes</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUsedCodes(!showUsedCodes)}
                    className="border-gray-600 text-gray-400 hover:bg-gray-800"
                  >
                    {showUsedCodes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showUsedCodes ? 'Hide Used' : 'Show Used'}
                  </Button>
                </div>
              </div>

              {codesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyber-cyan" />
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {filteredCodes.map((code) => (
                    <div
                      key={code.id}
                      className={`p-3 rounded border text-center font-mono text-sm cursor-pointer transition-all duration-200 ${
                        code.used
                          ? 'bg-red-900/20 border-red-500/50 text-red-400'
                          : 'bg-cyber-dark/50 border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10'
                      }`}
                      onClick={() => !code.used && copyCode(code.code)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{code.code}</span>
                        {code.used ? (
                          <XCircle className="w-3 h-3 ml-1 flex-shrink-0" />
                        ) : copiedCode === code.code ? (
                          <CheckCircle className="w-3 h-3 ml-1 flex-shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 ml-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredCodes.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  {showUsedCodes ? 'No used codes found' : 'No unused codes found'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
