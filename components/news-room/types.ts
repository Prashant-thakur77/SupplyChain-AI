export interface CriticalEvent {
  title: string
  summary: string
  severity: number
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  category: 'WEATHER' | 'GEOPOLITICAL' | 'OPERATIONAL' | 'ECONOMIC'
  affectedEntities: string[]
  timeframe: string
  confidence: number
  sources: Array<{
    url: string
    title: string
    credibility: number
    publishedAt: string
  }>
}

export interface Node {
  nodeId: string
  nodeName: string
  nodeType: string
  recordTimestamp: string
  weather: any
  criticalEvents: CriticalEvent[]
  mitigationSuggestions: any[]
}

export interface TimelineBatch {
  batchTimestamp: string
  nodes: Node[]
}

export interface SupplyChainTimelineData {
  supplyChainName: string
  supplyChainId: string
  batches: TimelineBatch[]
}

export interface ExtendedCriticalEvent extends CriticalEvent {
  id: string
  nodeName: string
  location: string
  supplyChainName: string
  batchTimestamp: string
}

export interface AlertDetailsSheetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  event: ExtendedCriticalEvent | null
}

export interface TimelineEventCardProps {
  event: ExtendedCriticalEvent
  onClick: (event: ExtendedCriticalEvent) => void
  isCollapsed?: boolean
  isBlurred?: boolean
}

export interface NewsRoomHeaderProps {
  alertCount: number
} 