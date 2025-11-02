import { prisma } from '../utils/prisma'

export async function createWorkflow(ownerId: string, data: any) {
  return prisma.workflow.create({ data: { ownerId, name: data.name || 'Untitled Workflow', description: data.description || null, isActive: false, triggerType: data.triggerType || null, triggerConfig: (data.triggerConfig || null) as any, rfNodes: (data.rfNodes || []) as any, rfEdges: (data.rfEdges || []) as any } })
}

export async function updateWorkflow(id: string, data: any) {
  return prisma.workflow.update({ where: { id }, data })
}

export async function deleteWorkflow(id: string) {
  return prisma.workflow.delete({ where: { id } })
}

export async function duplicateWorkflow(id: string) {
  const wf = await prisma.workflow.findUnique({ where: { id } })
  if (!wf) throw new Error('Workflow not found')
  return prisma.workflow.create({ data: { ownerId: wf.ownerId, name: `${wf.name} Copy`, description: wf.description, isActive: false, triggerType: wf.triggerType, triggerConfig: wf.triggerConfig as any, rfNodes: wf.rfNodes as any, rfEdges: wf.rfEdges as any } })
}

export function validateWorkflow(_data: any) { return { valid: true, errors: [] } }

export async function exportWorkflow(id: string) {
  const wf = await prisma.workflow.findUnique({ where: { id } })
  if (!wf) throw new Error('Workflow not found')
  return wf
}

export async function importWorkflow(ownerId: string, jsonData: any) {
  return prisma.workflow.create({ data: { ownerId, ...jsonData } })
}

