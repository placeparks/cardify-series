"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Sparkles, Coins, Zap, Info } from 'lucide-react'
import { formatCreditsWithDollars } from '@/lib/utils'

interface NFTGenerationOptionProps {
  onNFTToggle: (enabled: boolean) => void
  isEnabled: boolean
  userCredits: number
  baseCost: number
  nftCost: number
  disabled?: boolean
}

export function NFTGenerationOption({ 
  onNFTToggle, 
  isEnabled, 
  userCredits, 
  baseCost, 
  nftCost,
  disabled = false 
}: NFTGenerationOptionProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const totalCost = baseCost + (isEnabled ? nftCost : 0)
  const hasEnoughCredits = userCredits >= totalCost

  return (
    <Card className={`transition-all duration-300 ${
      isEnabled 
        ? 'bg-gradient-to-r from-cyber-dark/80 to-purple-900/20 border-cyber-cyan/50 shadow-lg shadow-cyber-cyan/10' 
        : 'bg-gradient-to-r from-cyber-dark/80 to-purple-900/20 border-cyber-cyan/50 shadow-lg shadow-cyber-cyan/10'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 tracking-wider text-lg">
            <Sparkles className="w-5 h-5 text-cyber-cyan" />
            NFT Collection
            {isEnabled && (
              <Badge className="bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50">
                Enabled
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-white"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-gray-400 text-sm">
          Create an ERC1155 NFT collection alongside your card
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="nft-generation"
              checked={isEnabled}
              onCheckedChange={(checked) => onNFTToggle(checked === true)}
              disabled={disabled || !hasEnoughCredits}
              className="border-2 border-cyber-cyan data-[state=checked]:bg-cyber-cyan data-[state=checked]:border-cyber-cyan"
            />
            <label 
              htmlFor="nft-generation" 
              className="text-sm font-medium text-white cursor-pointer"
            >
              Generate NFT Collection
            </label>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-cyber-cyan">
              {formatCreditsWithDollars(totalCost)}
            </div>
            <div className="text-xs text-gray-400">
              {baseCost} + {isEnabled ? nftCost : 0} NFT
            </div>
          </div>
        </div>

        {/* Credit check */}
        {!hasEnoughCredits && (
          <div className="p-3 bg-amber-900/20 border border-amber-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">
                Insufficient Credits
              </span>
            </div>
            <p className="text-xs text-amber-300 mt-1">
              You need {formatCreditsWithDollars(totalCost)} but have {formatCreditsWithDollars(userCredits)}
            </p>
          </div>
        )}

        {/* Details */}
        {showDetails && (
          <div className="space-y-3 p-4 bg-cyber-dark/50 rounded-lg border border-cyber-cyan/20">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyber-cyan" />
              What you get:
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-cyber-cyan mt-0.5">•</span>
                <span>ERC1155 smart contract deployed on blockchain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-cyan mt-0.5">•</span>
                <span>Unique redemption codes for each NFT</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-cyan mt-0.5">•</span>
                <span>Royalty system for ongoing revenue</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyber-cyan mt-0.5">•</span>
                <span>Full ownership and control of collection</span>
              </li>
            </ul>
            
            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                <strong>Note:</strong> NFT generation requires blockchain deployment and may take a few minutes to complete.
              </p>
            </div>
          </div>
        )}

        {/* Action button */}
        {isEnabled && (
          <div className="pt-2">
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
              className="w-full border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
