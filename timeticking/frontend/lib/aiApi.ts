interface AIResponse {
  answer: string;
  fileName?: string;
}

export async function uploadAndAsk(
  file: File | undefined,
  question: string
): Promise<AIResponse> {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  formData.append('question', question);

  try {
    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Server error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as AIResponse;
    if (!data.answer) {
      throw new Error('Invalid response format from server.');
    }

    return data;
  } catch (error: any) {
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}
