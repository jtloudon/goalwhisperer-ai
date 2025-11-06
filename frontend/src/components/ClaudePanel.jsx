import { useState, useRef, useEffect } from 'react';
import './ClaudePanel.css';

const API_URL = 'http://localhost:3001/api';

function ClaudePanel() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI goal coach. I can help you think through your objectives, create measurable key results, plan your week, or analyze your progress. What would you like to work on?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        <h3>AI Goal Coach</h3>
        <p className="claude-subtitle">Powered by Claude</p>
        <p className="claude-model">(claude-sonnet-4-5-20250929)</p>
      </div>

      <div className="claude-messages">
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
        <div ref={messagesEndRef} />
      </div>

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
