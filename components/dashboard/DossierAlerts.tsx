import Link from 'next/link'
import { AlertTriangle, Clock, Lock } from 'lucide-react'
import type { Dossier } from '@/lib/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatRelativeDate, getDaysOld } from '@/lib/utils'

interface Props {
  urgents: Dossier[]
  bloques: Dossier[]
  vieux: Dossier[]
}

export function DossierAlerts({ urgents, bloques, vieux }: Props) {
  const hasAlerts = urgents.length > 0 || bloques.length > 0 || vieux.length > 0
  if (!hasAlerts) return null

  return (
    <div className="space-y-3">
      {urgents.length > 0 && (
        <AlertSection
          icon={AlertTriangle}
          iconColor="text-red-500"
          bgColor="bg-red-50"
          borderColor="border-red-200"
          title={`${urgents.length} dossier${urgents.length > 1 ? 's' : ''} urgent${urgents.length > 1 ? 's' : ''}`}
          dossiers={urgents}
        />
      )}
      {bloques.length > 0 && (
        <AlertSection
          icon={Lock}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          borderColor="border-red-300"
          title={`${bloques.length} dossier${bloques.length > 1 ? 's' : ''} bloqué${bloques.length > 1 ? 's' : ''}`}
          dossiers={bloques}
        />
      )}
      {vieux.length > 0 && (
        <AlertSection
          icon={Clock}
          iconColor="text-amber-500"
          bgColor="bg-amber-50"
          borderColor="border-amber-200"
          title={`${vieux.length} dossier${vieux.length > 1 ? 's' : ''} de plus de 7 jours`}
          dossiers={vieux}
        />
      )}
    </div>
  )
}

function AlertSection({
  icon: Icon, iconColor, bgColor, borderColor, title, dossiers,
}: {
  icon: React.ElementType
  iconColor: string
  bgColor: string
  borderColor: string
  title: string
  dossiers: Dossier[]
}) {
  return (
    <div className={`rounded-xl border p-4 ${bgColor} ${borderColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
      </div>
      <div className="space-y-2">
        {dossiers.slice(0, 5).map((d) => (
          <Link
            key={d.id}
            href={`/dossiers/${d.id}`}
            className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-xs text-gray-500 shrink-0">{d.numero}</span>
              <span className="text-sm font-medium text-gray-800 truncate">{d.client_nom}</span>
              <span className="text-xs text-gray-400 hidden sm:block truncate">{d.immatriculation}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-gray-400">{formatRelativeDate(d.created_at)}</span>
              <StatusBadge statut={d.statut} size="sm" />
            </div>
          </Link>
        ))}
        {dossiers.length > 5 && (
          <p className="text-xs text-gray-500 text-center pt-1">+ {dossiers.length - 5} autres</p>
        )}
      </div>
    </div>
  )
}
