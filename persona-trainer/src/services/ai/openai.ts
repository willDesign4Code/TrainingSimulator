/**
 * OpenAI Service
 * Handles all OpenAI API interactions including chat completions and text-to-speech
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface TTSOptions {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'coral';
  speed?: number;
}

class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    // Get API key from environment variable
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment.');
    }
  }

  /**
   * Send a chat completion request to OpenAI
   */
  async sendChatCompletion(options: ChatCompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 500
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response from OpenAI');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI chat completion error:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using OpenAI's TTS API
   */
  async textToSpeech(options: TTSOptions): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: options.text,
          voice: options.voice || 'coral',
          speed: options.speed ?? 1.0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate speech');
      }

      return await response.blob();
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw error;
    }
  }

  /**
   * Convert speech to text using OpenAI's Whisper API
   */
  async speechToText(audioBlob: Blob): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to transcribe audio');
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('OpenAI speech-to-text error:', error);
      throw error;
    }
  }

  /**
   * Create a system prompt for training scenarios with persona-based roleplay
   */
  createTrainingSystemPrompt(trainingTitle: string, scenarioDetails?: string, personaContext?: string): string {
    return `You are roleplaying as a customer/client in a training simulation for "${trainingTitle}".

${personaContext ? `PERSONA CONTEXT:\n${personaContext}\n` : ''}

${scenarioDetails ? `SCENARIO DETAILS:\n${scenarioDetails}\n` : ''}

CRITICAL INSTRUCTIONS:
- Stay completely IN CHARACTER as the persona described above
- DO NOT introduce yourself as an "AI training assistant"
- DO NOT ask "how can I help you" - YOU are the one who needs help
- Start the conversation immediately with your complaint/issue/request as the persona would
- React naturally to what the trainee says, staying true to the persona's emotional state and communication style
- Be realistic and challenging but fair - help the trainee practice real-world scenarios
- Keep responses concise and conversational (2-4 sentences typically)
- The user is training to handle YOU, so act as the customer/client who has the problem

Begin the roleplay immediately without breaking character.`;
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();
export default openAIService;
