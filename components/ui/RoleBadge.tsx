import { cn } from '@/lib/utils'
import { ROLE_CONFIG } from '@/lib/constants'
import type { Role } from '@/lib/types'

interface Props {
  role: Role
  size?: 'sm' | 'md'
}

export function RoleBadge({ role, size = 'md' }: Props) {
  const config = ROLE_CONFIG[role]
  if (!config) return null

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      config.color, config.bg,
      size === 'sm' && 'text-xs px-2 py-0.5',
      size === 'md' && 'text-xs px-2.5 py-1',
    )}>
      {config.label}
    </span>
  )
}
