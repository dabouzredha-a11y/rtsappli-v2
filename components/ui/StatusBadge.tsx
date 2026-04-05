import { cn } from '@/lib/utils'
import { STATUT_CONFIG } from '@/lib/constants'
import type { StatutDossier } from '@/lib/types'

interface Props {
  statut: StatutDossier
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ statut, size = 'md' }: Props) {
  const config = STATUT_CONFIG[statut]
  if (!config) return null

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full border',
      config.color, config.bg, config.border,
      size === 'sm' && 'text-xs px-2 py-0.5',
      size === 'md' && 'text-xs px-2.5 py-1',
      size === 'lg' && 'text-sm px-3 py-1.5',
    )}>
      {config.label}
    </span>
  )
}
