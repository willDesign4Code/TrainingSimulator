# OpenAI Integration Setup Guide

This guide will help you set up the OpenAI integration for the AI Training Chat feature.

## Prerequisites

- An OpenAI account
- An OpenAI API key with access to:
  - GPT-4o (or GPT-3.5-turbo) for chat
  - TTS (Text-to-Speech) API
  - Whisper API (for speech-to-text)

## Setup Steps

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy your API key (you won't be able to see it again!)

### 2. Configure Environment Variables

1. Create a `.env` file in the root of the `persona-trainer` directory:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your OpenAI API key:
   ```env
   VITE_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```

3. **Important**: Never commit your `.env` file to version control! It's already in `.gitignore`.

### 3. Restart the Development Server

If the dev server is already running, restart it to load the new environment variables:

```bash
npm run dev
```

## Features

### Text Chat
- Type messages in the input field
- Press Enter to send (Shift+Enter for new line)
- View conversation history with timestamps

### Voice Input (Speech-to-Text)
- Click the microphone icon to start recording
- Speak your message
- Click again to stop and send the transcribed message
- Uses OpenAI Whisper API for accurate transcription

### AI Voice Response (Text-to-Speech)
- AI responses are automatically spoken using realistic voices
- Default voice: "Coral"
- Available voices: Alloy, Echo, Fable, Onyx, Nova, Shimmer, Coral
- Click the volume icon to mute/unmute AI voice

### Voice Selection

To change the AI voice, edit the `voice` parameter in [TrainingChatModal.tsx](src/components/training/TrainingChatModal.tsx):

```typescript
const audioBlob = await openAIService.textToSpeech({
  text,
  voice: 'coral', // Change to: 'echo', 'alloy', 'nova', 'shimmer', etc.
  speed: 1.0
});
```

## API Costs

Be aware of OpenAI API pricing:

- **Chat (GPT-4o)**: ~$0.005 per 1K tokens (input) / ~$0.015 per 1K tokens (output)
- **TTS (Text-to-Speech)**: ~$15 per 1M characters
- **Whisper (Speech-to-Text)**: ~$0.006 per minute of audio

[Current OpenAI Pricing](https://openai.com/pricing)

## Troubleshooting

### "OpenAI API key is not configured" Error

- Make sure you've created the `.env` file
- Verify the API key is correctly set in `.env`
- Restart the development server after adding the key

### Speech Recognition Not Working

- Grant microphone permissions in your browser
- Use HTTPS or localhost (required for microphone access)
- Check browser console for specific errors

### Audio Not Playing

- Check that your browser supports the Web Audio API
- Verify volume is not muted in the modal (volume icon)
- Check browser console for TTS errors
- Fallback: Browser's speech synthesis will be used if OpenAI TTS fails

## Security Notes

- **Never expose your API key**: Don't commit `.env` to version control
- **Use environment variables**: Always use `VITE_` prefix for client-side variables
- **For production**: Consider using a backend proxy to hide your API key
- **Rate limiting**: Implement rate limiting to prevent API abuse
- **Monitor usage**: Check your OpenAI usage dashboard regularly

## Next Steps

To enhance the training experience:

1. **Customize system prompts**: Edit the prompt in [openai.ts](src/services/ai/openai.ts) to match specific training scenarios
2. **Add persona context**: Pass scenario-specific details to make conversations more realistic
3. **Implement conversation scoring**: Analyze user responses and provide feedback
4. **Save conversation history**: Store sessions in Supabase for review and analysis

## Support

For issues with:
- **OpenAI API**: Check [OpenAI Documentation](https://platform.openai.com/docs)
- **Application bugs**: Create an issue in the repository
