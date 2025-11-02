import type { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number // percentage
  icon?: ReactNode
  trend?: number[]
}

export default function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const isUp = (change ?? 0) >= 0
  return (
    <div className="rounded-lg border bg-surface p-4 transition-shadow hover:shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm opacity-70">{title}</div>
        {icon}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {typeof change === 'number' && (
        <div className={`mt-2 text-sm ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  )
}
