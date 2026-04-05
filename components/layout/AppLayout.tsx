'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { PageLoader } from '@/components/ui/LoadingSpinner'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profil, loading, logout } = useAuth()
  const unreadMessages = useUnreadMessages(profil?.id)

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        role={profil?.role ?? 'reception'}
        unreadMessages={unreadMessages}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header
        profil={profil}
        unreadMessages={unreadMessages}
        onMenuToggle={() => setSidebarOpen(true)}
        onLogout={logout}
      />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
