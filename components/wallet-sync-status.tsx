'use client'

import React from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Loader2, Wallet, Shield } from 'lucide-react'

interface WalletSyncStatusProps {
  onWalletReady?: (address: string) => void
}

export function WalletSyncStatus({ onWalletReady }: WalletSyncStatusProps) {
  const { authenticated, ready } = usePrivy()
  const { wallets } = useWallets()
  const { address: externalWallet, isConnected } = useAccount()
  
  const embeddedWallet = wallets?.[0]
  const embeddedWalletAddress = embeddedWallet?.address
  const finalWalletAddress = embeddedWalletAddress || externalWallet
  
  // Notify parent when wallet is ready
  React.useEffect(() => {
    if (finalWalletAddress && onWalletReady) {
      onWalletReady(finalWalletAddress)
    }
  }, [finalWalletAddress, onWalletReady])

  if (!ready) {
    return (
      <Card className="bg-cyber-dark/60 border-cyber-cyan/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-cyber-cyan animate-spin" />
            <span className="text-gray-300">Initializing wallet system...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!authenticated) {
    return (
      <Card className="bg-cyber-dark/60 border-cyber-pink/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-cyber-pink" />
            <span className="text-gray-300">Please sign in to access wallet features</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-cyber-dark/60 border-cyber-cyan/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-cyber-cyan" />
          Wallet Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Authentication:</span>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Authenticated
          </Badge>
        </div>

        {/* Embedded Wallet Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Embedded Wallet:</span>
          {embeddedWalletAddress ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
              <AlertCircle className="w-3 h-3 mr-1" />
              Not Created
            </Badge>
          )}
        </div>

        {/* External Wallet Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">External Wallet:</span>
          {isConnected ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
              Not Connected
            </Badge>
          )}
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

        {/* Wallet Details */}
        {embeddedWallet && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-green-400 font-semibold text-sm mb-2">Embedded Wallet Details</div>
            <div className="space-y-1 text-xs text-gray-300">
              <div>Type: {embeddedWallet.walletClientType}</div>
              <div>Chain: {embeddedWallet.chainId}</div>
              <div>Status: {embeddedWallet.status}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
