import { api } from './api'

export interface DashboardStats {
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  successRate: number
}

export async function getStats(): Promise<DashboardStats> {
  const res = await api.get('/api/dashboard/stats')
  return res.data as DashboardStats
}

export async function getRecentWorkflows(limit = 5) {
  const res = await api.get('/api/workflows/recent', { params: { limit } })
  return res.data as Array<{ id: string; name: string; status: string; lastRun: string | null; successRate: number | null }>
}

export async function getRecentLogs(limit = 10, status: 'all' | 'Success' | 'Failed' | 'Running' = 'all') {
  const res = await api.get('/api/logs/recent', { params: { limit, status } })
  return res.data as Array<{ id: string; status: string; startedAt: string; finishedAt?: string; durationMs?: number; workflow: { id: string; name: string } }>
}

