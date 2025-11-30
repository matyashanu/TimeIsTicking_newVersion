import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Message {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface MessageWithAttachments extends Message {
  attachments: Attachment[];
}

/**
 * Save a message to Supabase
 */
export async function saveMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ user_id: userId, role, content }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return data as Message;
}

/**
 * Save an attachment linked to a message
 */
export async function saveAttachment(
  messageId: string,
  fileName: string,
  filePath: string,
  fileSize: number | null,
  mimeType: string | null
): Promise<Attachment> {
  const { data, error } = await supabase
    .from('attachments')
    .insert([
      {
        message_id: messageId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save attachment: ${error.message}`);
  }

  return data as Attachment;
}

/**
 * Fetch all messages for a user, with attachments
 */
export async function getMessagesForUser(userId: string): Promise<MessageWithAttachments[]> {
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (msgError) {
    throw new Error(`Failed to fetch messages: ${msgError.message}`);
  }

  // Fetch attachments for each message
  const messagesWithAttachments: MessageWithAttachments[] = await Promise.all(
    (messages || []).map(async (msg) => {
      const { data: attachments, error: attError } = await supabase
        .from('attachments')
        .select('*')
        .eq('message_id', msg.id)
        .order('created_at', { ascending: true });

      if (attError) {
        console.error(`Failed to fetch attachments for message ${msg.id}:`, attError.message);
      }

      return {
        ...(msg as Message),
        attachments: (attachments || []) as Attachment[],
      };
    })
  );

  return messagesWithAttachments;
}

/**
 * Delete a message and its attachments
 */
export async function deleteMessage(messageId: string): Promise<void> {
  // Attachments will cascade delete due to FK constraint
  const { error } = await supabase.from('messages').delete().eq('id', messageId);

  if (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

/**
 * Upload a file to Supabase Storage (chat-attachments bucket)
 */
export async function uploadFileToStorage(
  userId: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  // Create a unique path: chat-attachments/userId/timestamp-fileName
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}-${fileName}`;

  try {
    const { error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.warn(`Storage upload warning: ${error.message}. Continuing without file storage.`);
      // Return a placeholder path if bucket doesn't exist
      return filePath;
    }

    return filePath;
  } catch (err: any) {
    console.warn(`Storage error: ${err.message}. Continuing without file storage.`);
    // Don't throw, just return the path and continue
    return filePath;
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFileFromStorage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('chat-attachments')
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file from storage: ${error.message}`);
  }
}

/**
 * Get a public URL for a file in storage
 */
export function getPublicFileUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export default supabase;
