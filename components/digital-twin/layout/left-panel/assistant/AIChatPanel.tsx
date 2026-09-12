"use client"

import { useState,  useEffect, useCallback } from 'react';
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { Node, Edge } from 'reactflow';
import { toast } from "sonner";
import { useQueryState } from 'nuqs';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useUser } from '@/lib/stores/user';

// Import our smaller components
import { ImmersiveHeader } from './ImmersiveHeader';
import { MessagesArea } from './MessagesArea';
import { AutocompleteInput } from './AutocompleteInput';
import { AISuggestionsInsights } from './AISuggestionsInsights';
import { useCopilotActions } from './useCopilotActions';
import { useAISuggestions } from './useAISuggestions';
import { useChatPersistence } from './hooks/useChatPersistence';
import { parseError } from './error-parser';
import { AIChatPanelProps, AutocompleteSuggestion, ChatError } from './types';
import { decompressArchData } from '@/lib/utils/url-compression';

const AIChatPanel: React.FC<AIChatPanelProps> = ({ 
  simulationMode = false, 
  onImmersiveModeChange,
  isImmersiveMode = false,
  onCollapse,
  nodes: propNodes = [],
  edges: propEdges = [],
  onAddNode,
  onAddMultipleNodes,
  onAddMultipleEdges,
  onAddEdges,
  onLoadTemplate,
  onClearCanvas,
  onUpdateNode,
  onDeleteNode,
  onUpdateEdge,
  onValidateSupplyChain,
  onUpdateMultipleNodes,
  onUpdateNodePositions,
  onFindAndSelectNode,
  onFindAndSelectEdges,
  onHighlightNodes,
  onFocusNode,
  onZoomToNodes,
  onGetNodeConnections,
  onAnalyzeNetworkPaths,
  onBulkUpdateEdges,
  onCreateNodeGroup,
  onExportSubgraph,
  pendingAIMessage,
  setPendingAIMessage,
}) => {
  // Local input state with safe initialization
  const [input, setInput] = useState<string>("");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [showRecentInHeader, setShowRecentInHeader] = useState(false);
  
  // Web search state
  const [internetSearch, setInternetSearch] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Error state management
  const [chatError, setChatError] = useState<ChatError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  
  // Track if we've loaded from storage to prevent re-loading
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Get logged-in user for Supabase suggestion persistence
  const { userData } = useUser();

  // Get URL state to read current canvas data
  const [archParam] = useQueryState('arch', {
    defaultValue: '',
    shallow: false
  });

  // Get twinId from URL for localStorage key
  const [twinId] = useQueryState('twinId', {
    defaultValue: '',
    shallow: false
  });

  // State for nodes and edges from URL
  const [urlNodes, setUrlNodes] = useState<Node[]>([]);
  const [urlEdges, setUrlEdges] = useState<Edge[]>([]);

  // Decode nodes and edges from URL parameter
  useEffect(() => {
    const decodeFromURL = async () => {
      if (archParam) {
        try {
          console.log(' AI Chat Panel: Decompressing canvas state from URL');
          const canvasData = decompressArchData(archParam);

          if (canvasData.nodes && canvasData.edges) {
            console.log(' AI Chat Panel: Setting nodes and edges from URL', {
              nodesCount: canvasData.nodes.length,
              edgesCount: canvasData.edges.length
            });
            setUrlNodes(canvasData.nodes);
            setUrlEdges(canvasData.edges);
          } else {
            console.log(' AI Chat Panel: No canvas data in URL, using empty arrays');
            setUrlNodes([]);
            setUrlEdges([]);
          }
        } catch (error) {
          console.error(' AI Chat Panel: Failed to decode canvas state from URL:', error);
          setUrlNodes([]);
          setUrlEdges([]);
        }
      } else {
        console.log(' AI Chat Panel: No URL parameter, using empty arrays');
        setUrlNodes([]);
        setUrlEdges([]);
      }
    };

    decodeFromURL();
  }, [archParam]);

  // Use URL nodes/edges if available, otherwise fall back to props
  const nodes = urlNodes.length > 0 ? urlNodes : propNodes;
  const edges = urlEdges.length > 0 ? urlEdges : propEdges;

  // Chat persistence hook
  const {
    saveChatToStorage,
    loadChatFromStorage,
    clearChatFromStorage,
    getLocalStorageInfo,
    cleanupOldChats
  } = useChatPersistence();

  // Load recent queries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ai-recent-queries');
    if (stored) {
      setRecentQueries(JSON.parse(stored));
    }
  }, []);

  const saveQuery = useCallback((query: string) => {
    const updated = [query, ...recentQueries.filter(q => q !== query)].slice(0, 10);
    setRecentQueries(updated);
    localStorage.setItem('ai-recent-queries', JSON.stringify(updated));
  }, [recentQueries]);

  // CopilotKit chat integration with strict persona enforcement
  const copilotChat = useCopilotChat({
    makeSystemMessage: (contextString, additionalInstructions) => `
      You are SupplyChain AI, an elite, highly professional supply chain operations and digital twin assistant.
      Your sole purpose is to analyze supply chains, optimize logistics, identify risks, and simulate disruptions.

      STRICT BOUNDARIES:
      1. You must ONLY answer questions related to supply chains, logistics, manufacturing, operations, or the Digital Twin canvas you are analyzing.
      2. If the user asks ANY question outside of this scope (including coding, math riddles, general trivia, writing essays, or playing games), you MUST refuse.
      3. Do NOT attempt to answer the out-of-scope question. Reply exactly with: "I am a specialized supply chain operations assistant. I cannot assist with requests outside of supply chain management, logistics, and digital twin analysis."
      4. Never identify yourself as a general-purpose AI or an LLM trained by Google. You are SupplyChain AI.

      Context:
      ${contextString}

      Additional Instructions:
      ${additionalInstructions || ''}
    `
  });
  
  const {
    visibleMessages,
    appendMessage,
    isLoading,
  } = copilotChat;
  
  // These properties might not exist in the current CopilotKit version types
  const setMessages = (copilotChat as any).setMessages;
  const deleteMessage = (copilotChat as any).deleteMessage;
  
  // Use CopilotKit messages as the source of truth
  const messages = (visibleMessages || []) as TextMessage[];

  // Load chat from localStorage when twinId is available
  useEffect(() => {
    if (twinId && setMessages && !hasLoadedFromStorage) {
      const storedMessages = loadChatFromStorage(twinId);
      if (storedMessages.length > 0) {
        console.log('📁 Loading stored chat messages for twinId:', twinId);
        if (typeof setMessages === 'function') {
          setMessages(storedMessages);
        }
      }
      setHasLoadedFromStorage(true);
    }
  }, [twinId, setMessages, hasLoadedFromStorage, loadChatFromStorage]);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    if (twinId && messages.length > 0 && hasLoadedFromStorage) {
      // Only save if we've finished loading from storage and have messages
      // Small delay to avoid saving during rapid changes
      const timer = setTimeout(() => {
        saveChatToStorage(messages, twinId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [twinId, messages, hasLoadedFromStorage, saveChatToStorage]);

  // Note: Removed window.fetch interceptor — it was reading the response body twice (bug)
  // and logging verbose CopilotKit internals unnecessarily.

  // Use our custom hooks
  const { } = useCopilotActions({
    nodes,
    edges,
    onAddNode,
    onAddMultipleNodes,
    onAddMultipleEdges,
    onLoadTemplate,
    onClearCanvas,
    onUpdateNode,
    onDeleteNode,
    onUpdateEdge,
    onValidateSupplyChain,
    onUpdateMultipleNodes,
    onUpdateNodePositions,
    onFindAndSelectNode,
    onFindAndSelectEdges,
    onHighlightNodes,
    onFocusNode,
    onZoomToNodes,
    onGetNodeConnections,
    onAnalyzeNetworkPaths,
    onBulkUpdateEdges,
    onCreateNodeGroup,
    onExportSubgraph,
  });

  const {
    suggestions,
    isSuggestionsLoading,
    showSuggestions,
    setShowSuggestions,
    autocompleteSuggestions,
    debouncedContextualSuggestions
  } = useAISuggestions({
    nodes,
    edges,
    messages,
    supplyChainId: twinId || undefined,
    userId: userData?.id || undefined,
  });

  // Removed auto-generation of suggestions in immersive mode to save API quota.

    // Handle pending AI messages from validation dialog
  useEffect(() => {
    if (pendingAIMessage && setPendingAIMessage) {
      const timer = setTimeout(async () => {
        console.log('🤖 Sending pending AI message:', pendingAIMessage);
        
        // Save the query for history
        saveQuery(pendingAIMessage);
        
        // Cache the message locally and clear state synchronously BEFORE sending
        // This prevents the useEffect from re-triggering if appendMessage causes a re-render
        const messageToSend = pendingAIMessage;
        setInput('');
        setPendingAIMessage(null);
        console.log('🧹 Input cleared and pending message removed');
        
        // Send the message using CopilotKit
        try {
          await appendMessage(new TextMessage({ 
            content: messageToSend, 
            role: Role.User 
          }));
          console.log('✅ Pending AI message sent successfully');
        } catch (error) {
          console.error('❌ Failed to send pending AI message:', error);
        }
      }, 300); // Small delay to ensure UI is ready
      
      return () => clearTimeout(timer);
    }
   }, [pendingAIMessage, setPendingAIMessage, setInput, saveQuery, appendMessage]);

  // Global error handler for CopilotKit
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      console.log('🚨 Global error caught in AIChatPanel:', error);
      
      // Check if this is a CopilotKit related error
      if (event.filename?.includes('copilot') || 
          error?.message?.includes('copilot') ||
          error?.message?.includes('gemini') ||
          error?.stack?.includes('copilot')) {
        handleChatError(error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      console.log('🚨 Unhandled promise rejection in AIChatPanel:', error);
      
      // Check if this is a CopilotKit related rejection
      if (error?.message?.includes('copilot') ||
          error?.message?.includes('gemini') ||
          error?.stack?.includes('copilot')) {
        handleChatError(error);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Calculate dynamic height based on message content length
  const calculateMessagesHeight = () => {
    if (isImmersiveMode) {
      return 'calc(100vh - 250px)';
    }
    
    if (messages.length === 0) return 120;
    
    let totalHeight = 40;
    
    messages.forEach((message) => {
      const charsPerLine = 30;
      const messageLength = message.content.length;
      const estimatedLines = Math.max(1, Math.ceil(messageLength / charsPerLine));
      const lineHeight = 18;
      const messageHeight = estimatedLines * lineHeight + 20;
      
      totalHeight += messageHeight + 8;
    });
    
    if (isLoading) {
      totalHeight += 40;
    }
    
    const minHeight = 120;
    const maxHeight = 400;
    
    return Math.max(minHeight, Math.min(maxHeight, totalHeight));
  };

  // Error handling functions

  const handleChatError = (error: any, failedMessage?: string) => {
    if (errorCount > 3) {
      toast.error('Multiple AI errors occurred. Please check your connection or try again later.');
      return;
    }

    const parsedError = parseError(error);

    // If the error is benign (e.g., abort), do nothing
    if (!parsedError) {
      return;
    }
    
    // Set the error state
    setErrorCount(prev => prev + 1);
    setChatError(parsedError);
    if (failedMessage) {
      setLastFailedMessage(failedMessage);
    }
    
    // Show toast notification for errors
    toast.error(`AI Error: ${parsedError.message}`);
  };

  const clearError = () => {
    setChatError(null);
    setRetryCount(0);
    setLastFailedMessage(null);
  };

  const handleRetryError = async () => {
    if (!lastFailedMessage) return;
    
    console.log('🔄 Retrying failed message:', lastFailedMessage);
    clearError();
    
    // Wait a moment before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await appendMessage(new TextMessage({ 
        content: lastFailedMessage, 
        role: Role.User 
      }));
      console.log("✅ Retry successful");
    } catch (error) {
      console.error("❌ Retry failed:", error);
      handleChatError(error, lastFailedMessage);
    }
  };

  const handleAISubmit = async (message: string) => {
    // Clear any existing errors
    clearError();
    
    try {
      await appendMessage(new TextMessage({ 
        content: message, 
        role: Role.User 
      }));
      console.log("✅ Message sent to CopilotKit successfully");
    } catch (error) {
      console.error("❌ Error sending message to CopilotKit:", error);
      handleChatError(error, message);
    }
  };

  const handleAutocompleteSelect = (suggestion: AutocompleteSuggestion) => {
    // If the suggestion has both description and action, combine them
    // Otherwise, fall back to the text field
    const insertText = suggestion.description && suggestion.action 
      ? `${suggestion.description} ${suggestion.action}`
      : suggestion.text;
    setInput(insertText);
  };

  const handleExitImmersiveMode = () => {
    onImmersiveModeChange?.(false);
  };

  const handleClearChat = () => {
    try {
      // Clear messages using CopilotKit method if available
      if (setMessages) {
        setMessages([]);
      } else if (deleteMessage) {
        // Alternative: try to clear by deleting all messages
        // Delete from end to beginning to avoid index issues
        if (typeof deleteMessage === 'function') {
          for (let i = messages.length - 1; i >= 0; i--) {
            deleteMessage(messages[i].id || i.toString());
          }
        }
      }
      
      // Clear chat from localStorage
      clearChatFromStorage(twinId);
      
      // Reset storage loading state
      setHasLoadedFromStorage(false);
      
      // Clear any error state
      clearError();
      
      // Show success toast
      toast.success("Chat cleared successfully");
      
      console.log("✅ Chat cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing chat:", error);
      toast.error("Failed to clear chat");
    }
  };

  const messagesHeight = calculateMessagesHeight();

  return (
    <div className="flex flex-col h-full bg-background relative">
      <ImmersiveHeader
        onExit={handleExitImmersiveMode}
        onCollapse={onCollapse}
        internetSearch={internetSearch}
        setInternetSearch={setInternetSearch}
        isSearching={isSearching}
      />
      <div className="flex-grow overflow-y-auto">
        {/* Clear Chat Button */}
        <div className="flex justify-end p-2 border-b border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            disabled={isLoading || messages.length === 0}
            className="text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Chat
          </Button>
        </div>

        {/* Actionable AI Insights */}
        {showSuggestions && (
          <AISuggestionsInsights
            suggestions={suggestions}
            isLoading={isSuggestionsLoading}
            onDismiss={() => setShowSuggestions(false)}
            onApply={(suggestion) => {
              const query = `Strategic analysis: ${suggestion.title}. ${suggestion.description} ${suggestion.action}`;
              setInput(query);
              handleAISubmit(query);
              // Auto-collapse after applying to save vertical space
              setShowSuggestions(false);
            }}
          />
        )}

        {/* Messages Area - Full Height */}
        <MessagesArea
          messages={messages}
          isLoading={isLoading}
          isImmersiveMode={isImmersiveMode}
          messagesHeight={messagesHeight}
          error={chatError}
          onRetryError={handleRetryError}
          onDismissError={clearError}
          retryCount={retryCount}
        />
      </div>

      {/* Input Area - Fixed at Bottom */}
      <AutocompleteInput
        input={input}
        setInput={value => {
          setInput(value);
          // Clear error when user starts typing
          if (chatError && value.trim()) {
            clearError();
          }
        }}
        onSubmit={message => {
          saveQuery(message);
          handleAISubmit(message);
          // Clear input immediately after submitting
          setInput('');
        }}
        isLoading={isLoading}
        autocompleteSuggestions={autocompleteSuggestions}
        recentQueries={recentQueries}
        onAutocompleteSelect={handleAutocompleteSelect}
        showRecentInHeader={showRecentInHeader}
      />
    </div>
  );
};

export default AIChatPanel; 