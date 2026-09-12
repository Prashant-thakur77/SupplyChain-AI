"use client"

import { type FC, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  XCircle,
  Info,
  Eye,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Link,
  Bot,
  Sparkles,
} from "lucide-react"
import { type ValidationIssue, getValidationSummary } from "@/lib/validation/supply-chain-validator"

interface ValidationDialogProps {
  isOpen: boolean
  onClose: () => void
  issues: ValidationIssue[]
  onFocusElement: (elementId: string, elementType: "node" | "edge") => void
  onSaveWithWarnings?: () => void
  onFixWithAI?: (issue: ValidationIssue) => void
  isLoading?: boolean
}

const generateAIFixPrompt = (issue: ValidationIssue): string => {
  const elementInfo = issue.elementType !== 'graph' 
    ? `for ${issue.elementType} "${issue.elementId}"` 
    : '';

  switch (true) {
    case issue.message.includes('missing country'):
      return `Fix the missing country information ${elementInfo}. Please analyze the node name and context to suggest an appropriate country and update the location data.`;
    
    case issue.message.includes('missing supplier tier'):
      return `Fix the missing supplier tier information ${elementInfo}. Please analyze the node type and supply chain context to determine the appropriate supplier tier (tier1, tier2, or tier3+) and update it.`;
    
    case issue.message.includes('missing supply capacity'):
      return `Fix the missing supply capacity information ${elementInfo}. Please analyze the supplier type and industry context to suggest realistic supply capacity values and update the node.`;
    
    case issue.message.includes('missing lead time'):
      return `Fix the missing lead time information ${elementInfo}. Please analyze the supplier type, location, and industry to suggest appropriate lead time values.`;
    
    case issue.message.includes('missing location') || issue.message.includes('coordinates'):
      return `Fix the missing location/coordinate information ${elementInfo}. Please analyze the node context to determine appropriate geographic coordinates.`;
    
    case issue.message.includes('incomplete') || issue.message.includes('missing'):
      return `Fix the incomplete data ${elementInfo}. The issue is: ${issue.message}. Please analyze the context and fill in the missing information with appropriate values.`;
    
    case issue.message.includes('invalid'):
      return `Fix the invalid data ${elementInfo}. The issue is: ${issue.message}. Please correct the invalid values with appropriate ones.`;
    
    case issue.message.includes('duplicate'):
      return `Fix the duplicate connections issue ${elementInfo}. Please analyze and remove or merge duplicate connections while maintaining supply chain integrity.`;
    
    case issue.message.includes('orphaned'):
      return `Fix the orphaned nodes issue ${elementInfo}. Please analyze the supply chain structure and create appropriate connections for isolated nodes.`;
    
    default:
      return `Fix the validation issue ${elementInfo}: ${issue.message}. Please analyze the problem and provide an appropriate solution. ${issue.suggestion}`;
  }
};


// Determine which issues can be fixed by AI based on the validation types
const getFixableIssues = (issues: ValidationIssue[]): Set<string> => {
  const fixableTypes = new Set([
    "missing-country",
    "missing-supplier-tier",
    "missing-supply-capacity",
    "missing-lead-time",
    "missing-location",
    "incomplete-node-data",
    "missing-edge-data",
    "invalid-capacity",
    "invalid-coordinates",
    "duplicate-connections",
    "orphaned-nodes",
    "missing-supplier-info",
    "incomplete-logistics-data",
  ])

  return new Set(
    issues
      .filter((issue) => {
        const issueKey = issue.message.toLowerCase().replace(/\s+/g, "-")
        const messageText = issue.message.toLowerCase()

        return (
          fixableTypes.has(issueKey) ||
          messageText.includes("missing") ||
          messageText.includes("incomplete") ||
          messageText.includes("invalid") ||
          (issue.elementType !== "graph" &&
            (messageText.includes("country") ||
              messageText.includes("tier") ||
              messageText.includes("capacity") ||
              messageText.includes("lead time") ||
              messageText.includes("location") ||
              messageText.includes("coordinates") ||
              messageText.includes("supplier")))
        )
      })
      .map((issue) => issue.id),
  )
}

