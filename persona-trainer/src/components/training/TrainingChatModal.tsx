import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Button,
  Divider,
  Tooltip,
  Alert,
  Slider,
  Popover
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SpeedIcon from '@mui/icons-material/Speed';
import openAIService from '../../services/ai/openai';
import { supabase } from '../../services/supabase/client';
import { scoreConversation, Rubric, ScoringResult } from '../../services/ai/scoring';
import ScoringResultsModal from './ScoringResultsModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TrainingChatModalProps {
  open: boolean;
  onClose: () => void;
  trainingTitle: string;
  trainingId: string;
  scenarioId?: string; // ID of the scenario for fetching rubrics
}

const TrainingChatModal = ({ open, onClose, trainingTitle, scenarioId }: TrainingChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioQueue, setAudioQueue] = useState<HTMLAudioElement[]>([]);
  const [speechSpeed, setSpeechSpeed] = useState(1.15); // Default speed from earlier change
  const [speedAnchorEl, setSpeedAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Scoring state
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  // Scenario and Persona state
  const [scenario, setScenario] = useState<any | null>(null);
  const [persona, setPersona] = useState<any | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationHistoryRef = useRef<Array<{role: 'system' | 'user' | 'assistant', content: string}>>([]);
  const initializedRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch scenario, persona, and rubrics when modal opens
  useEffect(() => {
    const fetchScenarioData = async () => {
      if (open && scenarioId) {
        try {
          setScenarioLoading(true);

          // Fetch scenario with persona data
          const { data: scenarioData, error: scenarioError } = await supabase
            .from('scenarios')
            .select(`
              *,
              persona:personas(*)
            `)
            .eq('id', scenarioId)
            .single();

          if (scenarioError) throw scenarioError;

          setScenario(scenarioData);
          setPersona(scenarioData?.persona || null);

          // Fetch rubrics
          const { data: rubricsData, error: rubricsError } = await supabase
            .from('rubrics')
            .select('*')
            .eq('scenario_id', scenarioId);

          if (rubricsError) throw rubricsError;
          setRubrics(rubricsData || []);

        } catch (err) {
          console.error('Error fetching scenario data:', err);
          setError('Failed to load scenario details. Please try again.');
        } finally {
          setScenarioLoading(false);
        }
      }
    };

    fetchScenarioData();
  }, [open, scenarioId]);

  // Initialize conversation with a greeting and system prompt
  useEffect(() => {
    if (open && !initializedRef.current && scenario && persona && !scenarioLoading) {
      initializedRef.current = true;

      // Initialize the conversation
      const initializeConversation = async () => {
        setIsLoading(true);

        try {
          // Build persona context from database fields
          const personaContext = `You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation}.
${persona.interests ? `Your interests include: ${persona.interests}.` : ''}
${persona.goals ? `Your goals are: ${persona.goals}.` : ''}
${persona.communication_style ? `Communication style: ${persona.communication_style}.` : ''}
${persona.emotional_state ? `Current emotional state: ${persona.emotional_state}.` : ''}`;

          // Build scenario details from database fields
          let scenarioDetails = scenario.details || '';
          if (scenario.persona_tone) {
            scenarioDetails += `\n\nTone: ${scenario.persona_tone}`;
          }
          if (scenario.persona_additional_details) {
            scenarioDetails += `\n\nAdditional context: ${scenario.persona_additional_details}`;
          }

          // Set up system prompt
          const systemPrompt = openAIService.createTrainingSystemPrompt(
            scenario.title,
            scenarioDetails,
            personaContext
          );
          conversationHistoryRef.current = [{ role: 'system', content: systemPrompt }];

          // Get initial message from AI (in character)
          const initialResponse = await openAIService.sendChatCompletion({
            messages: conversationHistoryRef.current,
            temperature: 0.9,
            maxTokens: 150
          });

          const greeting: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: initialResponse,
            timestamp: new Date()
          };

          setMessages([greeting]);
          conversationHistoryRef.current.push({ role: 'assistant', content: greeting.content });

          // Speak the greeting if speech is enabled
          if (isSpeechEnabled) {
            setTimeout(() => {
              speakText(greeting.content);
            }, 300);
          }
        } catch (error) {
          console.error('Error initializing conversation:', error);
          setError('Failed to start the training session. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      initializeConversation();
    }

    // Reset initialization flag when modal closes
    if (!open) {
      initializedRef.current = false;
      setMessages([]);
      conversationHistoryRef.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scenario, persona, scenarioLoading]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Add to conversation history
    conversationHistoryRef.current.push({ role: 'user', content: textToSend });

    try {
      // Get response from OpenAI
      const response = await openAIService.sendChatCompletion({
        messages: conversationHistoryRef.current,
        temperature: 0.8,
        maxTokens: 500
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      conversationHistoryRef.current.push({ role: 'assistant', content: response });

      // Speak the response if speech is enabled
      if (isSpeechEnabled) {
        speakText(response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to get response from AI');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string) => {
    // Prevent duplicate speech
    if (isSpeakingRef.current) {
      return;
    }

    isSpeakingRef.current = true;

    try {
      // Use OpenAI's TTS with configured voice and speed
      const audioBlob = await openAIService.textToSpeech({
        text,
        voice: (persona?.voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') || 'alloy',
        speed: speechSpeed
      });

      // Create audio element and play
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setAudioQueue(prev => prev.filter(a => a !== audio));
        isSpeakingRef.current = false;
      };

      audio.onerror = () => {
        isSpeakingRef.current = false;
      };

      setAudioQueue(prev => [...prev, audio]);
      await audio.play();
    } catch (error) {
      console.error('Error playing speech:', error);
      isSpeakingRef.current = false;
      // Fallback to browser's speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.onend = () => {
          isSpeakingRef.current = false;
        };
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const toggleSpeech = () => {
    setIsSpeechEnabled(prev => !prev);
    if (isSpeechEnabled) {
      // Stop all playing audio
      audioQueue.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      setAudioQueue([]);
      window.speechSynthesis.cancel();
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsListening(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());

          try {
            setIsLoading(true);
            // Convert speech to text using OpenAI Whisper
            const transcription = await openAIService.speechToText(audioBlob);

            if (transcription) {
              // Send the transcribed text as a message
              await handleSendMessage(transcription);
            }
          } catch (error) {
            console.error('Error transcribing audio:', error);
            setError('Failed to transcribe audio. Please try typing instead.');
          } finally {
            setIsLoading(false);
          }
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setError('Failed to access microphone. Please check your permissions.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSession = async () => {
    // Stop all audio
    audioQueue.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setAudioQueue([]);
    window.speechSynthesis.cancel();

    // Stop recording if active
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }

    // If we have rubrics and messages, score the conversation
    if (rubrics.length > 0 && messages.length > 1) {
      try {
        setIsScoring(true);
        setShowScoringModal(true);
        setScoringError(null);

        // Filter out system messages and convert to scoring format
        const conversationTranscript = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const result = await scoreConversation(conversationTranscript, rubrics);
        setScoringResult(result);
      } catch (err) {
        console.error('Error scoring conversation:', err);
        setScoringError(err instanceof Error ? err.message : 'Failed to score conversation');
      } finally {
        setIsScoring(false);
      }
    } else {
      // No rubrics - just close
      onClose();
    }
  };

  const handleCloseScoringModal = () => {
    setShowScoringModal(false);
    setScoringResult(null);
    setScoringError(null);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleEndSession}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '800px'
          }
        }}
      >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6">{trainingTitle}</Typography>
          <Typography variant="caption" color="text.secondary">
            AI Training Session
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isSpeechEnabled ? 'Mute AI voice' : 'Enable AI voice'}>
            <IconButton onClick={toggleSpeech} color={isSpeechEnabled ? 'primary' : 'default'}>
              {isSpeechEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Adjust voice speed">
            <IconButton
              onClick={(e) => setSpeedAnchorEl(e.currentTarget)}
              color={speedAnchorEl ? 'primary' : 'default'}
            >
              <SpeedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isListening ? 'Stop listening' : 'Start voice input'}>
            <IconButton onClick={toggleListening} color={isListening ? 'error' : 'default'}>
              {isListening ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </Tooltip>
          <IconButton onClick={handleEndSession}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, mb: 0 }}>
            {error}
          </Alert>
        )}

        {/* Chat Messages */}
        <Box
          ref={chatContainerRef}
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'grey.50'
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  maxWidth: '75%',
                  p: 2,
                  bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  borderTopRightRadius: message.role === 'user' ? 0 : 2,
                  borderTopLeftRadius: message.role === 'user' ? 2 : 0
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  AI is typing...
                </Typography>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              variant="outlined"
              size="small"
            />
            <IconButton
              color="primary"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleEndSession} variant="outlined" size="large">
          End Session {rubrics.length > 0 && '& View Results'}
        </Button>
      </DialogActions>

      {/* Speed Control Popover */}
      <Popover
        open={Boolean(speedAnchorEl)}
        anchorEl={speedAnchorEl}
        onClose={() => setSpeedAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 3, width: 280 }}>
          <Typography variant="subtitle2" gutterBottom>
            Voice Speed
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Adjust how fast the AI speaks (0.5x - 2.0x)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ minWidth: 30 }}>
              0.5x
            </Typography>
            <Slider
              value={speechSpeed}
              onChange={(_, value) => setSpeechSpeed(value as number)}
              min={0.5}
              max={2.0}
              step={0.05}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value.toFixed(2)}x`}
              sx={{ flexGrow: 1 }}
            />
            <Typography variant="caption" sx={{ minWidth: 30 }}>
              2.0x
            </Typography>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Current: <strong>{speechSpeed.toFixed(2)}x</strong>
            </Typography>
            <Button
              size="small"
              onClick={() => setSpeechSpeed(1.0)}
              disabled={speechSpeed === 1.0}
            >
              Reset to 1.0x
            </Button>
          </Box>
        </Box>
      </Popover>
    </Dialog>

    {/* Scoring Results Modal */}
    <ScoringResultsModal
      open={showScoringModal}
      onClose={handleCloseScoringModal}
      scoringResult={scoringResult}
      isScoring={isScoring}
      trainingTitle={trainingTitle}
      error={scoringError}
    />
    </>
  );
};

export default TrainingChatModal;
