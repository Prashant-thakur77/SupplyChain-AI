"use client"

import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  X,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISuggestion } from './types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AISuggestionsInsightsProps {
  suggestions: AISuggestion[];
  isLoading: boolean;
  onDismiss: () => void;
  onApply?: (suggestion: AISuggestion) => void;
}

export const AISuggestionsInsights: React.FC<AISuggestionsInsightsProps> = ({
  suggestions,
  isLoading,
  onDismiss,
  onApply
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isLoading && suggestions.length === 0) return null;

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'risk': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'cost': return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case 'efficiency': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'optimization': return <Target className="h-4 w-4 text-indigo-500" />;
      case 'planning': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default: return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const getCategoryStyles = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'risk': return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
      case 'cost': return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
      case 'efficiency': return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
      case 'optimization': return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50";
      default: return "bg-primary/5 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary-foreground dark:border-primary/20";
    }
  };

  return (
    <div className={cn(
      "mx-4 my-3 rounded-xl border transition-all duration-300 shadow-sm overflow-hidden",
      isExpanded ? "bg-card border-border" : "bg-muted/30 border-transparent py-1 px-3"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground/80">
            Strategic Insights
          </span>
          {isLoading && (
            <div className="flex space-x-1 ml-2">
              <div className="h-1 w-1 rounded-full bg-primary/60 animate-bounce"></div>
              <div className="h-1 w-1 rounded-full bg-primary/60 animate-bounce delay-75"></div>
              <div className="h-1 w-1 rounded-full bg-primary/60 animate-bounce delay-150"></div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Suggested Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {isLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-16 w-full rounded-lg bg-muted/50 animate-pulse"></div>
              <div className="h-16 w-full rounded-lg bg-muted/50 animate-pulse delay-100"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {suggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className={cn(
                    "group relative p-3 rounded-lg border transition-all hover:shadow-md cursor-default",
                    getCategoryStyles(suggestion.category)
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(suggestion.category)}
                      <h4 className="text-sm font-bold leading-tight decoration-inherit group-hover:underline decoration-2 underline-offset-2">
                        {suggestion.title}
                      </h4>
                    </div>
                    {suggestion.confidence && (
                      <Badge variant="outline" className="text-[10px] font-mono h-4 px-1.5 bg-background/50 border-none">
                        {suggestion.confidence}% match
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs leading-relaxed opacity-90 mb-2 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                    {suggestion.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <span className="text-[10px] font-semibold italic opacity-70 truncate max-w-[70%]">
                      Action: {suggestion.action}
                    </span>
                    {onApply && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 px-2 text-[10px] bg-background/40 hover:bg-background/80 font-bold border border-current shadow-sm"
                        onClick={() => onApply(suggestion)}
                      >
                        Explore Fix
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-1 text-[10px] text-center text-muted-foreground italic">
            Suggestions generated based on current supply chain architecture
          </div>
        </div>
      )}
    </div>
  );
};
