import { useEffect, useState } from 'react'
import { getAvailableIntegrations } from '../../services/integrationService'
import IntegrationIconCard from './IntegrationIconCard'
import IntegrationConfigModal from './IntegrationConfigModal'
import { IconBrandSlack, IconBrandTwilio, IconLink, IconBrandDiscord, IconBrandTelegram, IconTable, IconNews } from '@tabler/icons-react'

export default function AvailableIntegrations({ category = 'All', search = '' }: { category?: string; search?: string }) {
  const [items, setItems] = useState<any[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let isMounted = true
    const loadIntegrations = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('[AvailableIntegrations] Starting to load integrations...')
        const data = await getAvailableIntegrations()
        if (isMounted) {
          console.log('[AvailableIntegrations] Loaded integrations:', {
            dataType: typeof data,
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : 'N/A',
            data: data
          })
          
          if (!Array.isArray(data)) {
            console.error('[AvailableIntegrations] ERROR: Received non-array data:', typeof data, data)
            setError(`Invalid data format received. Expected array, got ${typeof data}. Check console for details.`)
            setItems([])
          } else {
            console.log('[AvailableIntegrations] Setting', data.length, 'integrations')
            setItems(data)
          }
        }
      } catch (e: any) {
        if (!isMounted) return
        console.error('[AvailableIntegrations] Failed to load integrations:', e)
        console.error('[AvailableIntegrations] Error details:', {
          message: e?.message,
          code: e?.code,
          response: e?.response?.data,
          status: e?.response?.status,
          stack: e?.stack
        })
        
        const errorMessage = e?.response?.data?.error || e?.message || e?.code || 'Failed to load integrations'
        
        // Provide more helpful error messages
        if (e?.code === 'ERR_NETWORK' || e?.message?.includes('Network Error') || e?.message?.includes('ECONNREFUSED')) {
          setError('Cannot connect to server. Please ensure the server is running on port 4000.')
        } else if (e?.response?.status === 401) {
          setError('Authentication required. Please sign in again.')
        } else if (e?.response?.status === 429) {
          setError('Too many requests. Please wait a moment and refresh the page.')
        } else if (e?.response?.status === 500) {
          setError(`Server error: ${errorMessage}. Check server logs for details.`)
        } else {
          setError(`${errorMessage}. Check browser console for more details.`)
        }
        setItems([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadIntegrations()
    return () => { isMounted = false }
  }, [])
  
  // Hidden integrations - should not be displayed in the frontend
  const hiddenIntegrations = ['rest_api', 'webhook', 'email', 'google_sheets', 'github', 'stripe', 'sendgrid']
  
  // Filter items by hidden list, category and search
  const filteredItems = Array.isArray(items) ? items.filter(item => {
    // Exclude hidden integrations
    if (hiddenIntegrations.includes(item.key)) return false
    const matchesCategory = category === 'All' || item.category === category
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  }) : []
  
  const handleIconClick = (integration: any) => {
    setSelectedIntegration(integration)
    setConfigModalOpen(true)
  }

  const handleSave = async (config: any) => {
    if (!selectedIntegration) return
    // Connect integration with config
    const { connectIntegration } = await import('../../services/integrationService')
    await connectIntegration(selectedIntegration.key, selectedIntegration.name, config)
    setConfigModalOpen(false)
    setSelectedIntegration(null)
    window.location.reload()
  }

  // Get integration icon component from Tabler Icons
  const getIntegrationIcon = (key: string) => {
    const iconProps = { size: 48, className: 'text-primary' }
    const icons: Record<string, JSX.Element> = {
      discord: <IconBrandDiscord {...iconProps} />,
      telegram: <IconBrandTelegram {...iconProps} />,
      airtable: <IconTable {...iconProps} />,
      slack: <IconBrandSlack {...iconProps} />,
      news_api: <IconNews {...iconProps} />,
      twilio: <IconBrandTwilio {...iconProps} />,
    }
    return icons[key] || <IconLink {...iconProps} />
  }
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-text-secondary">Loading integrations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-error mb-2">Error loading integrations</div>
        <div className="text-sm text-text-secondary mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 rounded border hover:border-[color:var(--sl-primary)]"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">All Integrations</h3>
        {filteredItems.length === 0 ? (
          <div className="text-sm text-text-secondary">
            {filteredItems.length === 0 && items.length > 0 
              ? 'No integrations match your filters' 
              : 'No integrations available'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map(it => (
              <IntegrationIconCard 
                key={it.key} 
                integration={it}
                icon={getIntegrationIcon(it.key)}
                onClick={() => handleIconClick(it)}
              />
            ))}
          </div>
        )}
      </div>
      
      <IntegrationConfigModal
        open={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false)
          setSelectedIntegration(null)
        }}
        onSave={handleSave}
        integration={selectedIntegration}
      />
    </div>
  )
}

