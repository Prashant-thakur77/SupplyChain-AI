import { useCallback } from 'react';
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { toast } from "sonner";
import pako from 'pako';

interface ChatPersistenceHook {
  saveChatToStorage: (messages: TextMessage[], twinId: string) => void;
  loadChatFromStorage: (twinId: string) => TextMessage[];
  clearChatFromStorage: (twinId: string) => void;
  getLocalStorageInfo: (twinId?: string) => { totalKB: number; chatKB: number; usagePercent: number };
  cleanupOldChats: () => void;
}

export const useChatPersistence = (): ChatPersistenceHook => {
  // Compression utilities for chat messages
  const compressChatData = useCallback((data: any): string => {
    try {
      // Convert to JSON string
      const jsonString = JSON.stringify(data);
      
      // Compress using gzip
      const compressed = pako.gzip(jsonString);
      
      // Convert to base64
      const base64 = btoa(String.fromCharCode(...compressed));
      
      // Add version prefix for future compatibility
      return `v1:${base64}`;
    } catch (error) {
      console.error('❌ Error compressing chat data:', error);
      // Fallback to uncompressed JSON
      return JSON.stringify(data);
    }
  }, []);

  const decompressChatData = useCallback((compressedData: string): any => {
    try {
      let dataToDecompress = compressedData;
      
      // Check for version prefix
      if (compressedData.startsWith('v1:')) {
        dataToDecompress = compressedData.substring(3);
        
        // Decode base64 to binary
        const binaryString = atob(dataToDecompress);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Decompress using gzip
        const decompressed = pako.ungzip(bytes, { to: 'string' });
        
        // Parse JSON
        return JSON.parse(decompressed);
      } else {
        // Fallback: try to parse as uncompressed JSON (backward compatibility)
        return JSON.parse(compressedData);
      }
    } catch (error) {
      console.error('❌ Error decompressing chat data:', error);
      
      // Final fallback: try to parse as regular JSON
      try {
        return JSON.parse(compressedData);
      } catch (fallbackError) {
        console.error('❌ Fallback decompression also failed:', fallbackError);
        return [];
      }
    }
  }, []);

  // Generate storage key from twinId
  const getChatStorageKey = useCallback((twinId: string) => {
    return twinId ? `ai-chat-${twinId}` : null;
  }, []);

  // Utility to check localStorage usage
  const getLocalStorageInfo = useCallback((twinId?: string) => {
    try {
      // Calculate total localStorage usage
      let totalSize = 0;
      for (let key in localStorage) {
        if (Object.hasOwn(localStorage, key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      
      // Get current chat size
      let chatSize = 0;
      if (twinId) {
        const storageKey = getChatStorageKey(twinId);
        if (storageKey) {
          const chatData = localStorage.getItem(storageKey);
          if (chatData) {
            chatSize = chatData.length + storageKey.length;
          }
        }
      }
      
      // Convert to KB
      const totalKB = Math.round(totalSize / 1024 * 100) / 100;
      const chatKB = Math.round(chatSize / 1024 * 100) / 100;
      const maxKB = 5120; // 5MB typical localStorage limit
      const usagePercent = Math.round((totalKB / maxKB) * 100);
      
      console.log(`📊 localStorage Usage: ${totalKB}KB / ${maxKB}KB (${usagePercent}%)`);
      console.log(`💬 Current chat size: ${chatKB}KB`);
      
      return { totalKB, chatKB, usagePercent };
    } catch (error) {
      console.error('❌ Failed to calculate localStorage usage:', error);
      return { totalKB: 0, chatKB: 0, usagePercent: 0 };
    }
  }, [getChatStorageKey]);

  // Clean up old chat sessions to free space
  const cleanupOldChats = useCallback(() => {
    try {
      const chatKeys = [];
      for (let key in localStorage) {
        if (key.startsWith('ai-chat-') && Object.hasOwn(localStorage, key)) {
          chatKeys.push(key);
        }
      }
      
      // Keep only the 10 most recent chats (based on key names)
      if (chatKeys.length > 10) {
        const sorted = chatKeys.sort().reverse(); // Most recent first
        const toDelete = sorted.slice(10); // Remove oldest
        
        toDelete.forEach(key => {
          localStorage.removeItem(key);
          console.log('🧹 Cleaned up old chat:', key);
        });
        
        toast.success(`Cleaned up ${toDelete.length} old chat sessions`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old chats:', error);
    }
  }, []);

  // Save chat to localStorage with compression
  const saveChatToStorage = useCallback((messages: TextMessage[], twinId: string) => {
    const storageKey = getChatStorageKey(twinId);
    if (!storageKey) return;
    
    try {
      // Only store essential message data to avoid circular references
      const messagesToStore = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: Date.now()
      }));
      
      // Calculate original size
      const originalData = JSON.stringify(messagesToStore);
      const originalSize = originalData.length;
      
      // Compress the data
      const compressedData = compressChatData(messagesToStore);
      const compressedSize = compressedData.length;
      
      // Calculate compression ratio
      const compressionRatio = Math.round((compressedSize / originalSize) * 100);
      
      localStorage.setItem(storageKey, compressedData);
      console.log(`💾 Chat saved to localStorage with key: ${storageKey}`);
      console.log(`🗜️ Compression: ${originalSize} → ${compressedSize} chars (${compressionRatio}% of original)`);
      
             // Log storage usage info and warn if usage is high
      setTimeout(() => {
        const storageInfo = getLocalStorageInfo(twinId);
        if (storageInfo.usagePercent > 80) {
          toast.warning(`localStorage is ${storageInfo.usagePercent}% full. Consider clearing old chats.`, {
            action: {
              label: "Clean Up",
              onClick: () => cleanupOldChats()
            }
          });
        }
      }, 100);
    } catch (error) {
      console.error('❌ Failed to save chat to localStorage:', error);
    }
  }, [getChatStorageKey, compressChatData, getLocalStorageInfo, cleanupOldChats]);

  // Load chat from localStorage with decompression
  const loadChatFromStorage = useCallback((twinId: string): TextMessage[] => {
    const storageKey = getChatStorageKey(twinId);
    if (!storageKey) return [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        // Decompress the data
        const parsedMessages = decompressChatData(stored);
        console.log('📁 Chat loaded from localStorage with key:', storageKey);
        console.log('📦 Loaded messages count:', parsedMessages.length);
        
        // Convert back to TextMessage format
        return parsedMessages.map((msg: any) => new TextMessage({
          id: msg.id,
          content: msg.content,
          role: msg.role
        }));
      }
    } catch (error) {
      console.error('❌ Failed to load chat from localStorage:', error);
    }
    return [];
  }, [getChatStorageKey, decompressChatData]);

  // Clear chat from localStorage
  const clearChatFromStorage = useCallback((twinId: string) => {
    const storageKey = getChatStorageKey(twinId);
    if (!storageKey) return;
    
    try {
      localStorage.removeItem(storageKey);
      console.log('🗑️ Chat cleared from localStorage with key:', storageKey);
    } catch (error) {
      console.error('❌ Failed to clear chat from localStorage:', error);
    }
  }, [getChatStorageKey]);

  return {
    saveChatToStorage,
    loadChatFromStorage,
    clearChatFromStorage,
    getLocalStorageInfo,
    cleanupOldChats
  };
}; 