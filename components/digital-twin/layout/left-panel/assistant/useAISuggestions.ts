"use client"

import { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { toast } from "sonner";
import { AISuggestion, AutocompleteSuggestion } from './types';
import { supabaseClient } from '@/lib/supabase/client';

// Simple memory cache to prevent redundant API calls within the same session
const suggestionsCache = new Map<string, any>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes — increased from 5 minutes

// Session flag: only auto-fetch once per component mount cycle per supply chain
// (re-fetches after POLL_INTERVAL if user stays on page)
const POLL_INTERVAL_SUGGESTIONS = 1000 * 60; // 60 seconds — very slow polling
const POLL_INTERVAL_AUTOCOMPLETE = 1000 * 45; // 45 seconds

interface UseAISuggestionsProps {
  nodes: Node[];
  edges: Edge[];
  messages: any[];
  supplyChainId?: string; // Used for Supabase persistence
  userId?: string;
}

export const useAISuggestions = ({ nodes, edges, messages, supplyChainId, userId }: UseAISuggestionsProps) => {
  // AI Suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Autocomplete state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  
  const suggestionTimeout = useRef<NodeJS.Timeout | null>(null);
  const autocompleteTimeout = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autocompletePollRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Generate contextual AI suggestions based on supply chain state
  const generateContextualSuggestions = useCallback(async () => {
    if (nodes.length === 0) return;

    // Check cache first
    const cacheKey = `suggestions_${nodes.length}_${edges.length}`;
    const cached = suggestionsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ AI Suggestions: Using cached suggestions');
      setSuggestions(cached.data);
      setShowSuggestions(true);
      return;
    }

    setIsSuggestionsLoading(true);
    try {
      const fullContext = {
        supply_chain: {
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            label: node.data?.label || 'Untitled',
            data: {
              description: node.data?.description,
              capacity: node.data?.capacity,
              leadTime: node.data?.leadTime,
              riskScore: node.data?.riskScore,
              location: node.data?.location,
              address: node.data?.address
            }
          })),
          totalNodes: nodes.length,
          nodeTypes: [...new Set(nodes.map(n => n.type))],
          hasConnections: edges.length > 0,
          hasRisks: nodes.some(n => n.data?.riskScore > 0.5),
          avgRiskScore: nodes.length > 0 ?
            nodes.reduce((sum, n) => sum + (n.data?.riskScore || 0), 0) / nodes.length : 0
        },
        connections: {
          connections: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            mode: edge.data?.mode || 'road',
            cost: edge.data?.cost || 0,
            transitTime: edge.data?.transitTime || 0,
            riskMultiplier: edge.data?.riskMultiplier || 1
          })),
          totalConnections: edges.length
        }
      };

      // Intelligently cut down payload to save tokens based on user requirements
      const shorterContext = {
        locations: {
          manufacturers: fullContext.supply_chain.nodes.filter(n => n.type?.toLowerCase().includes('manufactur') || n.type?.toLowerCase().includes('factory')).map(n => ({ name: n.label, loc: n.data.address || n.data.location })),
          producers: fullContext.supply_chain.nodes.filter(n => n.type?.toLowerCase().includes('produc') || n.type?.toLowerCase().includes('supplier')).map(n => ({ name: n.label, loc: n.data.address || n.data.location })),
          retailers_dealers: fullContext.supply_chain.nodes.filter(n => n.type?.toLowerCase().includes('retail') || n.type?.toLowerCase().includes('distribut') || n.type?.toLowerCase().includes('dealer')).map(n => ({ name: n.label, loc: n.data.address || n.data.location })),
        },
        nodeTypes: fullContext.supply_chain.nodeTypes,
        costs: fullContext.connections.connections.map(c => c.cost).filter(cost => cost > 0)
      };

      const prompt = `Generate general proactive suggestions for this supply chain graph.

Supply Chain Graph Context:
${JSON.stringify(shorterContext)}

If the graph is empty or has fewer than 2 nodes, return an empty suggestions array.
Otherwise, follow the SYSTEM PROMPT rules exactly.`;

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.suggestions) {
          console.log('✅ AI Suggestions: Received suggestions:', data.suggestions);
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
          suggestionsCache.set(cacheKey, { data: data.suggestions, timestamp: Date.now() });

          // Persist to Supabase if we have the necessary IDs
          if (supplyChainId && userId) {
            try {
              const client = supabaseClient;
              if (client) {
                await (client as any)
                  .from('ai_suggestions')
                  .upsert({
                    supply_chain_id: supplyChainId,
                    user_id: userId,
                    suggestions: data.suggestions,
                    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // 24h TTL
                  }, { onConflict: 'supply_chain_id,user_id' });
              }
            } catch (dbError) {
              // Silently fail — persistence is a bonus, not required
              console.warn('AI Suggestions: Could not persist to Supabase:', dbError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [nodes, edges, supplyChainId, userId]);

  // Generate context-based autocomplete suggestions
  const generateContextualAutocompleteSuggestions = useCallback(async () => {
    // Check cache first
    const numMessages = messages.length;
    const cacheKey = `autocomplete_${nodes.length}_${edges.length}_${numMessages}`;
    const cached = suggestionsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ AI Suggestions: Using cached autocomplete');
      setAutocompleteSuggestions(cached.data);
      return;
    }

    setIsAutocompleteLoading(true);
    try {
      const fullContext = {
        supply_chain: {
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            label: node.data?.label || 'Untitled',
            data: {
              description: node.data?.description,
              capacity: node.data?.capacity,
              leadTime: node.data?.leadTime,
              riskScore: node.data?.riskScore,
            }
          })),
          totalNodes: nodes.length,
          nodeTypes: [...new Set(nodes.map(n => n.type))],
          hasConnections: edges.length > 0
        },
        connections: {
          totalConnections: edges.length
        },
        recent_conversation: messages.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content ? msg.content.substring(0, 200) : ''
        }))
      };

      // Intelligently cut down payload to save tokens
      const shorterContext = {
        locations: {
          manufacturers: fullContext.supply_chain.nodes.filter(n => n.type?.toLowerCase().includes('manufactur') || n.type?.toLowerCase().includes('factory')).map(n => ({ name: n.label })),
          producers: fullContext.supply_chain.nodes.filter(n => n.type?.toLowerCase().includes('produc') || n.type?.toLowerCase().includes('supplier')).map(n => ({ name: n.label })),
          retailers_dealers: fullContext.supply_chain.nodes.filter(n => n.type?.toLowerCase().includes('retail') || n.type?.toLowerCase().includes('distribut') || n.type?.toLowerCase().includes('dealer')).map(n => ({ name: n.label })),
        },
        recent_conversation: fullContext.recent_conversation
      };

      const prompt = `Generate contextual autocomplete/next-step suggestions.

Current Graph State:
${JSON.stringify(shorterContext.locations)}

Recent Conversation History:
${JSON.stringify(shorterContext.recent_conversation)}

If the user just ran a simulation or impact analysis, suggest next-step commands (e.g., 'Generate mitigation strategy', 'Calculate financial loss').
If the graph is empty, suggest node creation commands.
Limit to 3–4 highly relevant suggestions.`;

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.suggestions) {
          const autocompleteSugs = data.suggestions.map((suggestion: any, index: number) => ({
            id: suggestion.id || `contextual-${index}`,
            text: suggestion.title || suggestion.text || suggestion.action,
            description: suggestion.description,
            action: suggestion.action,
            type: 'suggestion' as const,
            confidence: suggestion.confidence || 75
          }));
          setAutocompleteSuggestions(autocompleteSugs);
          suggestionsCache.set(cacheKey, { data: autocompleteSugs, timestamp: Date.now() });
        }
      }
    } catch (error) {
      console.error('Error generating contextual autocomplete:', error);
    } finally {
      setIsAutocompleteLoading(false);
    }
  }, [nodes, edges, messages]);

  // ─── Event-Driven Triggers (Replaces Background Polling) ────────────
  
  // Trigger general suggestions only when the canvas (nodes/edges) changes
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // Wait 10 seconds after the user stops modifying the canvas before fetching
    if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
    suggestionTimeout.current = setTimeout(() => {
      generateContextualSuggestions();
    }, 10000);

    return () => {
      if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
    };
  }, [nodes, edges, generateContextualSuggestions]);

  // Trigger autocomplete suggestions only when the conversation updates
  useEffect(() => {
    if (nodes.length === 0) return;

    // Wait 3 seconds after a new message is added before predicting next questions
    if (autocompleteTimeout.current) clearTimeout(autocompleteTimeout.current);
    autocompleteTimeout.current = setTimeout(() => {
      generateContextualAutocompleteSuggestions();
    }, 3000);

    return () => {
      if (autocompleteTimeout.current) clearTimeout(autocompleteTimeout.current);
    };
  }, [messages.length, generateContextualAutocompleteSuggestions]);

  // ─── Supabase Realtime subscription for live suggestion updates ────────────
  useEffect(() => {
    if (!supplyChainId || !userId) return;

    let channel: any;
    try {
      const client = supabaseClient as any;
      if (!client?.channel) return;

      channel = client
        .channel(`ai_suggestions:${supplyChainId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ai_suggestions',
            filter: `supply_chain_id=eq.${supplyChainId}`
          },
          (payload: any) => {
            console.log('📡 Realtime: Received new AI suggestions from Supabase', payload);
            const newSuggestions = payload.new?.suggestions;
            if (Array.isArray(newSuggestions) && newSuggestions.length > 0) {
              setSuggestions(newSuggestions);
              setShowSuggestions(true);
            }
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
    } catch (err) {
      console.warn('AI Suggestions: Realtime subscription failed (table may not exist yet):', err);
    }

    return () => {
      if (realtimeChannelRef.current) {
        try {
          (supabaseClient as any)?.removeChannel(realtimeChannelRef.current);
        } catch (_) { /* ignore cleanup errors */ }
        realtimeChannelRef.current = null;
      }
    };
  }, [supplyChainId, userId]);

  // Debounced suggestion generators (kept for manual triggers)
  const debouncedGenerateSuggestions = useCallback(() => {
    if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
    suggestionTimeout.current = setTimeout(() => {
      if (nodes.length > 0) generateContextualSuggestions();
    }, 15000);
  }, [nodes, edges, generateContextualSuggestions]);

  const debouncedContextualSuggestions = useCallback(() => {
    if (autocompleteTimeout.current) clearTimeout(autocompleteTimeout.current);
    autocompleteTimeout.current = setTimeout(() => {
      generateContextualAutocompleteSuggestions();
    }, 10000);
  }, [generateContextualAutocompleteSuggestions]);

  return {
    suggestions,
    setSuggestions,
    isSuggestionsLoading,
    showSuggestions,
    setShowSuggestions,
    autocompleteSuggestions,
    setAutocompleteSuggestions,
    isAutocompleteLoading,
    generateContextualSuggestions,
    debouncedContextualSuggestions
  };
};