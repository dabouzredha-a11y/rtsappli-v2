'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { STATUT_CONFIG } from '@/lib/constants'
import type { StatutDossier } from '@/lib/types'

const CHART_COLORS: Partial<Record<StatutDossier, string>> = {
  nouveau:            '#94a3b8',
  recu:               '#60a5fa',
  a_diagnostiquer:    '#a78bfa',
  diagnostique_termine: '#818cf8',
  devis_a_envoyer:    '#fbbf24',
  attente_validation_client: '#f59e0b',
  devis_valide:       '#2dd4bf',
  attente_pieces:     '#fb923c',
  pieces_recues:      '#22d3ee',
  en_cours:           '#f97316',
  termine_technique:  '#4ade80',
  a_facturer:         '#f472b6',
  bloque:             '#f87171',
}

interface ChartData {
  statut: StatutDossier
  count: number
}

export function StatusChart({ data }: { data: ChartData[] }) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUT_CONFIG[d.statut]?.label ?? d.statut,
      value: d.count,
      statut: d.statut,
    }))

  if (chartData.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Répartition des statuts</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Aucun dossier actif
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold text-gray-900">Répartition des statuts</h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.statut}
                  fill={CHART_COLORS[entry.statut] ?? '#cbd5e1'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
