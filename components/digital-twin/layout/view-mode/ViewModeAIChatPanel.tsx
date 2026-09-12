"use client"

import { useState, useEffect, useCallback } from 'react';
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { Node, Edge } from 'reactflow';
import { toast } from "sonner";
import { useQueryState } from 'nuqs';
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from 'next/navigation';

// Import components from the main chat panel
import { MessagesArea } from '../left-panel/assistant/MessagesArea';
import { AutocompleteInput } from '../left-panel/assistant/AutocompleteInput';
import { useAISuggestions } from '../left-panel/assistant/useAISuggestions';
import { useChatPersistence } from '../left-panel/assistant/hooks/useChatPersistence';
import { parseError } from '../left-panel/assistant/error-parser';
import { AutocompleteSuggestion, ChatError } from '../left-panel/assistant/types';
import { decompressArchData } from '@/lib/utils/url-compression';

interface ViewModeAIChatPanelProps {
  nodes?: Node[];
  edges?: Edge[];
}

const ViewModeAIChatPanel: React.FC<ViewModeAIChatPanelProps> = ({ 
  nodes: propNodes = [],
  edges: propEdges = [],
}) => {
  // Collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Local input state
  const [input, setInput] = useState<string>("");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  
  // Error state management
  const [chatError, setChatError] = useState<ChatError | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  
  // Track if we've loaded from storage
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Get URL state to read current canvas data
  const [archParam] = useQueryState('arch', {
    defaultValue: '',
    shallow: false
  });

  // Get twinId from URL params for localStorage key
  const params = useParams();
  const twinId = (params.id as string) ?? '';

  // State for nodes and edges from URL
  const [urlNodes, setUrlNodes] = useState<Node[]>([]);
  const [urlEdges, setUrlEdges] = useState<Edge[]>([]);

  // Decode nodes and edges from URL parameter
  useEffect(() => {
    const decodeFromURL = async () => {
      if (archParam) {
        try {
          const canvasData = decompressArchData(archParam);
          if (canvasData.nodes && canvasData.edges) {
            setUrlNodes(canvasData.nodes);
            setUrlEdges(canvasData.edges);
          } else {
            setUrlNodes([]);
            setUrlEdges([]);
          }
        } catch (error) {
          console.error('❌ View Mode Chat: Failed to decode canvas state from URL:', error);
          setUrlNodes([]);
          setUrlEdges([]);
        }
      } else {
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

  // CopilotKit chat integration
  const copilotChat = useCopilotChat();
  const {
    visibleMessages,
    appendMessage,
    isLoading,
  } = copilotChat;
  
  const setMessages = (copilotChat as any).setMessages;
  
  const messages = visibleMessages as TextMessage[];

  // Load chat from localStorage when twinId is available
  useEffect(() => {
    if (twinId && setMessages && !hasLoadedFromStorage) {
      const storedMessages = loadChatFromStorage(twinId);
      if (storedMessages.length > 0) {
        console.log('📁 Loading stored chat messages for view mode twinId:', twinId);
        setMessages(storedMessages);
      }
      setHasLoadedFromStorage(true);
    }
  }, [twinId, setMessages, hasLoadedFromStorage, loadChatFromStorage]);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    if (twinId && messages?.length > 0 && hasLoadedFromStorage) {
      const timer = setTimeout(() => {
        saveChatToStorage(messages, twinId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [twinId, messages, hasLoadedFromStorage, saveChatToStorage]);

  // Use AI suggestions hook (simplified for view mode)
  const { autocompleteSuggestions } = useAISuggestions({
    nodes,
    edges,
    messages
  });

  // Error handling functions
  const handleChatError = (error: any, failedMessage?: string) => {
    if (errorCount > 3) {
      toast.error('Multiple AI errors occurred. Please check your connection or try again later.');
      return;
    }

    const parsedError = parseError(error);
    if (!parsedError) return;
    
    setErrorCount(prev => prev + 1);
    setChatError(parsedError);
    if (failedMessage) {
      setLastFailedMessage(failedMessage);
    }
    
    toast.error(`AI Error: ${parsedError.message}`);
  };

  const clearError = () => {
    setChatError(null);
    setLastFailedMessage(null);
  };

  const handleRetryError = async () => {
    if (!lastFailedMessage) return;
    
    console.log('🔄 Retrying failed message:', lastFailedMessage);
    clearError();
    
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
    const insertText = suggestion.description && suggestion.action 
      ? `${suggestion.description} ${suggestion.action}`
      : suggestion.text;
    setInput(insertText);
  };

  const handleClearChat = () => {
    try {
      if (setMessages) {
        setMessages([]);
      }
      
      clearChatFromStorage(twinId);
      setHasLoadedFromStorage(false);
      clearError();
      
      toast.success("Chat cleared successfully");
      console.log("✅ Chat cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing chat:", error);
      toast.error("Failed to clear chat");
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="flex h-full bg-background border-r border-border"
        initial={{ width: 320 }}
        animate={{ width: isCollapsed ? 48 : 320 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Collapsed State */}
        {isCollapsed && (
          <motion.div 
            className="w-12 h-full flex flex-col items-center justify-start pt-4 bg-muted/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="p-2 h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="mt-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </motion.div>
        )}

        {/* Expanded State */}
        {!isCollapsed && (
          <motion.div 
            className="flex flex-col h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                <h2 className="text-sm font-semibold text-foreground truncate">AI Assistant</h2>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCollapse}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                  aria-label="Collapse panel"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Clear Chat Button */}
            <div className="flex justify-end p-2 border-b border-border/50 flex-shrink-0">
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

            {/* Messages Area - Uses flex-1 to take available space */}
            <div className="flex-1 overflow-hidden">
              <MessagesArea
                messages={messages}
                isLoading={isLoading}
                isImmersiveMode={false}
                messagesHeight="100%"
                error={chatError}
                onRetryError={handleRetryError}
                onDismissError={clearError}
                retryCount={0}
              />
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t border-border/50 flex-shrink-0">
              <AutocompleteInput
                input={input}
                setInput={value => {
                  setInput(value);
                  if (chatError && value.trim()) {
                    clearError();
                  }
                }}
                onSubmit={message => {
                  saveQuery(message);
                  handleAISubmit(message);
                  setInput('');
                }}
                isLoading={isLoading}
                autocompleteSuggestions={autocompleteSuggestions}
                recentQueries={recentQueries}
                onAutocompleteSelect={handleAutocompleteSelect}
                showRecentInHeader={false}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ViewModeAIChatPanel; 