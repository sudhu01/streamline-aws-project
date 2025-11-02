import { useState, useEffect } from 'react'

interface FunctionNodeConfigProps {
  node: any
  onUpdate: (updates: any) => void
}

export default function FunctionNodeConfig({ node, onUpdate }: FunctionNodeConfigProps) {
  const [code, setCode] = useState(node?.data?.code || '')

  useEffect(() => {
    if (node?.data) {
      setCode(node.data.code || '')
    }
  }, [node])

  const handleUpdate = (value: string) => {
    setCode(value)
    onUpdate({ code: value })
  }

  if (!node) {
    return (
      <div className="text-sm text-text-secondary">Select a function node to configure</div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Code</label>
        <textarea
          value={code}
          onChange={(e) => handleUpdate(e.target.value)}
          placeholder={`const msg = $json.content || "";\nconst parts = msg.trim().split(" ");\nreturn [{ coin: (parts[1] || "bitcoin").toLowerCase() }];`}
          rows={12}
          className="w-full border border-border rounded px-3 py-2 bg-background text-text-primary focus:outline-none focus:border-primary font-mono text-sm resize-none"
          style={{ fontFamily: 'monospace' }}
        />
        <div className="mt-1 text-xs text-text-secondary">
          Use <code className="bg-surface px-1 py-0.5 rounded">$json</code> to access data from previous nodes.
        </div>
      </div>
    </div>
  )
}


