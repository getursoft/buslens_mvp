import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Headphones, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      content: "Hi! I am Rohan, your personal BusLens booking support companion. 🌟 We aggregate real-time inventories across India's largest operators. Ask me about lowest fare trends, partner verification, or seating layouts! How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to lowest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: data.content || "Apologies, I encountered a temporary network delay. Could you please prompt that again?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'model',
        content: "Sorry, I am having trouble connecting to the support server. Please make sure your dev server is active or try again soon!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSendMessage(input);
  };

  const presetPrompts = [
    { label: "💳 Booking Discount Info", text: "How can I find the cheapest time to travel and best rates?" },
    { label: "🤝 Access Partner Portal", text: "How do I log in or request secure access inside the Partner Portal?" },
    { label: "🔍 Sleeper Berth Layouts", text: "How do I choose between upper and lower decks on AC Sleeper buses?" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white hover:bg-slate-800 p-4.5 rounded-full shadow-2xl transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer border border-slate-700/50"
          id="chatbot-trigger-pill"
        >
          <div className="relative">
            <MessageSquare className="w-5.5 h-5.5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
          </div>
          <span className="text-xs font-black tracking-wide uppercase max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300">
            Talk to Arjun/Rohan
          </span>
        </button>
      )}

      {/* Main Support Panel Wrapper */}
      {isOpen && (
        <div 
          className="bg-white border border-slate-200 w-[360px] sm:w-[400px] h-[520px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-200"
          id="live-support-chatbox"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-blue-150 border-2 border-slate-700 flex items-center justify-center text-slate-800 overflow-hidden bg-gradient-to-tr from-brand-100 to-indigo-100 font-black text-xs">
                  <Headphones className="w-5 h-5 text-slate-700 animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
              </div>
              <div className="text-left">
                <span className="block font-black text-xs text-white tracking-tight flex items-center gap-1.5 leading-none">
                  Rohan
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/20 font-extrabold uppercase scale-90 tracking-wider">
                    HUMAN AGENT
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Commute Service Specialist (Online)</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader info bar */}
          <div className="bg-blue-50/75 border-b border-blue-100 p-2.5 px-4 text-left flex items-center justify-between">
            <span className="text-[10px] text-blue-700 font-bold tracking-tight flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Real-time API & Operator Booking Assistance
            </span>
            <span className="text-[9px] text-slate-400 font-medium font-mono">Response time: &lt;10s</span>
          </div>

          {/* Scrollable messages pane */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] text-left ${
                  m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
                    m.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-sm font-semibold'
                      : 'bg-white text-slate-705 border border-slate-200/80 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[8px] text-slate-400 mt-1 font-bold uppercase tracking-wider font-mono">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold px-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span>Rohan is reviewing listings...</span>
              </div>
            )}
          </div>

          {/* Instant Preset prompt badges inside bottom pane */}
          {messages.length < 3 && (
            <div className="px-4 py-2 border-t border-slate-100 space-y-1 bg-white text-left">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Common Questions</span>
              <div className="flex flex-col gap-1.5 pt-1">
                {presetPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p.text)}
                    className="w-full text-left font-semibold text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-105 border border-blue-100/50 hover:border-blue-200 rounded-xl px-3 py-2 transition flex items-center justify-between cursor-pointer group"
                  >
                    <span>{p.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat form submissions */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 bg-white flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Rohan a question..."
              className="flex-1 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 border border-transparent shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
