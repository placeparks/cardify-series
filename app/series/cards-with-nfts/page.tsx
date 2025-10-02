"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/navigation'
import { Sparkles, Upload, ArrowRight, Layers, Package } from 'lucide-react'
import Link from 'next/link'

export default function CardsWithNFTsPage() {
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
              Cards + Redeemable NFTs
            </h1>
            <p className="text-gray-400 text-lg">
              Create a series with both physical cards and digital NFTs
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Package className="w-5 h-5 text-cyber-cyan" />
              <span className="text-cyber-cyan font-mono text-sm">Series Creation</span>
            </div>
          </div>

          {/* Choose Creation Method */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* AI Generation Option */}
            <Card 
              className={`transition-all duration-300 cursor-pointer ${
                selectedOption === 'ai' 
                  ? 'bg-gradient-to-r from-cyber-dark/80 to-purple-900/20 border-cyber-cyan/50 shadow-lg shadow-cyber-cyan/10' 
                  : 'bg-cyber-dark/60 border-cyber-cyan/30 hover:border-cyber-cyan/50'
              }`}
              onClick={() => setSelectedOption('ai')}
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-cyber-cyan" />
                  AI Generate
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Use AI to create unique card designs for your series
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-cyan rounded-full"></span>
                    <span>AI-powered card generation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-cyan rounded-full"></span>
                    <span>Automatic NFT collection creation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-cyan rounded-full"></span>
                    <span>Redemption codes for each NFT</span>
                  </div>
                </div>
                
                {selectedOption === 'ai' && (
                  <div className="mt-4 pt-4 border-t border-cyber-cyan/30">
                    <Button 
                      asChild
                      className="w-full cyber-button"
                    >
                      <Link href="/series/generate">
                        Start AI Generation
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Option */}
            <Card 
              className={`transition-all duration-300 cursor-pointer ${
                selectedOption === 'upload' 
                  ? 'bg-gradient-to-r from-cyber-dark/80 to-purple-900/20 border-cyber-cyan/50 shadow-lg shadow-cyber-cyan/10' 
                  : 'bg-cyber-dark/60 border-cyber-cyan/30 hover:border-cyber-cyan/50'
              }`}
              onClick={() => setSelectedOption('upload')}
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Upload className="w-6 h-6 text-cyber-pink" />
                  Upload Image
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Upload your own artwork to create the series
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                    <span>Upload custom artwork</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                    <span>Automatic NFT collection creation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                    <span>Redemption codes for each NFT</span>
                  </div>
                </div>
                
                {selectedOption === 'upload' && (
                  <div className="mt-4 pt-4 border-t border-cyber-cyan/30">
                    <Button 
                      asChild
                      className="w-full cyber-button"
                    >
                      <Link href="/series/upload">
                        Start Upload
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Series Info */}
          <Card className="bg-cyber-dark/60 border-cyber-cyan/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyber-cyan" />
              What You Get
            </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-cyber-green font-semibold">Physical Cards</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-green mt-1">•</span>
                      <span>High-quality printed trading cards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-green mt-1">•</span>
                      <span>Professional card design and layout</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-green mt-1">•</span>
                      <span>Durable card stock and finish</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-cyber-cyan font-semibold">Digital NFTs</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-cyan mt-1">•</span>
                      <span>ERC1155 smart contract deployment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-cyan mt-1">•</span>
                      <span>Unique redemption codes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyber-cyan mt-1">•</span>
                      <span>Royalty system for ongoing revenue</span>
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
