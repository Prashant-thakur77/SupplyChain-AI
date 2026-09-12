"use client";

import React from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Use the CopilotKit Message type directly
interface ISCAChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[]; // CopilotKit Message array
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  userName: string;
}

export function ISCAChatWindow({
  isOpen,
  onClose,
  messages,
  input,
  setInput,
  onSendMessage,
  onKeyPress,
  isLoading,
  messagesEndRef,
  userName
}: ISCAChatWindowProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] flex flex-col">
      {/* Chat window container */}
      <div className={cn(
        "flex flex-col h-full rounded-lg shadow-2xl border",
        "bg-background text-foreground",
        "dark:bg-card dark:text-card-foreground",
        "backdrop-blur-sm"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          "bg-primary/5 dark:bg-primary/10",
          "rounded-t-lg"
        )}>
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/Bot.jpg" alt="ISCA" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">ISCA</h3>
              <p className="text-xs text-muted-foreground">Intelligent Supply Chain Assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                👋 Hi! I'm ISCA, your Intelligent Supply Chain Assistant.
              </p>
              <p className="text-xs mt-2">
                I can help you navigate the app, analyze your supply chains, and provide insights.
              </p>
            </div>
          ) : (
            messages
              .filter(message => {
                const content = (message as any).content || (message as any).text || '';
                return content && typeof content === 'string' && content.trim().length > 0;
              })
              .map((message, index) => (
              <div
                key={message.id || index}
                className={cn(
                  "flex gap-3 max-w-full",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="/Bot.jpg" alt="ISCA" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[80%] text-sm",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {(message as any).content || (message as any).text || ''}
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/Bot.jpg" alt="ISCA" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 max-w-[80%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className={cn(
          "border-t p-4",
          "bg-background/50 dark:bg-card/50",
          "rounded-b-lg"
        )}>
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="Ask me anything about your supply chains..."
              className={cn(
                "flex-1 text-sm",
                "border-input bg-background",
                "focus:ring-2 focus:ring-primary/20",
                "dark:bg-background dark:border-input"
              )}
              disabled={isLoading}
            />
            <Button
              onClick={onSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
