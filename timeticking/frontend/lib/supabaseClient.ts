import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const rawApiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

function getApiBase() {
  // If an API base is provided and usable, return it; otherwise fall back to relative path (proxied by Next).
  if (rawApiBase) {
    const isLocalhost = rawApiBase.includes('localhost') || rawApiBase.includes('127.0.0.1');
    if (isLocalhost && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      // Avoid using localhost base when running on a remote host (e.g., Codespaces); rely on proxy instead.
      return '';
    }
    return rawApiBase;
  }
  // Default to same-origin so Next.js rewrites/proxy can handle it
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

// Only initialize the client when env vars are provided; backend routes are used otherwise.
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type Message = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  attachments?: Attachment[];
};

export type Attachment = {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

/**
 * Fetch all messages for a user from Supabase via backend
 */
export async function fetchMessagesFromBackend(userId: string): Promise<Message[]> {
  const base = getApiBase();
  const url = `${base ? base : ''}/api/ai/chats?userId=${encodeURIComponent(userId)}`;
  try {
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      let message = 'Failed to fetch messages';
      try {
        const error = await response.json();
        message = error.error || message;
      } catch {
        // ignore JSON parsing errors, keep default message
      }
      console.warn(message);
      return [];
    }

    const data = await response.json();
    return data.messages || [];
  } catch (err) {
    console.warn('Failed to reach AI backend; using local messages only.', err);
    return [];
  }
}

/**
 * Save a message to Supabase via backend
 */
export async function saveMessageToBackend(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  file?: File
): Promise<{ message: Message; attachment?: any } | null> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('role', role);
  formData.append('content', content);

  if (file) {
    formData.append('file', file);
  }

  const base = getApiBase();
  try {
    const response = await fetch(`${base ? base : ''}/api/ai/chats`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let message = 'Failed to save message';
      try {
        const error = await response.json();
        message = error.error || message;
      } catch {
        // ignore JSON parsing errors
      }
      console.warn(message);
      return null;
    }

    return response.json();
  } catch (err) {
    console.warn('Failed to reach AI backend; message saved locally only.', err);
    return null;
  }
}

/**
 * Delete a message from Supabase via backend
 */
export async function deleteMessageFromBackend(messageId: string): Promise<void> {
  const base = getApiBase();
  try {
    const response = await fetch(`${base ? base : ''}/api/ai/chats/${messageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      let message = 'Failed to delete message';
      try {
        const error = await response.json();
        message = error.error || message;
      } catch {
        // ignore parsing errors
      }
      console.warn(message);
    }
  } catch (err) {
    console.warn('Failed to reach AI backend when deleting; removed locally only.', err);
  }
}

export default supabase;
