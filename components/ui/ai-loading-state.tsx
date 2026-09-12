"use client"

import { useEffect, useMemo, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "./button"
import { useRouter } from "next/navigation"
import { MemoizedMarkdown } from "@/components/copilot/memoized-markdown"

interface AILoadingStateProps {
  /**
   * The raw streaming text coming from the backend.
   * This string is expected to grow over time as the request streams.
   */
  content?: string
}

export default function AILoadingState({ content = "" }: AILoadingStateProps) {
  const textContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Auto-scroll to the bottom whenever new output arrives
  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop =
        textContainerRef.current.scrollHeight
    }
  }, [content])

  const handleGoToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-start space-x-3">
        <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-gray-500 mt-1" />
        <div>
          <h3 className="text-lg font-semibold">
            Analyzing your supply chain...
          </h3>
          <p className="text-sm text-gray-500">
            Gathering initial info for the supply chain.
          </p>
        </div>
      </div>

      {/* Streaming text block */}
      <div className="relative border rounded-lg bg-gray-50 p-4 shadow-md">
        <div
          ref={textContainerRef}
          className="w-full h-[300px] overflow-y-auto bg-transparent pr-2"
          style={{ scrollBehavior: "smooth" }}
        >
          <MemoizedMarkdown 
            content={content} 
            id="ai-loading-stream" 
          />
        </div>

        {/* Gradient overlay to soften top edges */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(249,250,251,0.9) 0%, rgba(249,250,251,0.5) 30%, rgba(249,250,251,0) 100%)",
            zIndex: 10,
          }}
        />
      </div>

      {/* Footer with button */}
      <div className="pt-4 mt-4 w-full">
        <p className="text-xs text-gray-400 mb-2 text-center">
          You can leave this page, the analysis will continue in the background.
        </p>
        <Button
          onClick={handleGoToDashboard}
          className="w-full shadow-md"
          variant="secondary"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
} 