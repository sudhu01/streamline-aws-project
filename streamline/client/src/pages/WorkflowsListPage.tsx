import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWorkflows, createWorkflow, deleteWorkflow, duplicateWorkflow, toggleWorkflowStatus, updateWorkflow } from '../services/workflowService'
import { useDebounce } from '../utils/useDebounce'
import { Plus, MoreVertical, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function WorkflowsListPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All'|'Active'|'Inactive'>('All')
  const [sort, setSort] = useState('updatedAt')
  const [view, setView] = useState<'grid'|'list'>('grid')
  const search = useDebounce(q, 300)

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['workflows', { q: search, status, sort }], queryFn: () => getWorkflows({ q: search, status: status === 'All' ? undefined : status, sort }) })

  const navigate = useNavigate()
  const createMut = useMutation({ 
    mutationFn: () => createWorkflow({ name: 'Untitled Workflow' }), 
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      navigate(`/workflows/${data.id}`)
    },
    onError: (error: any) => {
      console.error('Failed to create workflow:', error)
      alert(error?.userMessage || error?.message || 'Failed to create workflow. Please try again.')
    }
  })

  const items = data || []

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto pt-24">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold flex-1">Workflows</h1>
        <button onClick={() => createMut.mutate()} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-[color:var(--sl-primary)] text-white">
          <Plus size={16} /> Create Workflow
        </button>
      </div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="border rounded px-3 py-2 bg-background" />
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="border rounded px-2 py-2 bg-surface text-text-primary">
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-2 py-2 bg-surface text-text-primary">
          <option value="name">Name</option>
          <option value="createdAt">Created Date</option>
          <option value="updatedAt">Last Modified</option>
          <option value="lastRun">Last Run</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setView('grid')} className={`px-3 py-2 rounded border ${view==='grid'?'border-[color:var(--sl-primary)]':''}`}>Grid</button>
          <button onClick={() => setView('list')} className={`px-3 py-2 rounded border ${view==='list'?'border-[color:var(--sl-primary)]':''}`}>List</button>
        </div>
      </div>

      {isLoading && <div className="h-24 rounded border animate-pulse" />}
      {error && <div className="text-red-600">Failed to load. <button className="underline" onClick={() => refetch()}>Retry</button></div>}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded border p-6 bg-surface text-center">
          <div className="mb-2">No workflows found</div>
          <button onClick={() => createMut.mutate()} className="px-3 py-2 rounded bg-[color:var(--sl-primary)] text-white">Create your first workflow</button>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it: any) => (
              <WorkflowCard key={it.id} item={it} />
            ))}
          </div>
        ) : (
          <div className="divide-y rounded border bg-surface">
            {items.map((it: any) => (
              <WorkflowRow key={it.id} item={it} />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function WorkflowCard({ item }: any) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || '')
  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)

  // Sync state with item prop when it changes
  useEffect(() => {
    if (!editingName) setName(item.name)
    if (!editingDescription) setDescription(item.description || '')
  }, [item.name, item.description])
  
  const updateNameMut = useMutation({ 
    mutationFn: (v: string) => updateWorkflow(item.id, { name: v }), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      setEditingName(false)
    }
  })
  
  const updateDescMut = useMutation({ 
    mutationFn: (v: string) => updateWorkflow(item.id, { description: v }), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      setEditingDescription(false)
    }
  })
  
  const toggleMut = useMutation({ mutationFn: () => toggleWorkflowStatus(item.id, !item.isActive), onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }) })
  const deleteMut = useMutation({ 
    mutationFn: () => deleteWorkflow(item.id), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: any) => {
      alert(error?.response?.data?.error || 'Failed to delete workflow')
    }
  })

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      deleteMut.mutate()
    }
  }

  const handleNameSave = () => {
    if (name.trim() && name !== item.name) {
      updateNameMut.mutate(name.trim())
    } else {
      setName(item.name)
      setEditingName(false)
    }
  }

  const handleDescriptionSave = () => {
    const descValue = description.trim()
    if (descValue !== (item.description || '')) {
      updateDescMut.mutate(descValue)
    } else {
      setDescription(item.description || '')
      setEditingDescription(false)
    }
  }

  return (
    <div className="rounded-lg border bg-surface p-4 hover:shadow transition-shadow">
      {editingName ? (
        <input 
          value={name} 
          onChange={(e)=>setName(e.target.value)} 
          onBlur={handleNameSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNameSave()
            if (e.key === 'Escape') {
              setName(item.name)
              setEditingName(false)
            }
          }}
          className="font-semibold bg-transparent outline-none border border-primary rounded px-2 w-full"
          autoFocus
        />
      ) : (
        <div 
          onDoubleClick={() => setEditingName(true)}
          className="font-semibold cursor-pointer hover:bg-surface-elevated rounded px-2 py-1 -mx-2 -my-1 transition-colors"
        >
          {item.name}
        </div>
      )}
      
      {editingDescription ? (
        <textarea 
          value={description} 
          onChange={(e)=>setDescription(e.target.value)} 
          onBlur={handleDescriptionSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleDescriptionSave()
            if (e.key === 'Escape') {
              setDescription(item.description || '')
              setEditingDescription(false)
            }
          }}
          className="text-sm opacity-70 bg-transparent outline-none border border-primary rounded px-2 py-1 mt-1 w-full resize-none"
          rows={2}
          autoFocus
        />
      ) : (
        <div 
          onDoubleClick={() => setEditingDescription(true)}
          className="text-sm opacity-70 line-clamp-2 cursor-pointer hover:bg-surface-elevated rounded px-2 py-1 -mx-2 -my-1 transition-colors mt-1"
        >
          {item.description || 'No description'}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-full border text-xs ${item.isActive?'border-green-500 text-green-700':'border-slate-400'}`}>{item.isActive ? 'Active' : 'Inactive'}</span>
        <div className="flex items-center gap-2">
          <Link to={`/workflows/${item.id}`} className="px-2 py-1 rounded border hover:border-[color:var(--sl-primary)]">Edit</Link>
          <button onClick={()=>toggleMut.mutate()} className="px-2 py-1 rounded border hover:border-[color:var(--sl-primary)]">Toggle</button>
          <button 
            onClick={handleDelete} 
            disabled={deleteMut.isPending}
            className="px-2 py-1 rounded bg-transparent border border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            title="Delete workflow"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkflowRow({ item }: any) {
  const qc = useQueryClient()
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || '')
  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)

  // Sync state with item prop when it changes
  useEffect(() => {
    if (!editingName) setName(item.name)
    if (!editingDescription) setDescription(item.description || '')
  }, [item.name, item.description])
  
  const updateNameMut = useMutation({ 
    mutationFn: (v: string) => updateWorkflow(item.id, { name: v }), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      setEditingName(false)
    }
  })
  
  const updateDescMut = useMutation({ 
    mutationFn: (v: string) => updateWorkflow(item.id, { description: v }), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      setEditingDescription(false)
    }
  })
  
  const deleteMut = useMutation({ 
    mutationFn: () => deleteWorkflow(item.id), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: any) => {
      alert(error?.response?.data?.error || 'Failed to delete workflow')
    }
  })

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      deleteMut.mutate()
    }
  }

  const handleNameSave = () => {
    if (name.trim() && name !== item.name) {
      updateNameMut.mutate(name.trim())
    } else {
      setName(item.name)
      setEditingName(false)
    }
  }

  const handleDescriptionSave = () => {
    const descValue = description.trim()
    if (descValue !== (item.description || '')) {
      updateDescMut.mutate(descValue)
    } else {
      setDescription(item.description || '')
      setEditingDescription(false)
    }
  }

  return (
    <div className="p-3 flex items-center gap-3">
      <div className="flex-1">
        {editingName ? (
          <input 
            value={name} 
            onChange={(e)=>setName(e.target.value)} 
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave()
              if (e.key === 'Escape') {
                setName(item.name)
                setEditingName(false)
              }
            }}
            className="font-medium bg-transparent outline-none border border-primary rounded px-2 w-full"
            autoFocus
          />
        ) : (
          <div 
            onDoubleClick={() => setEditingName(true)}
            className="font-medium cursor-pointer hover:bg-surface-elevated rounded px-2 py-1 -mx-2 -my-1 transition-colors inline-block"
          >
            <Link to={`/workflows/${item.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{item.name}</Link>
          </div>
        )}
        
        {editingDescription ? (
          <textarea 
            value={description} 
            onChange={(e)=>setDescription(e.target.value)} 
            onBlur={handleDescriptionSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleDescriptionSave()
              if (e.key === 'Escape') {
                setDescription(item.description || '')
                setEditingDescription(false)
              }
            }}
            className="text-sm opacity-70 bg-transparent outline-none border border-primary rounded px-2 py-1 mt-1 w-full resize-none"
            rows={2}
            autoFocus
          />
        ) : (
          <div 
            onDoubleClick={() => setEditingDescription(true)}
            className="text-sm opacity-70 cursor-pointer hover:bg-surface-elevated rounded px-2 py-1 -mx-2 -my-1 transition-colors mt-1"
          >
            {item.description || 'No description'}
          </div>
        )}
      </div>
      <span className={`px-2 py-0.5 rounded-full border text-xs ${item.isActive?'border-green-500 text-green-700':'border-slate-400'}`}>{item.isActive ? 'Active' : 'Inactive'}</span>
      <div className="flex items-center gap-2">
        <Link to={`/workflows/${item.id}`} className="px-2 py-1 rounded border hover:border-[color:var(--sl-primary)]">Edit</Link>
        <button 
          onClick={handleDelete} 
          disabled={deleteMut.isPending}
          className="px-2 py-1 rounded bg-transparent border border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          title="Delete workflow"
        >
          <Trash2 size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  )
}

