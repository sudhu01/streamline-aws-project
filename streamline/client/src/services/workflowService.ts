import { api } from './api'

export function getWorkflows(params: any) {
  return api.get('/api/workflows', { params }).then(r => r.data)
}
export function getWorkflow(id: string) {
  return api.get(`/api/workflows/${id}`).then(r => r.data)
}
export function createWorkflow(data: any) {
  return api.post('/api/workflows', data).then(r => r.data)
}
export function updateWorkflow(id: string, data: any) {
  return api.put(`/api/workflows/${id}`, data).then(r => r.data)
}
export function deleteWorkflow(id: string) {
  return api.delete(`/api/workflows/${id}`).then(r => r.data)
}
export function duplicateWorkflow(id: string) {
  return api.post(`/api/workflows/${id}/duplicate`).then(r => r.data)
}
export function toggleWorkflowStatus(id: string, isActive: boolean) {
  return api.patch(`/api/workflows/${id}/status`, { isActive }).then(r => r.data)
}
export function testWorkflow(id: string, testData: any) {
  return api.post(`/api/workflows/${id}/test`, testData).then(r => r.data)
}
export function getTriggerTypes() {
  return api.get('/api/triggers/types').then(r => r.data)
}
export function getActionTypes() {
  return api.get('/api/actions/types').then(r => r.data)
}

