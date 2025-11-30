import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchMessagesFromBackend, saveMessageToBackend, deleteMessageFromBackend } from './supabaseClient';

export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    publicUrl?: string;
  }>;
}

const STORAGE_KEY = 'ti_ai_chats_v1';
const SYNC_ENABLED = true; // Toggle Supabase sync

function readStorage(): Record<string, ChatMessage[]> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ChatMessage[]>;
  } catch (e) {
    console.error('Failed to read chat storage', e);
    return {};
  }
}

function writeStorage(data: Record<string, ChatMessage[]>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Failed to write chat storage', e);
  }
}

// Simple per-session user id (persisted) so chats can be grouped per user on the same browser
export function getOrCreateUserId(): string {
  try {
    if (typeof window === 'undefined') return 'anonymous';
    let id = localStorage.getItem('ti_user_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('ti_user_id', id);
    }
    return id as string;
  } catch (e) {
    console.error('Failed to get/create user id', e);
    return 'anonymous';
  }
}

export function loadChatsForUser(userId: string): ChatMessage[] {
  const store = readStorage();
  return store[userId] || [];
}

export function saveChatsForUser(userId: string, messages: ChatMessage[]) {
  const store = readStorage();
  store[userId] = messages;
  writeStorage(store);
}

export function clearChatsForUser(userId: string) {
  const store = readStorage();
  delete store[userId];
  writeStorage(store);
}

export function addMessageForUser(userId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
  const messages = loadChatsForUser(userId);
  const full: ChatMessage = {
    id: uuidv4(),
    role: msg.role,
    content: msg.content,
    timestamp: Date.now(),
    attachments: msg.attachments,
  };
  messages.push(full);
  saveChatsForUser(userId, messages);
  return full;
}

// React hook exposing chat state for the current user
export function useChatStore() {
  const [userId, setUserId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const id = getOrCreateUserId();
    setUserId(id);
    setMessages(loadChatsForUser(id));

    const loadFromSupabase = async () => {
      if (!SYNC_ENABLED) return;

      try {
        setSyncing(true);
        const supabaseMessages = await fetchMessagesFromBackend(id);

        // Convert Supabase format to our local format
        const converted: ChatMessage[] = supabaseMessages.map((msg) => ({
          id: msg.id,
          role: msg.role as Role,
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          attachments: msg.attachments?.map((att) => ({
            id: att.id,
            file_name: att.file_name,
            file_path: att.file_path,
            file_size: att.file_size,
            mime_type: att.mime_type,
          })),
        }));

        setMessages(converted);
        saveChatsForUser(id, converted);
        setSyncError(null);
      } catch (error: any) {
        console.error('Failed to load from Supabase, falling back to localStorage:', error);
        setSyncError(error.message);
        // Fall back to localStorage
        setMessages(loadChatsForUser(id));
      } finally {
        setSyncing(false);
      }
    };

    loadFromSupabase();
  }, []);

  async function addMessage(role: 'user' | 'assistant', content: string, file?: File) {
    // Add locally first for instant UI feedback
    const localMessage = addMessageForUser(userId, { role, content });
    setMessages((m) => [...m, localMessage]);

    // Sync to Supabase in background
    if (SYNC_ENABLED) {
      try {
        const result = await saveMessageToBackend(userId, role, content, file);
        // Update with server-generated ID and attachments
        const updated = loadChatsForUser(userId);
        const idx = updated.findIndex((m) => m.id === localMessage.id);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            id: result.message.id,
            attachments: result.attachment
              ? [
                  {
                    id: result.attachment.id,
                    file_name: result.attachment.fileName,
                    file_path: result.attachment.storagePath,
                    file_size: result.attachment.file_size,
                    mime_type: result.attachment.mime_type,
                    publicUrl: result.attachment.publicUrl,
                  },
                ]
              : undefined,
          };
          saveChatsForUser(userId, updated);
          setMessages(updated);
        }
      } catch (error: any) {
        console.error('Failed to sync message to Supabase:', error);
        setSyncError(error.message);
      }
    }

    return localMessage;
  }

  async function deleteMessage(messageId: string) {
    if (SYNC_ENABLED) {
      try {
        await deleteMessageFromBackend(messageId);
      } catch (error: any) {
        console.error('Failed to delete from Supabase:', error);
        setSyncError(error.message);
      }
    }
    // Remove from local state
    setMessages((m) => m.filter((msg) => msg.id !== messageId));
    const updated = loadChatsForUser(userId);
    const filtered = updated.filter((m) => m.id !== messageId);
    saveChatsForUser(userId, filtered);
  }

  async function clear() {
    clearChatsForUser(userId);
    setMessages([]);

    // Note: Backend would need a DELETE endpoint to clear all messages for a user
    // For now, just clear locally
    setSyncError(null);
  }

  async function reload() {
    try {
      setSyncing(true);
      const supabaseMessages = await fetchMessagesFromBackend(userId);
      const converted: ChatMessage[] = supabaseMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as Role,
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
        attachments: msg.attachments?.map((att) => ({
          id: att.id,
          file_name: att.file_name,
          file_path: att.file_path,
          file_size: att.file_size,
          mime_type: att.mime_type,
        })),
      }));
      setMessages(converted);
      saveChatsForUser(userId, converted);
      setSyncError(null);
    } catch (error: any) {
      console.error('Failed to reload from Supabase:', error);
      setSyncError(error.message);
    } finally {
      setSyncing(false);
    }
  }

  return {
    userId,
    messages,
    addMessage,
    deleteMessage,
    clear,
    reload,
    syncing,
    syncError,
  } as const;
}
