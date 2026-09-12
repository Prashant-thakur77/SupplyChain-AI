import { Skeleton } from "@/components/ui/skeleton";

export default function DigitalTwinEditSkeleton() {
  return (
    <div className="flex h-full flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Editor Mode: Builder Panel */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
          </div>
          
          {/* Add Nodes Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-32" />
                      </div>
                  </div>
                  ))}
              </div>
          </div>
          
          {/* Templates Section */}
          <div className="p-4 flex-1">
              <Skeleton className="h-5 w-20 mb-4" />
              <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
              </div>
          </div>
          
          {/* Clear Button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Skeleton className="h-10 w-full rounded" />
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

      {/* Editor Mode: Full properties panel */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col relative">
          {/* Save Button */}
          <div className="absolute top-4 right-4 z-10">
              <Skeleton className="h-12 w-20 rounded-md bg-blue-200 dark:bg-blue-800" />
          </div>
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Node Type Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-5 w-20 mb-3" />
              <Skeleton className="h-8 w-24 rounded" />
          </div>
          
          {/* General Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-5 w-16 mb-3" />
              <div className="space-y-3">
                  <div>
                      <Skeleton className="h-4 w-12 mb-1" />
                      <Skeleton className="h-9 w-full rounded" />
                  </div>
                  <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-20 w-full rounded" />
                  </div>
              </div>
          </div>
          
          {/* Additional Sections */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-5 w-28 mb-3" />
              <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
              </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
              <Skeleton className="h-10 w-full rounded mb-2" />
              <Skeleton className="h-10 w-full rounded" />
          </div>
      </div>
    </div>
  );
} 