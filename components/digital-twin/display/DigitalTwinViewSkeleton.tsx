import { Skeleton } from "@/components/ui/skeleton";

export default function DigitalTwinViewSkeleton() {
  return (
    <div className="flex h-full flex-1 bg-gray-50 dark:bg-gray-900">
      {/* View Mode: AI Assistant */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <Skeleton className="h-6 w-32" /> {/* "AI Assistant" */}
              <Skeleton className="h-8 w-24 rounded" /> {/* "Clear Chat" button */}
          </div>
          
          {/* Chat History */}
          <div className="flex-1 p-4 space-y-6">
              {/* Assistant message */}
              <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                  </div>
              </div>
              {/* User message */}
              <div className="flex items-start gap-3 justify-end">
                  <div className="flex-1 space-y-2 items-end flex flex-col">
                      <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
              </div>
               {/* Another assistant message */}
              <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                  </div>
              </div>
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <Skeleton className="h-4 w-28" /> {/* "AI Suggestions" title */}
              <div className="flex gap-2">
                  <Skeleton className="h-8 w-12 rounded-full" />
                  <Skeleton className="h-8 w-12 rounded-full" />
                  <Skeleton className="h-8 w-40 rounded-full" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
          </div>
      </div>

      {/* Main Canvas Area Skeleton */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex space-x-2">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
        </div>
        
        {/* Mock Nodes in Canvas */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-3/4 h-1/2">
                <Skeleton className="absolute top-[20%] left-[10%] h-16 w-32 rounded-lg" />
                <Skeleton className="absolute top-[50%] left-[30%] h-16 w-32 rounded-lg" />
                <Skeleton className="absolute top-[30%] left-[60%] h-16 w-32 rounded-lg" />
                <Skeleton className="absolute top-[60%] left-[80%] h-16 w-32 rounded-lg" />
                <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 -translate-x-1/2 -translate-y-1/2">
                    <Skeleton className="h-full w-full"/>
                </div>
            </div>
        </div>
        
        {/* Mini Map */}
        <div className="absolute bottom-4 right-4 w-48 h-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-2">
            <Skeleton className="h-full w-full" />
        </div>
      </div>

      {/* View Mode: Read-only properties */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <Skeleton className="h-6 w-24" /> {/* "Properties" */}
              <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full bg-green-300" />
                  <Skeleton className="h-4 w-20" /> {/* "View Only" */}
              </div>
          </div>
          
          {/* Placeholder content */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3">
              <Skeleton className="h-16 w-16 rounded-full" /> {/* Icon */}
              <Skeleton className="h-5 w-64" /> {/* "Select a node..." */}
              <Skeleton className="h-4 w-48" />
          </div>
      </div>
    </div>
  );
} 