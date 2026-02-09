
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Minimize2, Maximize2, MessageSquare, X, SkipForward, ChevronDown, History as HistoryIcon, Plus, Trash2, MessageCircle, BrainCircuit } from 'lucide-react';
import { chatWithAssistant } from '../services/gemini';
import { ChatMessage, ChatSession } from '../types';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [isWaitingForField, setIsWaitingForField] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Persistence: Load on Mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('formGenie_assistant_active_chat');
    const savedHistory = localStorage.getItem('formGenie_assistant_history');
    
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to restore session chat", e);
      }
    } else {
      setMessages([{ role: 'assistant', content: 'Hi! I am FormGenie Assistant. How can I help you build your Google Form or draft a legal document today?', timestamp: Date.now() }]);
    }

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to restore assistant history", e);
      }
    }
  }, []);

  // Persistence: Save on Change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('formGenie_assistant_active_chat', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('formGenie_assistant_history', JSON.stringify(history));
  }, [history]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  const processResponse = (text: string) => {
    if (text.includes('[FIELD_QUERY]')) {
      setIsWaitingForField(true);
      return text.replace('[FIELD_QUERY]', '').trim();
    } else {
      setIsWaitingForField(false);
      return text;
    }
  };

  const handleSend = async (forcedInput?: string) => {
    const textToSend = forcedInput !== undefined ? forcedInput : input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = updatedMessages.map(m => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.content }]
      }));

      const responseText = await chatWithAssistant(textToSend, historyPayload, isDeepThink);
      const cleanedResponse = processResponse(responseText || "");
      
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: cleanedResponse || "I'm not sure how to respond to that.", 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please check your connection and try again.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 1) {
      const session: ChatSession = {
        id: Math.random().toString(36).substr(2, 9),
        title: messages[1]?.content.slice(0, 40) || "Session Draft",
        messages: [...messages],
        updatedAt: Date.now()
      };
      setHistory(prev => [session, ...prev]);
    }
    
    const initialMsg: ChatMessage = { role: 'assistant', content: 'Starting a new session. How can I help you now?', timestamp: Date.now() };
    setMessages([initialMsg]);
    setView('chat');
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setView('chat');
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(s => s.id !== id));
  };

  const handleSkip = () => {
    handleSend("Skip this field.");
  };

  if (isHidden) return null;

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 group z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-4 sm:p-5 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all hover:scale-110 flex items-center justify-center animate-in zoom-in duration-300"
        >
          <MessageSquare size={28} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsHidden(true);
          }}
          className="absolute -top-1 -right-1 bg-white border border-gray-100 text-gray-400 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:scale-110 sm:p-1.5"
          title="Dismiss Assistant"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed z-[60] transition-all duration-300 flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 bg-white shadow-2xl
      ${isMinimized 
        ? 'bottom-6 right-6 w-72 h-16 sm:bottom-8 sm:right-8 sm:w-[400px] sm:h-20 rounded-2xl' 
        : 'bottom-0 right-0 w-full h-[100dvh] sm:bottom-8 sm:right-8 sm:w-[450px] sm:h-[650px] sm:max-h-[85vh] sm:rounded-[32px]'
      }`}>
      
      {/* Header */}
      <div className={`bg-indigo-600 text-white flex items-center justify-between shrink-0 transition-all ${isMinimized ? 'p-3 sm:p-4 h-full' : 'p-5 sm:p-6'}`}>
        <div className="flex items-center space-x-3">
          <div className={`bg-white/20 rounded-xl flex items-center justify-center transition-all ${isMinimized ? 'p-1.5' : 'p-2.5'}`}>
            <Bot size={isMinimized ? 16 : 22} />
          </div>
          <div>
            <h3 className={`font-black tracking-tight leading-none ${isMinimized ? 'text-xs' : 'text-base'}`}>FormGenie AI</h3>
            {!isMinimized && <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mt-1">Assistant Online</p>}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {!isMinimized && (
            <button 
              onClick={() => setView(view === 'history' ? 'chat' : 'history')}
              className={`p-2.5 rounded-xl transition-all ${view === 'history' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="Chat History"
            >
              <HistoryIcon size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all hidden sm:block" 
            title={isMinimized ? "Restore" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
          <button 
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }} 
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all" 
            title="Close Chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-grow flex flex-col relative overflow-hidden">
          {view === 'chat' ? (
            <>
              {/* Scroll Down Hint */}
              {showScrollButton && (
                <button 
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-6 p-2.5 bg-indigo-600 text-white rounded-full shadow-xl z-20 hover:scale-110 transition-all animate-bounce"
                  title="Scroll to latest"
                >
                  <ChevronDown size={22} />
                </button>
              )}

              {/* Messages */}
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-5 bg-gray-50/50 custom-scrollbar"
              >
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[90%] sm:max-w-[85%] space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm mt-1 ${m.role === 'user' ? 'bg-indigo-500' : 'bg-indigo-600'}`}>
                        {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none whitespace-pre-wrap shadow-gray-200/50'}`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <Bot size={14} />
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex space-x-1.5">
                          <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                          <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 sm:p-5 bg-white border-t border-gray-100 shrink-0 z-10 space-y-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between px-1">
                  <button 
                    onClick={() => setIsDeepThink(!isDeepThink)}
                    className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-full ${isDeepThink ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  >
                    <BrainCircuit size={16} className={isDeepThink ? 'animate-pulse' : ''} />
                    <span>Deep Think</span>
                  </button>
                  {isDeepThink && <span className="text-[10px] font-bold text-indigo-400 animate-pulse hidden sm:inline">Advanced Reasoning Active</span>}
                </div>
                
                <div className="flex items-center space-x-2 pb-2 sm:pb-0">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isWaitingForField ? "Enter details..." : "Ask me anything..."}
                    className="flex-grow bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium placeholder:text-gray-400"
                  />
                  
                  <div className="flex space-x-2">
                    {isWaitingForField && (
                      <button 
                        onClick={handleSkip}
                        disabled={isLoading}
                        className="p-3.5 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center border border-gray-200"
                        title="Skip Field"
                      >
                        <SkipForward size={22} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center"
                    >
                      <Send size={22} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col bg-white animate-in slide-in-from-right-4 duration-300">
              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <h4 className="font-black text-gray-900 flex items-center space-x-2 text-sm sm:text-base">
                  <HistoryIcon size={20} className="text-indigo-600" />
                  <span>Past Sessions</span>
                </h4>
                <button 
                  onClick={handleNewChat}
                  className="bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                >
                  <Plus size={16} className="mr-2" /> New Chat
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.length > 0 ? (
                  history.map((session) => (
                    <div 
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className="p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group relative active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-white rounded-xl text-indigo-400 group-hover:text-indigo-600 shadow-sm">
                          <MessageCircle size={18} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate pr-8">{session.title}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-tight">{new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-gray-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                    <HistoryIcon size={56} className="text-gray-200 mb-4" />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No History</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Archived sessions will appear here.</p>
                  </div>
                )}
              </div>
              
              <div className="p-5 border-t border-gray-100 bg-white">
                <button 
                  onClick={() => setView('chat')}
                  className="w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-100 transition-all active:scale-[0.98]"
                >
                  Return to Active Chat
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBot;
