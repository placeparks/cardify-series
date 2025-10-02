'use client'

import { SocialLogin } from '@/components/social-login'
import { WalletButton } from '@/components/WalletConnect'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSocialLoginPage() {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Cardify Social Login Test
          </h1>
          <p className="text-xl text-gray-300">
            Test the new social login functionality with Privy
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Social Login Component */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Social Login Component</CardTitle>
              <CardDescription className="text-gray-300">
                Standalone social login with email OTP and social providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialLogin />
            </CardContent>
          </Card>

          {/* Wallet Button with Social Login */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Wallet Button with Social Login</CardTitle>
              <CardDescription className="text-gray-300">
                Updated wallet button that includes social login option
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <WalletButton />
              
              {authenticated && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <h3 className="text-green-400 font-semibold mb-2">Authentication Status</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p><strong>Authenticated:</strong> Yes</p>
                      <p><strong>User ID:</strong> {user?.id}</p>
                      <p><strong>Email:</strong> {user?.email?.address || 'Not provided'}</p>
                      <p><strong>Phone:</strong> {user?.phone?.number || 'Not provided'}</p>
                      <p><strong>Linked Accounts:</strong> {user?.linkedAccounts?.length || 0}</p>
                    </div>
                  </div>

                  {wallets && wallets.length > 0 && (
                    <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                      <h3 className="text-blue-400 font-semibold mb-2">🎉 Embedded Wallet Created!</h3>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p><strong>Wallet Address:</strong> {wallets[0]?.address}</p>
                        <p><strong>Wallet Type:</strong> {wallets[0]?.walletClientType}</p>
                        <p><strong>Chain:</strong> {wallets[0]?.chainId}</p>
                        <p><strong>Total Wallets:</strong> {wallets.length}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        💡 This wallet was automatically created when you signed in with email!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Implemented Features</CardTitle>
            <CardDescription className="text-gray-300">
              Social login features based on Privy documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Email Authentication</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Email OTP verification</li>
                  <li>• Resend code functionality</li>
                  <li>• Error handling and validation</li>
                  <li>• Flow state tracking</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Social Providers</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Google OAuth</li>
                  <li>• Twitter/X OAuth</li>
                  <li>• GitHub OAuth</li>
                  <li>• Discord OAuth</li>
                  <li>• LinkedIn OAuth</li>
                  <li>• Apple OAuth</li>
                  <li>• SMS Authentication</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Info */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Configuration</CardTitle>
            <CardDescription className="text-gray-300">
              Updated Privy configuration with social login methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black/20 p-4 rounded-lg">
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`loginMethods: [
  'email', 
  'sms', 
  'google', 
  'twitter', 
  'discord', 
  'github', 
  'linkedin', 
  'apple',
  'wallet'
]`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
