"use client"

import { CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GlassmorphicCard } from "../ui/glassmorphic-card"

export function ProfilePageSkeleton(): React.ReactElement {
  return (
    <div className="relative min-h-full flex-1 bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 dark:from-gray-900 dark:to-slate-900 overflow-x-hidden">
      {/* Enhanced background blurred elements for light mode */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:bg-purple-900 opacity-30 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 dark:bg-blue-900 opacity-25 blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 dark:bg-emerald-900 opacity-20 blur-2xl"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 dark:bg-orange-900 opacity-15 blur-3xl animate-pulse"></div>

      <div className="relative max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* Profile Header Skeleton */}
        <GlassmorphicCard className="overflow-hidden border-0 shadow-xl ">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="relative">
                <Skeleton className="w-24 h-24 rounded-full" />
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-5 w-48" />
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-8 w-32 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
              
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </GlassmorphicCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notification Preferences Skeleton */}
          <GlassmorphicCard className="border-0 shadow-lg ">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="w-10 h-6 rounded-full" />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="w-10 h-6 rounded-full" />
              </div>
            </CardContent>
          </GlassmorphicCard>

          {/* Security Settings Skeleton */}
          <GlassmorphicCard className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </GlassmorphicCard>

          {/* Quick Access Skeleton */}
          <GlassmorphicCard className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  );
} 