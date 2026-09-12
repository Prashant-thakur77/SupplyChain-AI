import { formatDistanceToNow } from 'date-fns'

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'WEATHER':
      return '☁️'
    case 'GEOPOLITICAL':
      return '🌍'
    case 'OPERATIONAL':
      return '⚙️'
    case 'ECONOMIC':
      return '💰'
    default:
      return '📊'
  }
}

export const getSeverityColor = (severity: number) => {
  if (severity >= 60)
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/30'
  if (severity >= 40)
    return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-800/30'
  return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800/30'
}

export const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
    case 'MEDIUM':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400'
    case 'LOW':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400'
  }
}

export const formatTimeAgo = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return 'Recently'
  }
} 