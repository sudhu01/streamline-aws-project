export default function IntegrationIconCard({ 
  integration, 
  icon, 
  onClick 
}: { 
  integration: any
  icon: JSX.Element
  onClick: () => void 
}) {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer rounded-lg border bg-surface p-4 hover:border-primary hover:bg-surface-elevated transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]"
    >
      <div className="flex items-center justify-center">{icon}</div>
      <div className="text-sm font-medium text-center text-text-primary">{integration.name}</div>
      <div className="text-xs text-center text-text-secondary line-clamp-2">{integration.description}</div>
    </div>
  )
}
