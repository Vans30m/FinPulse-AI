import axios from 'axios';

export async function callGeminiWithOllamaFallback(
  prompt: string,
  jsonMode = false
): Promise<string> {

  const tryGemini = async (key: string): Promise<string> => {
    if (!key) throw new Error('No Gemini API key provided');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined,
    }, { timeout: 45_000 });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Invalid Gemini response structure');
    return text;
  };

  try {
    return await tryGemini(process.env.GEMINI_API_KEY || '');
  } catch (err: any) {
    const status = err.response?.status;
    const isQuota =
      status === 429 ||
      err.message?.includes('429') ||
      err.response?.data?.error?.message?.includes('quota');
    console.warn(`[AI] Primary Gemini failed${isQuota ? ' (quota)' : ''}: ${err.message}`);
  }

  if (process.env.GEMINI_API_KEY_BACKUP) {
    try {
      console.log('[AI] Trying backup Gemini key...');
      return await tryGemini(process.env.GEMINI_API_KEY_BACKUP);
    } catch (backupErr: any) {
      console.warn(`[AI] Backup Gemini also failed: ${backupErr.message}`);
    }
  }

  console.log('[AI] Trying Ollama fallback...');
  try {
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
    const response = await axios.post(
      ollamaUrl,
      { model: ollamaModel, prompt, stream: false, format: jsonMode ? 'json' : undefined },
      { timeout: 10_000 }
    );
    if (response.data?.response) {
      console.log(`[AI] Ollama (${ollamaModel}) responded successfully`);
      return response.data.response;
    }
    throw new Error('Invalid Ollama response');
  } catch (ollamaErr: any) {
    console.error('[AI] Ollama fallback failed:', ollamaErr.message);
    throw new Error('All AI providers failed. Please check your API keys and Ollama setup.');
  }
}
