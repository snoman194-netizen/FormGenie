
import { jsPDF } from 'jspdf';
import { Bot, BrainCircuit, ChevronDown, FileText, FileType, FormInput, History as HistoryIcon, Loader2, MessageCircle, MessageSquare, Plus, Send, Table, Trash2, User, Wand2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { processDocToQuestionnaire } from '../services/gemini';
import { ChatMessage, ChatSession, FormStructure } from '../types';

interface DocChatProps {
  onTransfer: (form: FormStructure) => void;
  onExit?: () => void;
}

const DocChat: React.FC<DocChatProps> = ({ onTransfer, onExit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState<FormStructure | null>(null);
  const [file, setFile] = useState<{ name: string, data: string, type: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Persistence: Load
  useEffect(() => {
    const savedMessages = localStorage.getItem('formGenie_docchat_active_chat');
    const savedHistory = localStorage.getItem('formGenie_docchat_history');

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) { console.error(e); }
    }

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) { console.error(e); }
    }
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('formGenie_docchat_active_chat', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('formGenie_docchat_history', JSON.stringify(history));
  }, [history]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollButton(!isAtBottom);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        setFile({
          name: selected.name,
          type: selected.type || 'application/octet-stream',
          data: readerEvent.target?.result as string
        });
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !file) || isLoading) return;

    const userText = input || (file ? `Analyze this document: ${file.name}` : "");
    const newUserMsg: ChatMessage = { role: 'user', content: userText, timestamp: Date.now() };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await processDocToQuestionnaire(userText, messages, file ? { data: file.data, mimeType: file.type } : undefined, isDeepThink);
      
      const assistantMsg: ChatMessage = { role: 'assistant', content: res.text, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      
      if (res.questionnaire) {
        setCurrentQuestionnaire(res.questionnaire);
      }
      setFile(null);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error while processing your document. Please try again or check the file format.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const session: ChatSession = {
        id: Math.random().toString(36).substr(2, 9),
        title: messages[0]?.content.slice(0, 40) || "Document Analysis",
        messages: [...messages],
        updatedAt: Date.now()
      };
      setHistory(prev => [session, ...prev]);
    }
    setMessages([]);
    setCurrentQuestionnaire(null);
    localStorage.removeItem('formGenie_docchat_active_chat');
    setShowHistory(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(s => s.id !== id));
  };

  const exportCSV = () => {
    if (!currentQuestionnaire) return;
    let csv = "Question,Type,Options,Required,Help Text\n";
    currentQuestionnaire.questions.forEach(q => {
      const options = q.options?.join(" | ") || "";
      csv += `"${q.title.replace(/"/g, '""')}","${q.type}","${options.replace(/"/g, '""')}","${q.required}","${(q.helpText || "").replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentQuestionnaire.title.replace(/\s+/g, '_')}_Questionnaire.csv`;
    a.click();
  };

  const exportPDF = () => {
    if (!currentQuestionnaire) return;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text(currentQuestionnaire.title, 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(currentQuestionnaire.description, 20, y, { maxWidth: 170 });
    y += 20;
    
    currentQuestionnaire.questions.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${q.title}${q.required ? ' *' : ''}`, 20, y, { maxWidth: 170 });
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Type: ${q.type}`, 25, y);
      y += 5;
      if (q.options?.length) {
        q.options.forEach(opt => {
          doc.text(`- ${opt}`, 30, y);
          y += 5;
        });
      }
      y += 10;
    });
    doc.save(`${currentQuestionnaire.title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[80vh] sm:h-[75vh] max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-500 relative">
      
      {/* History Sidebar (Responsive toggle on mobile) */}
      <div className={`absolute lg:relative z-30 lg:z-auto inset-y-0 left-0 w-72 bg-gray-50 border-r border-gray-100 shrink-0 transform transition-transform duration-300 ${showHistory ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-black text-gray-900 flex items-center space-x-2 text-xs uppercase tracking-widest">
            <HistoryIcon size={16} className="text-indigo-600" />
            <span>Chat History</span>
          </h4>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleNewChat}
              className="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all"
              title="Start New Analysis"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => setShowHistory(false)}
              className="p-2 text-gray-400 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {history.length > 0 ? (
            history.map((session) => (
              <div 
                key={session.id}
                onClick={() => {
                  setMessages(session.messages);
                  localStorage.setItem('formGenie_docchat_active_chat', JSON.stringify(session.messages));
                  if (window.innerWidth < 1024) setShowHistory(false);
                }}
                className="p-4 rounded-2xl bg-white border border-transparent hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group relative"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-400">
                    <MessageCircle size={16} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{session.title}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(session.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => deleteSession(session.id, e)}
                  className="absolute right-2 top-2 p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all text-gray-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30 grayscale pointer-events-none">
              <HistoryIcon size={40} className="mb-4" />
              <p className="text-[11px] font-black uppercase tracking-widest">Empty History</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex flex-col overflow-hidden bg-white">
        <div className="flex flex-grow overflow-hidden flex-col md:flex-row">
          {/* Chat Area */}
          <div className="flex-grow flex flex-col min-w-0 border-r border-gray-100 bg-white relative h-full">
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center space-x-3 text-indigo-600">
                <button 
                  onClick={() => setShowHistory(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                >
                  <HistoryIcon size={20} />
                </button>
                <div className="bg-indigo-100 p-2 rounded-lg hidden sm:block">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-none text-sm sm:text-base">Document Analyst</h3>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                    Gemini 3 Pro
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button 
                  onClick={() => setIsDeepThink(!isDeepThink)}
                  className={`flex items-center space-x-1 sm:space-x-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl ${isDeepThink ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <BrainCircuit size={14} className={isDeepThink ? 'animate-pulse sm:w-4 sm:h-4' : 'sm:w-4 sm:h-4'} />
                  <span>{isDeepThink ? 'Thinking' : 'Deep Think'}</span>
                </button>

                {onExit && (
                  <button 
                    onClick={onExit}
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-medium text-xs"
                    title="Exit Chat"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-grow relative overflow-hidden flex flex-col h-full">
              {showScrollButton && (
                <button 
                  onClick={scrollToBottom}
                  className="absolute bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-2xl z-20 hover:scale-110 transition-all animate-bounce"
                  title="Scroll to bottom"
                >
                  <ChevronDown size={24} />
                </button>
              )}

              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar bg-gray-50/20"
              >
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto p-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600">
                      <FileType size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-base sm:text-lg">Start Analysis</h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">Upload a doc or describe your form needs to begin.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full mt-4">
                      {["Extract questions", "Draft a quiz"].map(item => (
                        <button 
                          key={item} 
                          onClick={() => setInput(`Help me create a ${item.toLowerCase()} based on my document.`)}
                          className="text-[10px] sm:text-[11px] font-medium text-gray-600 bg-white border border-gray-200 py-2 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex max-w-[95%] sm:max-w-[85%] space-x-2 sm:space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm ${m.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-100 text-indigo-600'}`}>
                        {m.role === 'user' ? <User size={12} className="sm:w-3.5 sm:h-3.5" /> : <Bot size={12} className="sm:w-3.5 sm:h-3.5" />}
                      </div>
                      <div className={`p-3 sm:p-4 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none whitespace-pre-wrap'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Bot size={12} className="sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium ml-1">AI Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-white border-t border-gray-100 z-10">
              {file && (
                <div className="mb-3 p-2 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center space-x-2 text-indigo-700 pl-2">
                    <FileText size={16} />
                    <span className="text-[11px] font-bold truncate max-w-[150px] sm:max-w-[200px]">{file.name}</span>
                  </div>
                  <button 
                    onClick={() => setFile(null)} 
                    className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 sm:p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Attach Document"
                >
                  <FileType size={20} className="sm:w-5.5 sm:h-5.5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                <div className="flex-grow relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask analyst..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl pl-4 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-[13px] sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && !file)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-indigo-600 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-md"
                  >
                    <Send size={16} className="sm:w-4.5 sm:h-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Result Preview Side Panel (Visible results only when currentQuestionnaire exists on mobile, or always on desktop) */}
          <div className={`w-full md:w-80 flex flex-col bg-white border-l border-gray-100 ${!currentQuestionnaire ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between text-gray-800 font-bold">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                  <Wand2 size={16} />
                </div>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest">Extracted Form</span>
              </div>
              {currentQuestionnaire && (
                <button onClick={() => setCurrentQuestionnaire(null)} className="lg:hidden p-1 text-gray-400">
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {!currentQuestionnaire ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-50 grayscale">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300">
                    <FormInput size={24} />
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-gray-400">Blueprint preview will appear here in real-time.</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 text-[13px] sm:text-sm leading-snug">{currentQuestionnaire.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">{currentQuestionnaire.description}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Questions</p>
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{currentQuestionnaire.questions.length}</span>
                    </div>
                    {currentQuestionnaire.questions.slice(0, 5).map((q, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 text-[10px] sm:text-[11px] flex items-center space-x-2.5 hover:border-indigo-200 transition-colors shadow-sm">
                        <div className="w-4 h-4 bg-gray-50 rounded flex items-center justify-center font-bold text-gray-400 text-[8px] shrink-0">
                          {idx + 1}
                        </div>
                        <span className="truncate flex-grow text-gray-700 font-medium">{q.title}</span>
                      </div>
                    ))}
                    {currentQuestionnaire.questions.length > 5 && (
                      <p className="text-center text-[9px] font-bold text-gray-300 py-1">+{currentQuestionnaire.questions.length - 5} more fields</p>
                    )}
                  </div>

                  <div className="pt-4 sm:pt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={exportCSV}
                        className="flex items-center justify-center space-x-2 bg-white border border-gray-200 py-2 sm:py-2.5 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <Table size={14} /> <span>CSV</span>
                      </button>
                      <button 
                        onClick={exportPDF}
                        className="flex items-center justify-center space-x-2 bg-white border border-gray-200 py-2 sm:py-2.5 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <FileText size={14} /> <span>PDF</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => onTransfer(currentQuestionnaire)}
                      className="w-full flex items-center justify-center space-x-2 bg-indigo-600 py-3 sm:py-3.5 rounded-2xl text-[10px] sm:text-[11px] font-bold text-white hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]"
                    >
                      <FormInput size={15} /> <span>Import Blueprint</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocChat;
