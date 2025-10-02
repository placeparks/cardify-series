"use client"

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { CollectionManager } from '@/components/collection-manager'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Loader2 } from 'lucide-react'

export default function CollectionsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error checking authentication:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyber-dark to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-cyan mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyber-dark to-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
            <p className="text-gray-400 mb-6">Please sign in to view your NFT collections</p>
            <button
              onClick={() => window.location.href = '/auth'}
              className="cyber-button"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyber-dark to-gray-900">
      <Navigation />
      <div className="px-6 py-8 pt-24 pb-20">
        <div className="max-w-7xl mx-auto">
          <CollectionManager userId={user.id} />
        </div>
      </div>
    </div>
  )
}
