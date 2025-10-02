'use client'

import { SocialLogin } from '@/components/social-login'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Wallet, Shield } from 'lucide-react'

export default function TestNFTSocialLoginPage() {
  const { authenticated, ready } = usePrivy()
  const { wallets } = useWallets()
  const { address: externalWallet, isConnected } = useAccount()
  
  const embeddedWallet = wallets?.[0]
  const embeddedWalletAddress = embeddedWallet?.address
  const finalWalletAddress = embeddedWalletAddress || externalWallet

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            NFT Collection Social Login Test
          </h1>
          <p className="text-xl text-gray-300">
            Test the social login integration for NFT collection creation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Social Login Component */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Step 1: Sign In & Get Your Wallet</CardTitle>
              <CardDescription className="text-gray-300">
                Sign in with your preferred method to get an automatic wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialLogin />
            </CardContent>
          </Card>

          {/* Wallet Status */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Wallet Status</CardTitle>
              <CardDescription className="text-gray-300">
                Current wallet connection status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Authentication Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Authentication:</span>
                <Badge className={authenticated ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50"}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {authenticated ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              </div>

              {/* Embedded Wallet Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Embedded Wallet:</span>
                <Badge className={embeddedWalletAddress ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {embeddedWalletAddress ? 'Ready' : 'Not Created'}
                </Badge>
              </div>

              {/* External Wallet Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">External Wallet:</span>
                <Badge className={isConnected ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-gray-500/20 text-gray-400 border-gray-500/50"}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>

              {/* Final Wallet Address */}
              {finalWalletAddress && (
                <div className="p-3 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-cyber-cyan" />
                    <span className="text-cyber-cyan font-semibold text-sm">Active Wallet</span>
                  </div>
                  <div className="text-white font-mono text-sm break-all">
                    {finalWalletAddress}
                  </div>
                  {embeddedWalletAddress && (
                    <div className="mt-2 text-xs text-green-400">
                      🎉 Using embedded wallet (auto-created)
                    </div>
                  )}
                </div>
              )}

              {/* Ready for NFT Collection */}
              {finalWalletAddress && (
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-semibold">Ready for NFT Collection</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    You can now create NFT collections! Your wallet is ready and will automatically receive ownership.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Flow Explanation */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">How It Works</CardTitle>
            <CardDescription className="text-gray-300">
              The complete flow from social login to NFT collection ownership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Social Login Flow</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span>User signs in with email/social</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span>Privy creates embedded wallet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span>Frontend detects wallet address</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-white">NFT Collection Flow</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span>Admin wallet deploys contract</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span>Admin transfers ownership</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span>User owns the collection</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
