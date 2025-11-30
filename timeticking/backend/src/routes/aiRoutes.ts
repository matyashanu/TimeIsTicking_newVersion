import { Router, Request, Response } from 'express';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { askQuestionAboutFile } from '../services/geminiService.js';
import {
  saveMessage,
  saveAttachment,
  getMessagesForUser,
  deleteMessage,
  uploadFileToStorage,
  getPublicFileUrl,
} from '../services/supabaseService.js';

const router = Router();

// Extend Express Request to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads (temporary local storage)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req: any, file: any, cb: any) => {
      const timestamp = Date.now();
      cb(null, `${timestamp}-${file.originalname}`);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    const validMimes = [
      'application/pdf',
      'text/plain',
    ];
    if (!validMimes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only PDF and TXT are allowed.'));
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

/**
 * POST /api/ai/ask
 * Ask a question (optionally with a file) and get an answer from Gemini
 * Does NOT save to Supabase (kept for backward compatibility)
 */
router.post(
  '/ask',
  upload.single('file'),
  async (req: MulterRequest, res: Response) => {
    try {
      const { question } = req.body;
      if (!question || typeof question !== 'string' || !question.trim()) {
        // Clean up uploaded file if exists
        if (req.file?.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete uploaded file:', err);
          });
        }
        return res.status(400).json({ error: 'Question is required.' });
      }

      let filePath: string | null = null;
      let fileName: string | null = null;

      if (req.file) {
        filePath = req.file.path;
        fileName = req.file.originalname;
      }

      // Call Gemini service
      const answer = await askQuestionAboutFile(filePath, fileName, question);

      // Clean up uploaded file if it exists
      if (filePath) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete uploaded file:', err);
        });
      }

      res.json({
        answer,
        ...(fileName && { fileName }),
      });
    } catch (error: any) {
      // Clean up uploaded file on error
      if (req.file?.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete uploaded file:', err);
        });
      }

      const status = error.message.includes('Invalid file type') ? 400 : 500;
      res.status(status).json({ error: error.message || 'An error occurred.' });
    }
  }
);

/**
 * POST /api/ai/chats
 * Save a message (with optional file metadata only) to Supabase
 */
router.post(
  '/chats',
  upload.single('file'),
  async (req: MulterRequest, res: Response) => {
    try {
      const { userId, role, content } = req.body;

      if (!userId || !role || !content) {
        if (req.file?.path) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete uploaded file:', err);
          });
        }
        return res.status(400).json({ error: 'userId, role, and content are required.' });
      }

      // Save message to Supabase
      const message = await saveMessage(userId, role, content);

      // If there's a file, just save metadata (no cloud storage)
      if (req.file) {
        try {
          await saveAttachment(
            message.id,
            req.file.originalname,
            '', // empty path - not storing file
            req.file.size,
            req.file.mimetype
          );

          // Clean up temp file immediately
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
          });

          res.json({
            message,
            attachment: {
              fileName: req.file.originalname,
              fileSize: req.file.size,
            },
          });
        } catch (fileError: any) {
          console.error('File metadata error:', fileError);
          if (req.file?.path) {
            fs.unlink(req.file.path, (err) => {
              if (err) console.error('Failed to delete temp file:', err);
            });
          }
          throw fileError;
        }
      } else {
        res.json({ message });
      }
    } catch (error: any) {
      if (req.file?.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete temp file:', err);
        });
      }
      res.status(500).json({ error: error.message || 'Failed to save chat.' });
    }
  }
);

/**
 * GET /api/ai/chats?userId=...
 * Fetch all messages for a user (including attachments)
 */
router.get('/chats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId query parameter is required.' });
    }

    const messages = await getMessagesForUser(userId);
    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch chats.' });
  }
});

/**
 * DELETE /api/ai/chats/:messageId
 * Delete a message (and its attachments via cascade)
 */
router.delete('/chats/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({ error: 'messageId is required.' });
    }

    await deleteMessage(messageId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete chat.' });
  }
});

export default router;
