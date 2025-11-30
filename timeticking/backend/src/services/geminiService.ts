import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

const API_KEY = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI && API_KEY && API_KEY !== 'demo-key') {
    genAI = new GoogleGenerativeAI(API_KEY);
  } else if (!genAI) {
    genAI = new GoogleGenerativeAI('demo-key');
  }
  return genAI;
}

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export async function askQuestionAboutFile(
  filePath: string | null,
  fileName: string | null,
  question: string
): Promise<string> {
  try {
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in your .env file. Please add your API key to enable the AI feature.');
    }

    // Initialize Gemini Flash model
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    // Build request content
    const content: any[] = [];

    // Add file content if provided
    if (filePath) {
      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = getMimeType(filePath);
      const base64Data = Buffer.from(fileBuffer).toString('base64');

      content.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    // Add the question
    content.push({
      text: question,
    });

    // Generate content
    const result = await model.generateContent(content);

    const response = await result.response;
    const answer = response.text();

    if (!answer) {
      throw new Error('No response generated from Gemini.');
    }

    return answer;
  } catch (error: any) {
    console.error('Gemini API error:', error);
    throw new Error(error.message || 'Failed to process request with Gemini.');
  }
}
