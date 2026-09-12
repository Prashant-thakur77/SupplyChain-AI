"use client"
import { useState, useRef, useEffect } from "react"
import Draggable from "react-draggable"
import type React from "react"

import { Cpu, Paperclip, Mic, CornerDownLeft, X, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useChat } from "@ai-sdk/react"
import { cn } from "@/lib/utils"

interface ChatError {
  type: 'CONNECTION' | 'RATE_LIMIT' | 'VALIDATION' | 'SERVICE' | 'UNKNOWN'
  message: string
  code?: string
  retryable: boolean
}

function AIChatOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [chatError, setChatError] = useState<ChatError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingBarRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })

  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    append, 
    error,
    reload,
    setMessages
  } = useChat({
    api: '/api/chat',
    initialMessages: [{ id: "1", role: "assistant", content: "Hello! How can I assist you with your supply chain today?" }],
    onError: (error) => {
      console.group('🚨 useChat onError triggered')
      console.log('useChat error:', error)
      console.log('useChat error type:', typeof error)
      console.log('useChat error keys:', Object.keys(error || {}))
      console.groupEnd()
      
      // Handle the async error processing
      handleChatError(error).catch(asyncError => {
        console.error('Error in handleChatError:', asyncError)
        setChatError({
          type: 'UNKNOWN',
          message: 'An unexpected error occurred. Please try again.',
          retryable: true
        })
      })
    },
    onResponse: (response) => {
      console.group('✅ useChat onResponse triggered')
      console.log('Response object:', response)
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      console.groupEnd()
      
      // Clear any previous errors on successful response
      setChatError(null)
      setRetryCount(0)
      
      // Check if response is not ok
      if (!response.ok) {
        console.log('Response not ok, treating as error')
        handleChatError(response)
      }
    },
    onFinish: (message, options) => {
      console.group('🏁 useChat onFinish triggered')
      console.log('Final message:', message)
      console.log('Options:', options)
      console.groupEnd()
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const parseErrorResponse = (errorResponse: any): ChatError => {
    console.log('🔧 parseErrorResponse input:', errorResponse)
    
    // Handle HTTP error responses
    if (errorResponse.status) {
      console.log('Handling HTTP status error:', errorResponse.status)
      switch (errorResponse.status) {
        case 400:
          return {
            type: 'VALIDATION',
            message: 'Please check your message and try again.',
            retryable: false
          }
        case 429:
          return {
            type: 'RATE_LIMIT',
            message: 'Too many requests. Please wait a moment before trying again.',
            retryable: true
          }
        case 503:
          return {
            type: 'SERVICE',
            message: 'AI service is temporarily unavailable. Please try again later.',
            retryable: true
          }
        default:
          return {
            type: 'UNKNOWN',
            message: 'An unexpected error occurred. Please try again.',
            retryable: true
          }
      }
    }

    // Handle structured error responses
    if (errorResponse.error && errorResponse.message) {
      console.log('Handling structured error response:', errorResponse.error, errorResponse.message)
      const errorType = errorResponse.error
      switch (errorType) {
        case 'AI_CONNECTION_ERROR':
          return {
            type: 'CONNECTION',
            message: 'Unable to connect to AI service. Please check your internet connection.',
            code: errorType,
            retryable: true
          }
        case 'RATE_LIMIT_ERROR':
          return {
            type: 'RATE_LIMIT',
            message: 'Too many requests. Please wait a moment and try again.',
            code: errorType,
            retryable: true
          }
        case 'AI_QUOTA_ERROR':
          return {
            type: 'SERVICE',
            message: 'AI service quota exceeded. Please contact support if this persists.',
            code: errorType,
            retryable: false
          }
        case 'SERVICE_CONFIGURATION_ERROR':
          return {
            type: 'SERVICE',
            message: 'AI service is temporarily unavailable. Please try again later.',
            code: errorType,
            retryable: true
          }
        default:
          return {
            type: 'UNKNOWN',
            message: errorResponse.message || 'An unexpected error occurred.',
            code: errorType,
            retryable: true
          }
      }
    }

    // Handle network errors
    if (errorResponse.message?.includes('fetch')) {
      console.log('Handling fetch/network error')
      return {
        type: 'CONNECTION',
        message: 'Network error. Please check your internet connection and try again.',
        retryable: true
      }
    }

    // Check if it has a message property
    if (errorResponse.message) {
      console.log('Using error message property:', errorResponse.message)
      return {
        type: 'UNKNOWN',
        message: errorResponse.message,
        retryable: true
      }
    }

    // Default error
    console.log('Using default error fallback')
    return {
      type: 'UNKNOWN',
      message: 'An unexpected error occurred. Please try again.',
      retryable: true
    }
  }

  const handleChatError = async (error: any) => {
    console.group('🔍 Chat Error Debug')
    console.log('Raw error object:', error)
    console.log('Error type:', typeof error)
    console.log('Error constructor:', error?.constructor?.name)
    console.log('Error keys:', Object.keys(error || {}))
    console.log('Error toString:', error?.toString?.())
    console.log('Error message property:', error?.message)
    console.log('Error stack:', error?.stack)
    
    // Check if it's a streaming error format (like "3:\"An error occurred.\"")
    if (typeof error === 'string' && error.match(/^\d+:".*"$/)) {
      console.log('Detected streaming error format:', error)
      const match = error.match(/^\d+:"(.*)"$/)
      if (match) {
        const streamedErrorMessage = match[1]
        console.log('Extracted streamed error message:', streamedErrorMessage)
      }
    }
    
    // Check if it's a Response object
    if (error instanceof Response) {
      console.log('Response status:', error.status)
      console.log('Response statusText:', error.statusText)
      console.log('Response headers:', Object.fromEntries(error.headers.entries()))
      
      // Try to read the response body
      error.clone().text().then(text => {
        console.log('Response body:', text)
        try {
          const jsonBody = JSON.parse(text)
          console.log('Parsed response body:', jsonBody)
        } catch {
          console.log('Response body is not JSON')
        }
      }).catch(e => console.log('Could not read response body:', e))
    }
    
    // Check for fetch errors
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      console.log('Detected fetch/network error')
    }
    
    console.groupEnd()
    
    let parsedError: ChatError
    
    try {
      // Handle streaming error format (like "3:\"An error occurred.\"")
      if (typeof error === 'string' && error.match(/^\d+:".*"$/)) {
        const match = error.match(/^\d+:"(.*)"$/)
        const streamedErrorMessage = match ? match[1] : error
        console.log('Handling streaming error:', streamedErrorMessage)
        
        parsedError = {
          type: 'SERVICE',
          message: streamedErrorMessage || 'An error occurred with the AI service. Please try again.',
          retryable: true
        }
      }
      // Handle Response objects (HTTP errors)
      else if (error instanceof Response) {
        // Try to read the response body for more details
        try {
          const errorText = await error.clone().text()
          let errorDetails = errorText
          
          try {
            const errorJson = JSON.parse(errorText)
            errorDetails = errorJson.message || errorJson.error || errorText
          } catch {
            // Not JSON, use as is
          }
          
          parsedError = {
            type: 'CONNECTION',
            message: `Request failed (${error.status}): ${errorDetails}`,
            retryable: error.status >= 500 || error.status === 429
          }
        } catch {
          parsedError = {
            type: 'CONNECTION',
            message: `Request failed with status ${error.status}: ${error.statusText}`,
            retryable: error.status >= 500 || error.status === 429
          }
        }
      }
      // Handle fetch/network errors
      else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        parsedError = {
          type: 'CONNECTION',
          message: 'Network error. Please check your internet connection and try again.',
          retryable: true
        }
      }
      // Try to parse as JSON if it's a string
      else if (typeof error === 'string') {
        try {
          const parsed = JSON.parse(error)
          console.log('Parsed string error as JSON:', parsed)
          parsedError = parseErrorResponse(parsed)
        } catch (jsonError) {
          console.log('String error is not JSON, using as-is:', error)
          parsedError = {
            type: 'UNKNOWN',
            message: error || 'An unexpected error occurred. Please try again.',
            retryable: true
          }
        }
      }
      // Handle object errors
      else if (error && typeof error === 'object') {
        console.log('Processing object error')
        parsedError = parseErrorResponse(error)
      }
      // Handle null/undefined errors
      else {
        console.log('Error is null, undefined, or primitive:', error)
        parsedError = {
          type: 'UNKNOWN',
          message: 'An unexpected error occurred. Please try again.',
          retryable: true
        }
      }
    } catch (parseError) {
      console.error('Error parsing chat error:', parseError)
      parsedError = {
        type: 'UNKNOWN',
        message: 'An unexpected error occurred. Please try again.',
        retryable: true
      }
    }
    
    console.log('Final parsed error:', parsedError)
    setChatError(parsedError)
    setRetryCount(prev => prev + 1)
  }

  const handleRetry = async () => {
    setChatError(null)
    
    try {
      // If there's a previous failed message, retry it
      if (messages.length > 1) {
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')
        if (lastUserMessage) {
          await reload()
        }
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError)
      handleChatError(retryError)
    }
  }

  const clearError = () => {
    setChatError(null)
    setRetryCount(0)
  }

  const handleOpen = () => {
    setIsAnimating(true)
    setIsOpen(true)
    setDragPosition({ x: 0, y: 0 })
    clearError() // Clear any errors when opening

    if (inputValue.trim() !== "") {
      append({ content: inputValue, role: "user" })
      setInputValue("")
    }
  }

  const handleClose = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsAnimating(false)
      clearError() // Clear errors when closing
    }, 300)
  }

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // Clear error when user starts typing
    if (chatError) {
      clearError()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== "") {
      e.preventDefault()
      handleOpen()
    }
  }

  const onSubmitChat = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    
    clearError() // Clear any existing errors
    handleSubmit(e)
  }

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    setDragPosition({ x: data.x, y: data.y })
  }

  const getErrorIcon = (errorType: ChatError['type']) => {
    switch (errorType) {
      case 'CONNECTION':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'RATE_LIMIT':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'SERVICE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <>
      {!isOpen && (
        <Draggable
          nodeRef={typingBarRef as React.RefObject<HTMLElement>} 
          position={dragPosition}
          onDrag={handleDrag}
        >
          <div
            ref={typingBarRef}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-6 z-10"
          >
            <div 
              className="flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/10 p-2 backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-blue-400/20 hover:border-blue-400/50"
            >
              <button
                type="button"
                onClick={handleOpen}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 relative group"
                aria-label="Open Chatbot"
              >
                <Cpu className="h-4 w-4 text-white" />
              </button>
              <Input
                value={inputValue}
                onChange={handleLocalInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI: 'What if my top supplier in Taiwan fails?'"
                className="h-8 flex-1 border-0 bg-transparent text-slate-800 dark:text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                size="sm"
                className="h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-3 text-white font-medium shadow-lg relative ask-button-glow transition-all duration-300 hover:scale-105"
                onClick={handleOpen}
                disabled={inputValue.trim() === ""}
              >
                Ask
              </Button>
            </div>
          </div>
        </Draggable>
      )}

      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm transition-all duration-300 px-6 py-12",
            {
              "opacity-0": isAnimating && !isOpen,
              "opacity-100": !(isAnimating && !isOpen)
            }
          )}
        >
          <div
            ref={modalRef}
            className={cn(
              "relative bg-white/30 dark:bg-slate-900/30 border border-white/20 dark:border-slate-700/20 backdrop-blur-md text-slate-800 dark:text-white rounded-lg shadow-xl transition-all duration-500 overflow-hidden",
              "chat-modal-animate"
            )}
          >
            <div className="flex items-center justify-between p-2 border-b border-blue-200/30 dark:border-blue-800/30">
              <div className="flex items-center gap-2 mt-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 pulse-animation">
                  <Cpu className="h-2.5 w-2.5 text-white" />
                </div>
                <h2 className="text-base font-semibold">AI Supply Chain Assistant</h2>
                {chatError && (
                  <div className="flex items-center gap-1 ml-2">
                    {getErrorIcon(chatError.type)}
                    <span className="text-xs text-red-500">Error</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white mt-2 h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-[calc(450px-100px)] overflow-y-auto p-3 pt-1 modal-container">
              {/* Error Alert */}
              {chatError && (
                <div className="mb-3">
                  <Alert className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      {getErrorIcon(chatError.type)}
                      <div className="flex-1">
                        <AlertDescription className="text-sm text-red-700 dark:text-red-300">
                          <strong className="font-medium">
                            {chatError.type === 'CONNECTION' && 'Connection Error'}
                            {chatError.type === 'RATE_LIMIT' && 'Rate Limited'}
                            {chatError.type === 'SERVICE' && 'Service Error'}
                            {chatError.type === 'VALIDATION' && 'Validation Error'}
                            {chatError.type === 'UNKNOWN' && 'Error'}
                          </strong>
                          <br />
                          {chatError.message}
                          {retryCount > 1 && (
                            <span className="block mt-1 text-xs opacity-75">
                              Failed attempts: {retryCount}
                            </span>
                          )}
                        </AlertDescription>
                        {chatError.retryable && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleRetry}
                              disabled={isLoading}
                              className="h-6 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={clearError}
                              className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "rounded-lg p-2.5 max-w-[80%] shadow-sm message-animate text-sm",
                      message.role === "user" 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white" 
                        : "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-800 dark:text-white"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 typing-dot typing-dot-1"></div>
                      <div className="h-2 w-2 rounded-full bg-blue-500 typing-dot typing-dot-2"></div>
                      <div className="h-2 w-2 rounded-full bg-blue-500 typing-dot typing-dot-3"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-2 border-t border-blue-200/30 dark:border-blue-800/30">
              <form onSubmit={onSubmitChat} className="flex items-center gap-2">
                <Button variant="ghost" size="icon" type="button" className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" type="button" className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 h-8 w-8">
                  <Mic className="h-4 w-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder={chatError ? "Try your message again..." : "Type your message..."}
                  className="flex-1 rounded-md bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm text-slate-800 dark:text-white text-sm placeholder:text-slate-500 border-0 focus-visible:ring-1 focus-visible:ring-blue-500 h-8"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg send-button-glow transition-all duration-300 h-8 w-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CornerDownLeft className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AIChatOverlay