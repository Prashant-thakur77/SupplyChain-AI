"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-4 text-center border rounded-lg shadow-lg bg-card">
        <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
        <p className="text-muted-foreground">
          {error || "An error occurred during authentication. Please try again."}
        </p>
        <div className="pt-4">
          <Link href="/signin">
            <Button variant="default" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
