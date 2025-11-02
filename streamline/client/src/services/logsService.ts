import { api } from './api'

export function listLogs(params: any) {
  return api.get('/api/logs', { params }).then(r => r.data as { items:any[]; total:number })
}
export function getLog(id: string) {
  return api.get(`/api/logs/${id}`).then(r => r.data)
}
export function retryLog(id: string) {
  return api.post(`/api/logs/${id}/retry`).then(r => r.data)
}
export function getLogStats() {
  return api.get('/api/logs/stats/summary').then(r => r.data)
}
export function exportLogsCsv() {
  return api.get('/api/logs/export/csv', { responseType: 'blob' }).then(r => r.data)
}
export function exportLogsJson() {
  return api.get('/api/logs/export/json').then(r => r.data)
}

