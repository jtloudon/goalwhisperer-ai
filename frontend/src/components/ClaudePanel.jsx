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

      {/* Persistent quick actions - only show after initial greeting */}
      {!isInitializing && messages.length > 1 && (
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
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </aside>
  );
}

export default ClaudePanel;
