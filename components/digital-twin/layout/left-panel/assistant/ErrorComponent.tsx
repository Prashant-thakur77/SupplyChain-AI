"use client"

import { AlertTriangle, RefreshCw, Wifi, Server, Clock, Shield, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ChatError {
  type: 'CONNECTION' | 'RATE_LIMIT' | 'VALIDATION' | 'SERVICE' | 'UNKNOWN';
  message: string;
  code?: string;
  retryable: boolean;
}

interface ErrorComponentProps {
  error: ChatError;
  onRetry: () => void;
  onDismiss: () => void;
  retryCount?: number;
  className?: string;
}

const getErrorIcon = (errorType: ChatError['type']) => {
  switch (errorType) {
    case 'CONNECTION':
      return <Wifi className="h-4 w-4" />;
    case 'RATE_LIMIT':
      return <Clock className="h-4 w-4" />;
    case 'VALIDATION':
      return <Shield className="h-4 w-4" />;
    case 'SERVICE':
      return <Server className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getErrorColor = (errorType: ChatError['type']) => {
  // More subtle gray-based colors
  return 'border-gray-200 bg-gray-50 text-gray-600';
};

export const ErrorComponent: React.FC<ErrorComponentProps> = ({
  error,
  onRetry,
  onDismiss,
  retryCount = 0,
  className
}) => {
  const shouldShowRetry = error.retryable && retryCount < 3;
  const errorColorClass = getErrorColor(error.type);
  const ErrorIcon = () => getErrorIcon(error.type);

  const getErrorTitle = (type: ChatError['type']) => {
    switch (type) {
      case 'CONNECTION': return 'Connection Error';
      case 'RATE_LIMIT': return 'Rate Limited';
      case 'VALIDATION': return 'Invalid Request';
      case 'SERVICE': return 'Service Error';
      default: return 'Error';
    }
  };

  const getShortMessage = (message: string) => {
    return message.length > 50 ? message.substring(0, 47) + '...' : message;
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "mx-4 my-1 p-2 rounded-full border transition-all duration-200 flex items-center gap-2",
        errorColorClass,
        className
      )}>
        {/* Error Icon with Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-shrink-0">
              <ErrorIcon />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs p-2">
            <div className="space-y-1">
              <p className="text-gray-700 font-medium">{getErrorTitle(error.type)}</p>
              {error.code && (
                <p className="text-gray-500 font-mono text-[10px]">{error.code}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Error Message with Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 truncate">
                {getShortMessage(error.message)}
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm text-xs p-2">
            <div className="space-y-1">
              <p className="text-gray-700 font-medium text-[10px]">{getErrorTitle(error.type)}</p>
              <p className="text-gray-600 text-[10px] leading-tight">{error.message}</p>
              {retryCount > 0 && (
                <p className="text-gray-500 text-[10px]">
                  Retry: {retryCount}/3
                </p>
              )}
              {error.code && (
                <p className="text-gray-500 font-mono text-[9px] bg-gray-100 px-1 py-0.5 rounded">
                  {error.code}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {shouldShowRetry && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-white/50"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px] p-1">
                <p className="text-gray-600">Retry ({3 - retryCount} left)</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-white/50"
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-[10px] p-1">
              <p className="text-gray-600">Dismiss</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ErrorComponent; 