"use client"

import React from 'react'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import Link from "next/link"
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AppHeader } from "@/components/layout/app-header"
import { Badge } from '@/components/ui/badge'
import { NewsRoomHeaderProps } from './types'

const NewsRoomTitle = ({ alertCount }: { alertCount: number }) => (
    <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Real Time Intelligence Gathering
        </h1>
        {alertCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
                {alertCount} New Alerts
            </Badge>
        )}
        <Tooltip>
            <TooltipTrigger asChild>
                <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm text-gray-900 dark:text-gray-100">
                <p className="text-sm text-muted-foreground">
                We gather information about all your supply chains, including nodes, edges (paths), and connections at regular intervals. 
                All relevant updates and intelligence are provided here in the news room to keep you informed about your supply chain status.
                </p>
            </TooltipContent>
        </Tooltip>
    </div>
)

const BackButton = () => (
    <Button asChild variant="ghost" size="icon" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
        <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
        </Link>
    </Button>
)

export function NewsRoomHeader({ alertCount }: NewsRoomHeaderProps) {
  return (
    <TooltipProvider>
        <AppHeader 
            as="div"
            title={<NewsRoomTitle alertCount={alertCount} />}
            leftContent={<BackButton />}
            className="relative border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 border-b"
        />
    </TooltipProvider>
  )
} 