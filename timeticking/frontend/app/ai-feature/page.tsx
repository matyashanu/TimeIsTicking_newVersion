"use client";

import React, { useEffect, useRef, useState } from "react";
import { uploadAndAsk } from "@/lib/aiApi";
import { useChatStore } from "@/lib/useChatStore";

type AIResponse = {
  answer: string;
  fileName?: string;
};

export default function AIAssistantPage() {
  const { messages, addMessage, deleteMessage, clear } = useChatStore();
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        "application/pdf",
        "text/plain",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Invalid file type. Please upload PDF or TXT.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendQuestion = async () => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setError(null);
    addMessage("user", question.trim(), file || undefined);
    setLoading(true);

    try {
      const res = await uploadAndAsk(file || undefined, question.trim());
      const assistantText = res.answer || "(no response)";
      addMessage("assistant", assistantText);
      setQuestion("");
      handleClearFile();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (e: any) {
      setError(e?.message || "Failed to get response from AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      sendQuestion();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">✨ AI</h1>
        {messages.length > 0 && (
          <button
            onClick={() => {
              clear();
            }}
            className="px-3 py-2 text-sm rounded-md bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            Clear
          </button>
        )}
      </div>

      {/* Chat Messages - Fills Available Space */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-4xl mb-4">✨</p>
              <p className="text-lg text-slate-500 dark:text-slate-400">Start a conversation</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Ask anything. Optionally attach a PDF or TXT file.</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xl px-4 py-3 rounded-lg ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-bl-none"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.content}</div>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-2 text-xs opacity-75">
                    📎 {m.attachments.map((att) => att.file_name).join(", ")}
                  </div>
                )}
                {m.role === "user" && (
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className="mt-1 text-xs opacity-60 hover:opacity-100 underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-lg rounded-tl-none">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4 space-y-3">
        {/* File Indicator */}
        {file && (
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span>📎 {file.name}</span>
              <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(0)}KB)</span>
            </div>
            <button
              onClick={handleClearFile}
              className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs"
            >
              Remove
            </button>
          </div>
        )}

        {/* Input Box */}
        <div className="flex gap-3 items-end">
          {/* File Upload Button */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-1"
              title="Attach PDF or TXT"
            >
              📎
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={question}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Ctrl+Enter to send)"
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
            style={{ maxHeight: "200px", minHeight: "40px" }}
          />

          {/* Send Button */}
          <button
            onClick={sendQuestion}
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
