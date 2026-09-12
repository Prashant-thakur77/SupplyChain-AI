"use client"

import { useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { MemoizedMarkdown } from '@/components/copilot/memoized-markdown';
import { MessagesAreaProps, ChatError } from './types';
import { ErrorComponent } from './ErrorComponent';

export const MessagesArea: React.FC<MessagesAreaProps> = ({ 
  messages, 
  isLoading, 
  isImmersiveMode, 
  messagesHeight,
  error,
  onRetryError,
  onDismissError,
  retryCount = 0
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageLengthRef = useRef(messages.length);

  // Improved auto-scroll function that doesn't cause layout shifts
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        
        // Only auto-scroll if user is near the bottom or this is a new message
        if (isNearBottom || messages.length > prevMessageLengthRef.current) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: behavior
          });
        }
      }
    });
  }, [messages.length]);

  // Auto-scroll when new messages arrive or loading state changes
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessageLengthRef.current;
    
    if (hasNewMessages || isLoading) {
      // Use smooth scrolling for new messages, instant for loading state changes
      scrollToBottom(hasNewMessages ? 'smooth' : 'auto');
    }
    
    prevMessageLengthRef.current = messages.length;
  }, [messages, isLoading, scrollToBottom]);

  // Initial scroll to bottom when component mounts with existing messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto');
    }
  }, []); // Only run on mount

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10"
      style={{ 
        height: typeof messagesHeight === 'string' ? messagesHeight : `${messagesHeight}px`,
        scrollBehavior: 'smooth'
      }}
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 px-3 py-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-3 max-w-[260px]">
            <h3 className="text-base font-medium text-foreground">Welcome to AI Assistant</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I'm here to help you with your supply chain analysis, optimization strategies, 
              and answer any questions about your network. I can also take actions like adding nodes,
              loading templates, and analyzing your current setup.
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => {
            // Don't render if message has no content
            if (!message.content || !message.content.trim()) {
              return null;
            }
            
            return (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground max-w-[75%]" 
                      : "bg-background border border-border text-foreground shadow-sm max-w-[95%]"
                  }`}
                >
                  <MemoizedMarkdown content={message.content} id={message.id} />
                </div>
              </div>
            );
          })}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start pl-3">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse"></div>
                <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-75"></div>
                <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-150"></div>
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to - positioned at the very end */}
          <div ref={messagesEndRef} className="h-0" />
        </>
      )}
      
      {/* Error display */}
      {error && onRetryError && onDismissError && (
        <ErrorComponent 
          error={error}
          onRetry={onRetryError}
          onDismiss={onDismissError}
          retryCount={retryCount}
        />
      )}
    </div>
  );
}; 