import type { ReactNode } from "react"
import type { Metadata } from 'next'
import "./globals.css"
import { ThemeProvider } from "@/components/theme"
import SessionProvider from "@/lib/context/SessionProvider";
import { Toaster } from "@/components/ui/sonner"
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Inter, Fraunces } from 'next/font/google'
import { CopilotProvider } from "@/components/copilot/copilot-provider";
import "@copilotkit/react-textarea/styles.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export const metadata: Metadata = {
  title: 'SupplyChain AI - AI-Powered Supply Chain Intelligence',
  description: 'Transform your supply chain with intelligent resilience. Build resilient supply chains with AI-driven insights, real-time monitoring, and predictive analytics.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}


const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
})

// Editorial display serif for headlines (variable font; italic kept for accents).
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="min-h-screen flex flex-col">
        <PwaRegister />
        <ErrorBoundary>
          <NuqsAdapter
            // Force all nuqs URL updates to use shallow routing (history.pushState) instead of
            // router.push. This prevents full page re-renders and component unmounts when any
            // URL param changes — critical to keep dialogs like SaveSupplyChainDialog alive.
            // @ts-ignore – the 'shallow' prop is an undocumented escape hatch that may not show in types
            shallow
          >
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <CopilotProvider> 
                {children}
              </CopilotProvider>
              <Toaster position="top-right" richColors />
              <SessionProvider />
            </ThemeProvider>
          </NuqsAdapter>
        </ErrorBoundary>
      </body>
    </html>
  );
}