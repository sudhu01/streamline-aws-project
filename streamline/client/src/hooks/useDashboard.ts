import { useQuery } from '@tanstack/react-query'
import { getStats, getRecentWorkflows, getRecentLogs } from '../services/dashboardService'

export function useDashboard() {
  const stats = useQuery({ queryKey: ['dashboard','stats'], queryFn: getStats, refetchOnWindowFocus: true })
  const recentWorkflows = useQuery({ queryKey: ['dashboard','workflows'], queryFn: () => getRecentWorkflows(5) })
  const recentLogs = useQuery({ queryKey: ['dashboard','logs','all'], queryFn: () => getRecentLogs(10,'all'), refetchInterval: 30000 })

  const isLoading = stats.isLoading || recentWorkflows.isLoading || recentLogs.isLoading
  const error = stats.error || recentWorkflows.error || recentLogs.error

  return {
    stats: stats.data,
    recentWorkflows: Array.isArray(recentWorkflows.data) ? recentWorkflows.data : [],
    recentLogs: Array.isArray(recentLogs.data) ? recentLogs.data : [],
    isLoading,
    error,
  }
}

