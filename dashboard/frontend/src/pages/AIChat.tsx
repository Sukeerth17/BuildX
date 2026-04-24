import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { OLLAMA_CHAT_URL } from '../api/client';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const token = useStore((state) => state.token);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starters = [
    "Why did our GDPR score drop?",
    "What are our top 3 critical risks?",
    "Which files need the most urgent attention?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;

    const newMsg: Message = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsStreaming(true);

    const assistantMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    try {
      const response = await fetch(OLLAMA_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error("Failed to connect to AI");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          setMessages(prev => prev.map(msg => {
            if (msg.id === assistantMsgId) {
              return { ...msg, content: msg.content + chunk };
            }
            return msg;
          }));
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMsgId) {
          return { ...msg, content: msg.content + "\n[Error: AI service is currently offline or unreachable.]" };
        }
        return msg;
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <h2 style={{ marginTop: 0, marginBottom: '24px' }}>AI Compliance Assistant</h2>
      
      <div className="card glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3>How can I help you with compliance today?</h3>
            </div>
          )}
          
          {messages.map(msg => (
            <div key={msg.id} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-dark)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              maxWidth: '70%',
              border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none'
            }}>
              {msg.role === 'assistant' ? (
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {msg.content}
                </div>
              ) : (
                <div>{msg.content}</div>
              )}
            </div>
          ))}
          
          {isStreaming && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>
              AI is typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {starters.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSubmit(s)}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)',
                    color: 'white', padding: '8px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '12px'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(input); }}
              placeholder="Ask about compliance risks, GDPR, SOC 2..."
              disabled={isStreaming}
              style={{
                flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-dark)', color: 'white', fontSize: '16px'
              }}
            />
            <button 
              onClick={() => handleSubmit(input)}
              disabled={isStreaming || !input.trim()}
              style={{
                padding: '0 24px', borderRadius: '8px', border: 'none', background: 'var(--accent-blue)',
                color: 'white', fontWeight: 'bold', cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isStreaming || !input.trim() ? 0.5 : 1
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
