import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const response = await fetch(`/api/ai/chats?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch messages');
  }

  const data = await response.json();
  return data.messages || [];
}

/**
 * Save a message to Supabase via backend
 */
export async function saveMessageToBackend(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  file?: File
): Promise<{ message: Message; attachment?: any }> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('role', role);
  formData.append('content', content);

  if (file) {
    formData.append('file', file);
  }

  const response = await fetch('/api/ai/chats', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save message');
  }

  return response.json();
}

/**
 * Delete a message from Supabase via backend
 */
export async function deleteMessageFromBackend(messageId: string): Promise<void> {
  const response = await fetch(`/api/ai/chats/${messageId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete message');
  }
}

export default supabase;
