import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RelationshipBubbleProps {
  relationship: {
    source: string
    target: string
    strength: number
    relationship: string
  }
}

export function RelationshipBubble({ relationship }: RelationshipBubbleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer border bg-gray-50 dark:bg-gray-900 text-black dark:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
            <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full" />
            Risk Chain ({Math.round(relationship.strength * 100)}%)
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm">Risk Relationship</div>
            <div className="text-xs">
              <span className="font-medium">{relationship.source}</span>
              <span className="mx-1">→</span>
              <span className="font-medium">{relationship.target}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Impact: {relationship.relationship}
            </div>
            <div className="text-xs text-muted-foreground">
              Strength: {Math.round(relationship.strength * 100)}%
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 