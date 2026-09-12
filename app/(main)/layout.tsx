"use client"

import type React from "react"
import "../globals.css"
import "@copilotkit/react-ui/styles.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import AIChatOverlay from "@/components/ui/ai-chat-overlay"
import { ISCAChat } from "@/components/copilot/ISCA/ISCAChat"
import { CopilotProvider } from "@/components/copilot/copilot-provider"
import { supabaseClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔐 Checking authentication...')
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        
        if (authError || !user) {
          console.log('❌ Authentication failed, redirecting to signin')
          router.push('/signin')
          return
        }

        console.log('✅ User authenticated:', user.email)
        setIsAuthenticated(true)

        // Check if user has critical required profile fields
        const { data: userData, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('email', user.email)
          .maybeSingle()

        if (error) {
          console.log('⚠️ Error fetching user data:', error)
        }

        // Only redirect if critical fields are completely missing
        // Skip profile check for main dashboard during development
        const skipProfileCheck = pathname.includes('/dashboard') || 
                                pathname.includes('/digital-twin') ||
                                pathname.includes('/simulation') ||
                                pathname.includes('/orchestrator') ||
                                pathname.includes('/risk-prediction')
        
        if (userData && !skipProfileCheck && (
          !userData.organisation_name || userData.organisation_name.trim() === ''
        )) {
          console.log('⚠️ Missing organization name, redirecting to profile')
          router.push('/profile?show_popup=true')
          return
        }

        console.log('✅ Profile check passed, proceeding to main app')

      } catch (error) {
        console.error('❌ Auth check error:', error)
        router.push('/signin')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: authData } = supabaseClient.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === 'SIGNED_OUT' ){
          router.push('/')
        }else if(!session) {
          router.push('/signin')
        }
      }
    )

    return () => authData.subscription.unsubscribe()
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to signin
  }
  return (
      <div className={`h-full w-full`}>
        <SidebarProvider>
          <div className="flex flex-col h-screen w-full overflow-hidden">
            <AppSidebar />
            <main className="flex-1 min-h-0 flex flex-col overflow-auto bg-background">
              {children}
            </main>
          </div>

          <Toaster />
        </SidebarProvider>

        {/* Add AI Chat Overlay */}
        {/* <AIChatOverlay /> */}
        
        {/* Add ISCA Chat Assistant */}
        <ISCAChat />
      </div>
  )
}




