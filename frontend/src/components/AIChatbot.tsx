// AI Chatbot Component - Intelligent Library Assistant
// Provides instant help, book recommendations, and answers to library questions

import React, { useState, useEffect, useRef } from 'react';
import { chatWithAI } from '../api/apiClient';
import '../styles/AIChatbot.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! 👋 I'm your AI library assistant. I can help you find books, get recommendations, check availability, or answer general library questions. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(`conv_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response: any = await chatWithAI(inputMessage, conversationId);
      
      if (response.success) {
        const aiMessage: Message = {
          id: `msg_${Date.now()}_ai`,
          text: response.data.response,
          sender: 'ai',
          timestamp: new Date(response.data.timestamp),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        text: "I'm sorry, I encountered an error. Please try again or contact library staff for assistance.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: '📚 Recommend a book', message: 'Can you recommend a book for me?' },
    { label: '🔍 Find books', message: 'Help me find a book' },
    { label: '✅ Check availability', message: 'How many books are available?' },
    { label: '❓ Library hours', message: 'What are your hours?' },
  ];

  const handleQuickAction = (message: string) => {
    setInputMessage(message);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <span className="ai-icon">🤖</span>
          <div>
            <h3>AI Library Assistant</h3>
            <span className="status">● Online</span>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">
              {message.sender === 'ai' && <span className="message-avatar">🤖</span>}
              <div className="message-bubble">
                <p>{message.text}</p>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {message.sender === 'user' && <span className="message-avatar">👤</span>}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">
              <span className="message-avatar">🤖</span>
              <div className="message-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <div className="quick-actions">
          <p className="quick-actions-label">Quick actions:</p>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action.message)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="chatbot-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputMessage.trim()}>
          <span className="send-icon">➤</span>
        </button>
      </form>
    </div>
  );
};

// Chatbot Toggle Button Component - Default Export
const ChatbotToggle: React.FC = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  useEffect(() => {
    // Show a hint after 3 seconds if chatbot hasn't been opened
    const timer = setTimeout(() => {
      if (!isChatbotOpen) {
        setHasNewMessage(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isChatbotOpen]);

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
    setHasNewMessage(false);
  };

  return (
    <>
      <button
        className={`chatbot-toggle-btn ${hasNewMessage ? 'has-notification' : ''}`}
        onClick={toggleChatbot}
        aria-label="Open AI Assistant"
      >
        {isChatbotOpen ? '✕' : '🤖'}
        {hasNewMessage && <span className="notification-badge">!</span>}
      </button>
      
      <AIChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </>
  );
};

export default ChatbotToggle;
