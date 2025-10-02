/* ───────────────── Wallet Button ───────────────── */
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { SocialLogin } from './social-login'
import { useState } from 'react'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { ready, login, authenticated } = usePrivy()
  const [showSocialLogin, setShowSocialLogin] = useState(false)

  if (!ready) return null         

  /* ─── already connected ─── */
  if (isConnected || authenticated)
    return (
      <Button type="button" variant="outline" onClick={() => disconnect()}>
        {address?.slice(0, 6)}…{address?.slice(-4) || 'User'}
      </Button>
    )

  /* ─── Show social login modal ─── */
  if (showSocialLogin) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="relative">
          <Button
            onClick={() => setShowSocialLogin(false)}
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 z-10 bg-white rounded-full w-8 h-8 p-0"
          >
            ×
          </Button>
          <SocialLogin />
        </div>
      </div>
    )
  }

  /* ─── not connected ─── */
  const first = connectors.find(c => c.ready)

  const handleWalletClick = () => {
    if (first) connect({ connector: first })
    else       login()             
  }

  return (
    <div className="flex gap-2">
      <Button 
        type="button" 
        onClick={handleWalletClick} 
        className="bg-cyber-dark border-2 border-cyber-green text-cyber-green hover:bg-cyber-green/10"
      >
        Connect&nbsp;Wallet
      </Button>
      <Button 
        type="button" 
        onClick={() => setShowSocialLogin(true)}
        variant="outline"
        className="border-cyber-green text-cyber-green hover:bg-cyber-green/10"
      >
        Social&nbsp;Login
      </Button>
    </div>
  )
}
