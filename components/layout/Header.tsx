'use client'

import { Menu, Bell, LogOut, User } from 'lucide-react'
import { RoleBadge } from '@/components/ui/RoleBadge'
import type { Profil } from '@/lib/types'

interface Props {
  profil: Profil | null
  unreadMessages: number
  onMenuToggle: () => void
  onLogout: () => void
}

export function Header({ profil, unreadMessages, onMenuToggle, onLogout }: Props) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-gray-200 z-20 flex items-center gap-3 px-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title placeholder — filled by children */}
      <div className="flex-1" id="header-title" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <Bell className="w-5 h-5" />
          {unreadMessages > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-brand-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {profil ? `${profil.prenom} ${profil.nom}` : '—'}
            </p>
            {profil && (
              <div className="mt-0.5">
                <RoleBadge role={profil.role} size="sm" />
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            title="Se déconnecter"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-600 ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
