import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat_messages');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        { role: 'assistant', content: 'Hello! I am your dashboard AI. I can answer questions about the current ISS location and the latest news articles shown on your dashboard. How can I help?' }
      ]);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // Persist last 30 messages
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages.slice(-30)));
    }
  }, [messages, isOpen]);

  const clearChat = () => {
    const defaultMsg = [{ role: 'assistant', content: 'Chat cleared. How can I help you with the dashboard data?' }];
    setMessages(defaultMsg);
    localStorage.setItem('chat_messages', JSON.stringify(defaultMsg));
    toast.success('Chat cleared');
  };

  const getDashboardContext = () => {
    // Collect ISS Data
    const speedHistory = JSON.parse(localStorage.getItem('iss_speed_history') || '[]');
    const currentSpeed = speedHistory.length > 0 ? speedHistory[speedHistory.length - 1].speed.toFixed(2) : 'Unknown';
    
    // Collect News Data
    const cachedNews = JSON.parse(localStorage.getItem('cached_news') || '{"articles":[]}').articles || [];
    const newsSummary = cachedNews.map((a, i) => `${i+1}. ${a.title} (Source: ${a.source?.name})`).join('\n');

    return `CURRENT DASHBOARD DATA:
ISS Speed: ${currentSpeed} km/h
Total News Articles Loaded: ${cachedNews.length}
Latest Headlines:
${newsSummary}

RULE: You are a helpful AI assistant for this dashboard. You MUST ONLY answer questions based on the "CURRENT DASHBOARD DATA" provided above. If the user asks something outside of this data or outside of internet knowledge, you must politely decline and state you only have knowledge of the dashboard's current state. DO NOT guess. DO NOT use external knowledge. Keep answers concise.`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const context = getDashboardContext();
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, userMsg })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Server Error');

      let aiText = data.text.trim();
      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to get AI response');
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the AI model. Please check your token or try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-card text-card-foreground border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px', maxHeight: 'calc(100vh - 48px)' }}>
        
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold">
            <Bot className="h-5 w-5" />
            Dashboard AI
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-1.5 hover:bg-white/20 rounded transition" title="Clear Chat">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded transition" title="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted border border-border rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted border border-border p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-border bg-background flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about ISS or News..."
            className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </>
  );
}