const ValidationDialog: FC<ValidationDialogProps> = ({
  isOpen,
  onClose,
  issues,
  onFocusElement,
  onSaveWithWarnings,
  onFixWithAI,
  isLoading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 3

  const summary = getValidationSummary(issues)
  const errors = issues.filter((issue) => issue.severity === "error")
  const warnings = issues.filter((issue) => issue.severity === "warning")
  const fixableIssueIds = getFixableIssues(issues)

  // Paginate issues
  const totalPages = Math.ceil(issues.length / itemsPerPage)
  const currentIssues = issues.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const getSeverityIcon = (severity: "error" | "warning") => {
    return severity === "error" ? (
      <XCircle className="h-4 w-4 text-red-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-amber-500" />
    )
  }

  const getSeverityColor = (severity: "error" | "warning") => {
    return severity === "error"
      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
  }

  const getElementTypeIcon = (elementType: string) => {
    switch (elementType) {
      case "node":
        return <Target className="h-4 w-4" />
      case "edge":
        return <Link className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const handleFocusElement = (issue: ValidationIssue) => {
    if (issue.elementType !== "graph") {
      onFocusElement(issue.elementId, issue.elementType as "node" | "edge")
    }
  }

  const handleFixWithAI = (issue: ValidationIssue) => {
    if (onFixWithAI) {
      onFixWithAI(issue)
    }
  }

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
  }

  const IssueCard = ({ issue }: { issue: ValidationIssue }) => {
    const isFixable = fixableIssueIds.has(issue.id)

    return (
      <div
        className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)} transition-all duration-200 hover:shadow-sm`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {getElementTypeIcon(issue.elementType)}
                <span className="ml-1 capitalize">{issue.elementType}</span>
              </Badge>

              <div className="flex gap-1">
                {issue.elementType !== "graph" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFocusElement(issue)}
                    className="h-6 px-2 text-xs hover:bg-background/80"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Focus
                  </Button>
                )}

                {isFixable && onFixWithAI && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFixWithAI(issue)}
                    className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 transition-colors"
                  >
                    <Bot className="h-3 w-3 mr-1" />
                    Fix with AI
                  </Button>
                )}
              </div>
            </div>

            <h4 className="font-medium text-sm text-foreground mb-0.5">{issue.message}</h4>

            <p className="text-xs text-muted-foreground leading-relaxed">{issue.suggestion}</p>

            {isFixable && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Sparkles className="h-3 w-3" />
                <span>AI can help fix this issue automatically</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 flex flex-col bg-blue-50/80 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-700/60">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Supply Chain Health Check
          </DialogTitle>
        </DialogHeader>

        {/* Summary Section */}
        <div className="px-4">
          <div
            className={`grid grid-cols-1 ${fixableIssueIds.size > 0 && onFixWithAI ? "lg:grid-cols-2" : ""} gap-3 items-start`}
          >
            <Alert
              className={`p-3 ${
                summary.errors > 0
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                  : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
              }`}
            >
              <AlertDescription className="text-sm">
                {summary.errors > 0 ? (
                  <>
                    <strong>Cannot save:</strong> Found {summary.errors} error{summary.errors !== 1 ? "s" : ""}{" "}
                    {summary.warnings > 0 && `and ${summary.warnings} warning${summary.warnings !== 1 ? "s" : ""} `}
                    that need to be addressed.
                  </>
                ) : summary.warnings > 0 ? (
                  <>
                    <strong>Ready to save:</strong> Found {summary.warnings} warning{summary.warnings !== 1 ? "s" : ""}{" "}
                    that you may want to review, but saving is allowed.
                  </>
                ) : (
                  <>
                    <strong>All good:</strong> No validation issues found. Ready to save!
                  </>
                )}
              </AlertDescription>
            </Alert>

            {fixableIssueIds.size > 0 && onFixWithAI && (
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                  <Bot className="h-4 w-4" />
                  <span className="font-medium">AI Assistant Available</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {fixableIssueIds.size} issue{fixableIssueIds.size !== 1 ? "s" : ""} can be automatically fixed with AI
                  assistance.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Issues Section with Pagination */}
        {issues.length > 0 && (
          <div className="px-6 py-1 flex-1 flex flex-col min-h-0">
            {/* Issue Type Header */}
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                {errors.length > 0 && currentIssues.some((issue) => issue.severity === "error") && (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold text-sm text-red-700 dark:text-red-400">Errors ({errors.length})</h3>
                  </>
                )}
                {warnings.length > 0 &&
                  currentIssues.some((issue) => issue.severity === "warning") &&
                  !currentIssues.some((issue) => issue.severity === "error") && (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <h3 className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                        Warnings ({warnings.length})
                      </h3>
                    </>
                  )}
              </div>

              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="text-xs text-muted-foreground">
                  Showing {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, issues.length)}{" "}
                  of {issues.length}
                </div>
              )}
            </div>

            {/* Current Issues */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {currentIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-2 border-t border-border flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i)}
                      className="h-8 w-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-border flex flex-row justify-between items-center flex-shrink-0">
          <p className="text-xs text-muted-foreground hidden md:block">
            Click "Focus" to navigate to elements or "Fix with AI" for automatic fixes
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>

            {summary.canSave && (
              <Button onClick={onSaveWithWarnings} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? "Saving..." : "Save Supply Chain"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { generateAIFixPrompt };
export default ValidationDialog;
