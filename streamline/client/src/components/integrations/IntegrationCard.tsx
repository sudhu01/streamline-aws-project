export default function IntegrationCard({ item, onConnect, onManage, onDisconnect }: { item: any; onConnect?: ()=>void; onManage?: ()=>void; onDisconnect?: ()=>void }) {
  const connected = !!item.connected
  return (
    <div className="rounded-lg border bg-surface p-4 hover:border-[color:var(--sl-primary)] transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-15 w-15 rounded bg-background border flex items-center justify-center">
          <img src={item.logoUrl || '/logo.svg'} alt="logo" style={{ width: 60, height: 60 }} />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm opacity-70 line-clamp-2">{item.description}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        {connected ? (
          <span className="px-2 py-0.5 text-xs rounded-full border border-green-500 text-green-700">Connected</span>
        ) : (
          <span className="px-2 py-0.5 text-xs rounded-full border">Available</span>
        )}
        <div className="flex items-center gap-2">
          {!connected && <button onClick={onConnect} className="px-3 py-1 rounded bg-[color:var(--sl-primary)] text-white">Connect</button>}
          {connected && <button onClick={onManage} className="px-3 py-1 rounded border hover:border-[color:var(--sl-primary)]">Manage</button>}
          {connected && <button onClick={onDisconnect} className="px-3 py-1 rounded border hover:border-[color:var(--sl-primary)]">Disconnect</button>}
        </div>
      </div>
    </div>
  )
}

