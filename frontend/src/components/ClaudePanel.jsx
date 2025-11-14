import { useState, useRef, useEffect } from 'react';
import './ClaudePanel.css';

const API_URL = 'http://localhost:3001/api';

function ClaudePanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [useWebSpeech, setUseWebSpeech] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const recognitionRef = useRef(null);

  // Audio notification
  const audioContextRef = useRef(null);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setUseWebSpeech(true);
      console.log('✅ Web Speech API available - using real-time streaming');
    } else {
      console.log('⚠️ Web Speech API not available - using OpenAI Whisper fallback');
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch greeting on mount
  useEffect(() => {
    async function fetchGreeting() {
      try {
        const response = await fetch(`${API_URL}/claude/greeting`);
        const result = await response.json();

        if (result.success) {
          setMessages([{
            role: 'assistant',
            content: result.data.message,
          }]);
        }
      } catch (err) {
        console.error('Error fetching greeting:', err);
        // Fallback to basic greeting
        setMessages([{
          role: 'assistant',
          content: 'Hi! I\'m your AI goal coach. How can I help you today?',
        }]);
      } finally {
        setIsInitializing(false);
      }
    }

    fetchGreeting();
  }, []);

  function clearConversation() {
    // Reload greeting
    setIsInitializing(true);
    setMessages([]);
    setInput('');
    setError(null);

    // Re-fetch greeting
    async function fetchGreeting() {
      try {
        const response = await fetch(`${API_URL}/claude/greeting`);
        const result = await response.json();

        if (result.success) {
          setMessages([{
            role: 'assistant',
            content: result.data.message,
          }]);
        }
      } catch (err) {
        console.error('Error fetching greeting:', err);
        setMessages([{
          role: 'assistant',
          content: 'Hi! I\'m your AI goal coach. How can I help you today?',
        }]);
      } finally {
        setIsInitializing(false);
      }
    }

    fetchGreeting();
  }

  async function handleSuggestedAction(actionValue, isFromPersistentPills = false) {
    // Initialize audio on user interaction (for beep notification)
    initAudioContext();

    // Clear suggested actions only if from initial greeting pills
    if (!isFromPersistentPills) {
      setSuggestedActions([]);
    }

    // Map action values to user prompts
    const promptMap = {
      'status': 'My Progress',
      'checkin': 'Weekly Check-in',
      'setup': "Yes, let's set up my first objectives",
      'chat': '',
      'cancel': 'Not now',
    };

    const userPrompt = promptMap[actionValue];

    // If chat or cancel, just acknowledge
    if (actionValue === 'chat') {
      return; // Do nothing, user will type their own message
    }

    if (actionValue === 'cancel') {
      setMessages([
        ...messages,
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: 'No problem! Just let me know when you\'re ready. I\'m here to help whenever you need.' }
      ]);
      return;
    }

    // For status, checkin, or setup - send to Claude
    if (userPrompt) {
      const newMessages = [...messages, { role: 'user', content: userPrompt }];
      setMessages(newMessages);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/claude/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            includeContext: true,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setMessages([
            ...newMessages,
            { role: 'assistant', content: result.data.message },
          ]);
          playBeep(); // Play notification sound when response is ready
        } else {
          setError(result.error || 'Failed to get response from Claude');
        }
      } catch (err) {
        console.error('Chat error:', err);
        setError('Failed to connect to Claude. Make sure your API key is configured.');
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Initialize audio on user interaction (for beep notification)
    initAudioContext();

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/claude/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          includeContext: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: result.data.message },
        ]);
        playBeep(); // Play notification sound when response is ready
      } else {
        setError(result.error || 'Failed to get response from Claude');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to connect to Claude. Make sure your API key is configured.');
    } finally {
      setIsLoading(false);
    }
  }

  // Initialize AudioContext on first user interaction
  function initAudioContext() {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
      }
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }

  // Play notification beep when Claude responds
  function playBeep() {
    try {
      initAudioContext(); // Ensure AudioContext is ready

      if (!audioContextRef.current) {
        return;
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400; // Frequency in Hz (higher = higher pitch)
      oscillator.type = 'sine'; // Smooth sine wave tone

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume (0-1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15); // Fade out

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15); // Duration: 150ms
    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  }

  // Voice recording functions
  async function startRecording() {
    if (useWebSpeech) {
      // Use Web Speech API for real-time streaming
      startWebSpeechRecognition();
    } else {
      // Fall back to MediaRecorder + OpenAI Whisper
      startMediaRecording();
    }
  }

  function startWebSpeechRecognition() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscriptAccumulator = '';

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        setError(null);
        finalTranscriptAccumulator = '';

        // Timer for recording duration
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let newFinalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Accumulate finalized text
        if (newFinalTranscript) {
          finalTranscriptAccumulator += newFinalTranscript;
        }

        // Update input: finalized text + current interim text
        setInput(finalTranscriptAccumulator + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please check browser permissions.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        stopRecording();
      };

      recognition.onend = () => {
        // Auto-stopped due to silence - clean up recording state
        setIsRecording(false);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }

        // Auto-send the transcribed text
        if (finalTranscriptAccumulator.trim()) {
          // Trigger form submission
          setTimeout(() => {
            const form = document.querySelector('.claude-input-form');
            if (form) {
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (error) {
      console.error('Web Speech API error:', error);
      setError('Could not start speech recognition. Please check browser permissions.');
    }
  }

  async function startMediaRecording() {
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
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer for recording duration
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Microphone access denied:', error);
      setError('Could not access microphone. Please check browser permissions.');
    }
  }

  function stopRecording() {
    if (recognitionRef.current && useWebSpeech) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && !useWebSpeech) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  }

  async function transcribeAudio(audioBlob) {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch(`${API_URL}/claude/transcribe`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        // Insert transcribed text into input
        setInput(result.data.transcript);
      } else {
        setError(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <aside className="claude-panel">
      <div className="claude-header">
        <div>
          <h3>AI Coach</h3>
          <p className="claude-subtitle">powered by claude-sonnet-4-5-20250929</p>
        </div>
      </div>

      <div className="claude-messages">
        {isInitializing ? (
          <div className="message assistant">
            <div className="message-content typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Persistent quick actions - always show after greeting loads */}
      {!isInitializing && messages.length > 0 && (
        <div className="persistent-actions">
          <button
            className="persistent-pill"
            onClick={() => handleSuggestedAction('status', true)}
            disabled={isLoading}
            title="Quick status check (<1 min)"
          >
            My Progress
          </button>
          <button
            className="persistent-pill"
            onClick={() => handleSuggestedAction('checkin', true)}
            disabled={isLoading}
            title="Weekly check-in (10-15 min)"
          >
            Weekly Check-in
          </button>
          <button
            type="button"
            className="persistent-pill new-chat-pill"
            onClick={clearConversation}
            title="Start a fresh conversation"
          >
            New Chat →
          </button>
        </div>
      )}

      <form className="claude-input-form" onSubmit={sendMessage}>
        <div className="input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Ask me anything about your goals..."
            rows={3}
            disabled={isLoading || isRecording}
          />
          <button
            type="button"
            className={`voice-icon-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            title={isRecording ? "Stop recording" : "Speak to chat"}
          >
            {isRecording ? (
              <svg className="voice-wave-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect className="wave-bar bar-1" x="4" y="8" width="2" height="8" rx="1" fill="currentColor"/>
                <rect className="wave-bar bar-2" x="8" y="5" width="2" height="14" rx="1" fill="currentColor"/>
                <rect className="wave-bar bar-3" x="12" y="3" width="2" height="18" rx="1" fill="currentColor"/>
                <rect className="wave-bar bar-4" x="16" y="6" width="2" height="12" rx="1" fill="currentColor"/>
                <rect className="wave-bar bar-5" x="20" y="9" width="2" height="6" rx="1" fill="currentColor"/>
              </svg>
            ) : (
              <svg className="microphone-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="currentColor"/>
                <path d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
        <div className="form-buttons">
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}

export default ClaudePanel;
