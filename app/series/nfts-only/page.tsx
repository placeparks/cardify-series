"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/navigation'
import { Sparkles, Upload, ArrowRight, Zap, Package } from 'lucide-react'
import Link from 'next/link'

export default function NFTsOnlyPage() {
  const [selectedOption, setSelectedOption] = useState<'ai' | 'upload' | null>(null)

  return (
    <div className="min-h-screen bg-cyber-black relative overflow-hidden font-mono">
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />
      <div className="fixed inset-0 scanlines opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-cyber-pink/20 via-cyber-cyan/10 to-cyber-green/20 pointer-events-none" />

      <Navigation />

      <div className="px-6 py-8 pt-24 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wider mb-4">
              NFTs Only
            </h1>
            <p className="text-gray-400 text-lg">
              Create a digital-only NFT series with redemption codes
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Zap className="w-5 h-5 text-cyber-pink" />
              <span className="text-cyber-pink font-mono text-sm">Digital Series</span>
            </div>
          </div>

          {/* Upload Option Only */}
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="bg-cyber-dark/60 border-cyber-cyan/30 hover:border-cyber-cyan/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Upload className="w-6 h-6 text-cyber-pink" />
                  Upload Your Artwork
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Upload your own artwork to create your NFT collection
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                      <span>Upload custom artwork</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                      <span>ERC1155 smart contract deployment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                      <span>Full ownership and control</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                      <span>Automatic royalty setup</span>
                    </div>
                  </div>
                  
                  <Button 
                    asChild
                    className="w-full cyber-button"
                  >
                    <Link href="/series/nft-collection">
                      Start Creating NFT Collection
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NFT Info */}
          <Card className="bg-cyber-dark/60 border-cyber-cyan/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-cyber-pink" />
                Digital NFT Series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-cyber-cyan font-semibold">Smart Contract</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-cyan mt-1">•</span>
                        <span>ERC1155 standard compliance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-cyan mt-1">•</span>
                        <span>Deployed on Base blockchain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-cyan mt-1">•</span>
                        <span>Gas-efficient batch operations</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-cyber-pink font-semibold">Redemption System</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-pink mt-1">•</span>
                        <span>Unique redemption codes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-pink mt-1">•</span>
                        <span>One-time use validation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-pink mt-1">•</span>
                        <span>Automatic code generation</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-cyber-green font-semibold mb-2">Revenue Features</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-green mt-1">•</span>
                      <span>Configurable royalty system (default 2.5%)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-green mt-1">•</span>
                      <span>Automatic royalty distribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-green mt-1">•</span>
                      <span>Full ownership and control</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
