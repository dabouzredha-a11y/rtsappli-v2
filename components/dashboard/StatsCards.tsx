'use client'

import { AlertTriangle, Package, Wrench, Receipt, Clock, FolderOpen } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'
import { cn } from '@/lib/utils'

const CARDS = [
  {
    key: 'urgents' as const,
    label: 'Urgents',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
  },
  {
    key: 'en_cours' as const,
    label: 'En cours',
    icon: Wrench,
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    border: 'border-brand-200',
    iconBg: 'bg-brand-100',
  },
  {
    key: 'attente_pieces' as const,
    label: 'Attente pièces',
    icon: Package,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
  },
  {
    key: 'a_facturer' as const,
    label: 'À facturer',
    icon: Receipt,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    iconBg: 'bg-pink-100',
  },
  {
    key: 'plus_7j' as const,
    label: '+7 jours',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
  },
  {
    key: 'total_actifs' as const,
    label: 'Dossiers actifs',
    icon: FolderOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
  },
]

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {CARDS.map(({ key, label, icon: Icon, color, bg, border, iconBg }) => (
        <div key={key} className={cn('card border p-4', border, bg)}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className={cn('text-2xl font-bold', color)}>{stats[key]}</p>
            </div>
            <div className={cn('p-2 rounded-lg', iconBg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
