"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture the global error with Sentry
    Sentry.withScope((scope) => {
      scope.setTag("errorBoundary", "global");
      scope.setLevel("fatal");
      if (error.digest) {
        scope.setTag("digest", error.digest);
      }
      Sentry.captureException(error);
    });
    
    console.error("Global error captured:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Application Error
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                Something went wrong with the application. The error has been reported to our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    Development Error Details:
                  </h4>
                  <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto whitespace-pre-wrap">
                    {error.message}
                  </pre>
                  {error.digest && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button onClick={reset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'} 
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.reload()} 
                  className="w-full text-sm"
                >
                  Reload page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}