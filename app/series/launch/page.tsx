"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/navigation'
import { CreditCard, Package, Zap, ArrowRight, Layers } from 'lucide-react'
import Link from 'next/link'

export default function LaunchSeriesPage() {
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
              Launch Series
            </h1>
            <p className="text-gray-400 text-lg">
              Choose your series type to get started
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Layers className="w-5 h-5 text-cyber-cyan" />
              <span className="text-cyber-cyan font-mono text-sm">Series Creation</span>
            </div>
          </div>

          {/* Series Options */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Physical Cards Only */}
            <Card className="bg-cyber-dark/60 border-cyber-green/30 hover:border-cyber-green/50 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-cyber-green" />
                  Physical Cards Only
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Create traditional trading cards without NFTs
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-green rounded-full"></span>
                    <span>High-quality printed cards</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-green rounded-full"></span>
                    <span>Professional card design</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-green rounded-full"></span>
                    <span>Durable card stock</span>
                  </div>
                </div>
                
                <Button 
                  asChild
                  className="w-full cyber-button"
                >
                  <Link href="/series/create">
                    Create Featured Series
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Cards + Redeemable NFTs */}
            <Card className="bg-cyber-dark/60 border-cyber-yellow/30 hover:border-cyber-yellow/50 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Package className="w-6 h-6 text-cyber-yellow" />
                  Cards + Redeemable NFTs
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Physical cards with digital NFT redemption
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-yellow rounded-full"></span>
                    <span>Physical + Digital</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-yellow rounded-full"></span>
                    <span>ERC1155 smart contract</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-yellow rounded-full"></span>
                    <span>Redemption codes</span>
                  </div>
                </div>
                
                <Button 
                  asChild
                  className="w-full cyber-button"
                >
                  <Link href="/series/cards-with-nfts">
                    Choose Method
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* NFTs Only */}
            <Card className="bg-cyber-dark/60 border-cyber-pink/30 hover:border-cyber-pink/50 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Zap className="w-6 h-6 text-cyber-pink" />
                  NFTs Only
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Digital-only NFT series with redemption
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                    <span>Digital collection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                    <span>Smart contract deployment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-2 h-2 bg-cyber-pink rounded-full"></span>
                    <span>Redemption system</span>
                  </div>
                </div>
                
                <Button 
                  asChild
                  className="w-full cyber-button"
                >
                  <Link href="/series/nfts-only">
                    Choose Method
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <Card className="mt-8 bg-cyber-dark/60 border-cyber-cyan/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyber-cyan" />
                Series Creation Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-cyber-green font-semibold">1. Choose Type</h4>
                  <p className="text-sm text-gray-300">
                    Select physical cards, NFTs, or both based on your needs
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-cyber-cyan font-semibold">2. Create Content</h4>
                  <p className="text-sm text-gray-300">
                    Use AI generation or upload your own artwork
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-cyber-pink font-semibold">3. Deploy & Launch</h4>
                  <p className="text-sm text-gray-300">
                    Deploy smart contracts and launch your series
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
