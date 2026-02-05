
import { Bot, BrainCircuit, ChevronDown, History as HistoryIcon, Maximize2, MessageCircle, MessageSquare, Minimize2, Plus, Send, SkipForward, Trash2, User, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 group z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-4 sm:p-5 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all hover:scale-110 flex items-center justify-center animate-in zoom-in duration-300 ring-4 ring-indigo-100/50"
        >
          <MessageSquare size={24} className="sm:w-7 sm:h-7" />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsHidden(true);
          }}
          className="absolute -top-2 -right-2 bg-white border border-gray-100 text-gray-400 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:scale-110"
          title="Dismiss Assistant"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:right-8 sm:bottom-8 w-auto sm:w-[400px] bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl z-50 transition-all duration-300 flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 ${isMinimized ? 'h-16 sm:h-20' : 'h-[75vh] sm:h-[550px]'}`}>
      {/* Header */}
      <div className="bg-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Bot size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tight">FormGenie AI</h3>
            <p className="hidden sm:block text-[10px] text-indigo-100 font-bold uppercase tracking-widest">Assistant Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setView(view === 'history' ? 'chat' : 'history')}
            className={`p-2 rounded-xl transition-all ${view === 'history' ? 'bg-white/20' : 'hover:bg-white/10'}`}
            title="Chat History"
          >
            <HistoryIcon size={18} />
          </button>
          {!isMinimized && (
            <button 
              onClick={() => setIsMinimized(true)} 
              className="p-2 hover:bg-white/10 rounded-xl transition-all hidden sm:block" 
              title="Minimize"
            >
              <Minimize2 size={18} />
            </button>
          )}
          {isMinimized && (
            <button 
              onClick={() => setIsMinimized(false)} 
              className="p-2 hover:bg-white/10 rounded-xl transition-all" 
              title="Restore"
            >
              <Maximize2 size={18} />
            </button>
          )}
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 hover:bg-white/10 rounded-xl transition-all" 
            title="Close Chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-grow flex flex-col relative overflow-hidden bg-white">
          {view === 'chat' ? (
            <>
              {/* Scroll Down Hint */}
              {showScrollButton && (
                <button 
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-4 sm:right-6 p-2 bg-indigo-600 text-white rounded-full shadow-xl z-20 hover:scale-110 transition-all animate-bounce"
                  title="Scroll to latest"
                >
                  <ChevronDown size={20} />
                </button>
              )}

              {/* Messages */}
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50/50 custom-scrollbar"
              >
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[90%] sm:max-w-[85%] space-x-2 sm:space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-sm ${m.role === 'user' ? 'bg-indigo-500' : 'bg-indigo-600'}`}>
                        {m.role === 'user' ? <User size={12} className="sm:w-4 sm:h-4" /> : <Bot size={12} className="sm:w-4 sm:h-4" />}
                      </div>
                      <div className={`p-3 sm:p-4 rounded-2xl text-[13px] sm:text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none whitespace-pre-wrap'}`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <Bot size={12} className="sm:w-4 sm:h-4" />
                      </div>
                      <div className="bg-white border border-gray-100 p-3 sm:p-4 rounded-2xl rounded-tl-none shadow-sm">
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
              <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0 z-10 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between px-1 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setIsDeepThink(!isDeepThink)}
                    className={`flex items-center space-x-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap ${isDeepThink ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  >
                    <BrainCircuit size={12} className={isDeepThink ? 'animate-pulse sm:w-3.5 sm:h-3.5' : 'sm:w-3.5 sm:h-3.5'} />
                    <span>Deep Think</span>
                  </button>
                  {isDeepThink && <span className="hidden sm:inline text-[10px] font-bold text-indigo-400 animate-pulse">Maximum IQ Active</span>}
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isWaitingForField ? "Details or skip..." : "Need help?"}
                    className="flex-grow bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                  
                  <div className="flex space-x-1 sm:space-x-2">
                    {isWaitingForField && (
                      <button 
                        onClick={handleSkip}
                        disabled={isLoading}
                        className="p-2.5 sm:p-3 bg-gray-100 text-gray-500 rounded-xl sm:rounded-2xl hover:bg-gray-200 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center"
                        title="Skip Field"
                      >
                        <SkipForward size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center"
                    >
                      <Send size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col bg-white animate-in slide-in-from-right-4 duration-300">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-black text-gray-900 flex items-center space-x-2 text-sm sm:text-base">
                  <HistoryIcon size={18} className="text-indigo-600" />
                  <span>Past Sessions</span>
                </h4>
                <button 
                  onClick={handleNewChat}
                  className="bg-indigo-50 text-indigo-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus size={14} className="mr-1 sm:mr-2" /> New Chat
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 custom-scrollbar">
                {history.length > 0 ? (
                  history.map((session) => (
                    <div 
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className="p-3 sm:p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group relative"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg text-indigo-400 group-hover:text-indigo-600">
                          <MessageCircle size={16} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-[13px] sm:text-sm font-bold text-gray-900 truncate">{session.title}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(session.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-10 opacity-40">
                    <HistoryIcon size={40} className="text-gray-200 mb-4 sm:w-12 sm:h-12" />
                    <p className="text-xs sm:text-sm font-black text-gray-400">No session history found</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-2">Archived chats appear here.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100">
                <button 
                  onClick={() => setView('chat')}
                  className="w-full py-2 sm:py-3 text-xs sm:text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  Back to Active Chat
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
