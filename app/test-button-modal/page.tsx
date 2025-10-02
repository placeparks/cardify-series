'use client'

import { useState } from 'react'
import { SocialLogin } from '@/components/social-login'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

export default function TestButtonModalPage() {
  const [showSocialLogin, setShowSocialLogin] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Button-Triggered Modal Test
          </h1>
          <p className="text-xl text-gray-300">
            Test the "Create Wallet" button that opens the social login modal
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Create Your Wallet</CardTitle>
            <p className="text-gray-300">
              Click the button below to open the social login modal
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowSocialLogin(true)}
              className="w-full cyber-button"
              size="lg"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Create Wallet
            </Button>
          </CardContent>
        </Card>

        {/* Social Login Modal */}
        {showSocialLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-md">
              <Button
                onClick={() => setShowSocialLogin(false)}
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 z-10 bg-white rounded-full w-8 h-8 p-0 hover:bg-gray-100"
              >
                ×
              </Button>
              <SocialLogin onSuccess={() => setShowSocialLogin(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
