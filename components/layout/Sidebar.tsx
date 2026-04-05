'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderOpen, Wrench, Package, FileText, MessageCircle,
  ChevronRight, Truck, Users, Settings, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'
import { ROLE_CONFIG } from '@/lib/constants'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: Role[]
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dossiers',     label: 'Dossiers',        icon: FolderOpen },
  { href: '/atelier',      label: 'Atelier',         icon: Wrench,       roles: ['direction', 'chef_atelier', 'mecanicien'] },
  { href: '/magasin',      label: 'Magasin',         icon: Package,      roles: ['direction', 'chef_atelier', 'magasin'] },
  { href: '/administratif',label: 'Administratif',   icon: FileText,     roles: ['direction', 'administratif', 'chef_atelier'] },
]

interface Props {
  role: Role
  unreadMessages?: number
  open: boolean
  onClose: () => void
}

export function Sidebar({ role, unreadMessages = 0, open, onClose }: Props) {
  const pathname = usePathname()
  const roleConfig = ROLE_CONFIG[role]

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Rapid Truck</p>
              <p className="text-xs text-gray-400">Service</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-gray-800">
          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', roleConfig?.bg, roleConfig?.color)}>
            {roleConfig?.label}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800',
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge || (item.href === '/dashboard' && unreadMessages > 0) ? (
                  <span className="bg-brand-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge ?? unreadMessages}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-4 h-4 opacity-60" />
                )}
              </Link>
            )
          })}

          {/* Messages link */}
          <div className="pt-2 border-t border-gray-800 mt-2">
            <Link
              href="/dossiers"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span className="flex-1">Messages</span>
              {unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-gray-800">
          {(role === 'direction') && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Administration</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
