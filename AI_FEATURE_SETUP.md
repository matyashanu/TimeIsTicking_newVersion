# AI Feature - Setup Guide

## ✅ What Was Created

### Frontend (Next.js + Tailwind)
- **`/app/ai-feature/page.tsx`** - Complete AI Feature page with file upload, question input, and results display
- **`/lib/aiApi.ts`** - API utility for communicating with the backend

### Backend (Express.js + TypeScript)
- **`/src/routes/aiRoutes.ts`** - Express route handler for `/api/ai/ask` endpoint
- **`/src/services/geminiService.ts`** - Gemini Flash integration service
- **`/src/app.ts`** - Updated to register AI routes

### Dependencies Installed
- `@google/generative-ai` - Google Gemini SDK
- `multer` - File upload middleware

---

## 🔧 Setup Instructions

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### Step 2: Add Environment Variable

Create or update `.env` file in your backend directory:

```bash
cd /workspaces/TimeIsTicking_newVersion/timeticking/backend
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
```

Replace `your_actual_api_key_here` with your actual Gemini API key.

### Step 3: Install Types for Multer

The backend already has multer installed. You may need to add types:

```bash
cd /workspaces/TimeIsTicking_newVersion/timeticking/backend
npm install --save-dev @types/multer
```

### Step 4: Start Development Servers

**Backend:**
```bash
cd /workspaces/TimeIsTicking_newVersion/timeticking/backend
npm run dev
```

**Frontend (in another terminal):**
```bash
cd /workspaces/TimeIsTicking_newVersion/timeticking/frontend
npm run dev
```

### Step 5: Access the Feature

Navigate to: `http://localhost:3000/ai-feature`

---

## 📋 File Structure

```
backend/
├── src/
│   ├── app.ts (✅ UPDATED - includes /api/ai route)
│   ├── routes/
│   │   ├── aiRoutes.ts (✅ NEW)
│   │   ├── userRoutes.ts
│   │   ├── taskRoutes.ts
│   │   ├── goalRoutes.ts
│   │   └── calendarRoutes.ts
│   └── services/
│       └── geminiService.ts (✅ NEW)
│
frontend/
├── app/
│   ├── ai-feature/
│   │   └── page.tsx (✅ NEW)
│   ├── calendar/
│   ├── planner/
│   ├── settings/
│   └── social/
├── lib/
│   ├── aiApi.ts (✅ NEW)
│   ├── useClock.ts
│   └── constants.ts
└── styles/
    └── globals.css
```

---

## 🎨 Features Implemented

✅ **File Upload** - Accept PDF, DOCX, TXT (max 25MB)  
✅ **Question Input** - Textarea with Ctrl+Enter submit  
✅ **AI Processing** - Google Gemini Flash model  
✅ **Loading State** - Animated spinner during processing  
✅ **Error Handling** - User-friendly error messages  
✅ **Results Display** - Scrollable answer section with file reference  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Dark Mode** - Tailwind dark mode support  
✅ **Clean UI** - Gradient backgrounds, smooth transitions  

---

## 🚀 API Endpoint

### POST `/api/ai/ask`

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `file` (File) - PDF, DOCX, or TXT file
  - `question` (string) - Question about the document

**Response:**
```json
{
  "answer": "The answer to your question...",
  "fileName": "document.pdf"
}
```

**Error Response:**
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## ⚠️ Important Notes

1. **API Key Security**: Never commit `.env` files. Add to `.gitignore`
2. **File Size Limit**: Currently set to 25MB. Adjust in `aiRoutes.ts` if needed
3. **Supported Formats**: PDF, DOCX, TXT only
4. **Cleanup**: Uploaded files are automatically deleted after processing
5. **Environment**: Ensure `GEMINI_API_KEY` is set before running the backend

---

## 🧪 Testing

### Test with cURL (Backend only)

```bash
curl -X POST http://localhost:3001/api/ai/ask \
  -F "file=@/path/to/document.pdf" \
  -F "question=What is the main topic?"
```

### Test through UI

1. Visit `http://localhost:3000/ai-feature`
2. Upload a document
3. Ask a question
4. Click "Generate Answer"

---

## 🐛 Troubleshooting

**Issue: "GEMINI_API_KEY not set"**
- Solution: Check `.env` file exists in backend directory and has correct API key

**Issue: "Invalid file type"**
- Solution: Only PDF, DOCX, and TXT files are supported

**Issue: "File too large"**
- Solution: Max file size is 25MB. Reduce file size or adjust limit in `aiRoutes.ts`

**Issue: Network errors**
- Solution: Ensure both frontend and backend servers are running
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001` (or configured port)

---

## ✨ Next Steps

- Customize styling in the page component
- Add file preview functionality
- Implement chat history
- Add export results feature
- Create user preferences for model settings

---

**All set! The AI Feature is now ready to use.** 🎉
