"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture the error with Sentry
    Sentry.withScope((scope) => {
      scope.setTag("component", "ErrorBoundary");
      scope.setContext("errorInfo", {
        componentStack: errorInfo.componentStack,
      });
      scope.setLevel("error");
      Sentry.captureException(error);
    });

    // Log error for debugging
    console.error("Error Boundary caught an error:", error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Check if custom fallback is provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                An unexpected error occurred. The error has been reported and our team will look into it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                  <pre className="text-xs text-red-800 dark:text-red-200 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={this.resetError} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Reload page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to report errors
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: string) => {
    Sentry.withScope((scope) => {
      scope.setTag("component", "useErrorHandler");
      if (errorInfo) {
        scope.setContext("additionalInfo", { info: errorInfo });
      }
      scope.setLevel("error");
      Sentry.captureException(error);
    });
    
    console.error("Manual error report:", error, errorInfo);
  }, []);
};
