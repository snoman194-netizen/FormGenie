
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Table, FileType, Loader2, Wand2, FormInput, MessageSquare, Bot, User, X, LogOut } from 'lucide-react';
import { processDocToQuestionnaire } from '../services/gemini';
import { FormStructure, ChatMessage } from '../types';
import { jsPDF } from 'jspdf';

interface DocChatProps {
  onTransfer: (form: FormStructure) => void;
  onExit?: () => void;
}

const DocChat: React.FC<DocChatProps> = ({ onTransfer, onExit }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState<FormStructure | null>(null);
  const [file, setFile] = useState<{ name: string, data: string, type: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await processDocToQuestionnaire(userText, messages, file ? { data: file.data, mimeType: file.type } : undefined);
      
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
    <div className="flex flex-col h-[75vh] max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-grow overflow-hidden">
        {/* Chat Area */}
        <div className="flex-grow flex flex-col min-w-0 border-r border-gray-100 bg-gray-50/30">
          <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-none">Document Analyst</h3>
                <p className="text-[10px] text-gray-500 mt-1 font-medium flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  Powered by Gemini 3 Flash
                </p>
              </div>
            </div>
            
            {onExit && (
              <button 
                onClick={onExit}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-medium text-xs group"
                title="Exit Chat"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Exit Chat</span>
                <X size={20} />
              </button>
            )}
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600">
                  <FileType size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Start your analysis</h4>
                  <p className="text-sm text-gray-500 mt-2">Upload a document or describe your needs to build a custom questionnaire.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-4">
                  {["Extract questions", "Draft a quiz", "Job application", "Customer survey"].map(item => (
                    <button 
                      key={item} 
                      onClick={() => setInput(`Help me create a ${item.toLowerCase()} based on my document.`)}
                      className="text-[11px] font-medium text-gray-600 bg-white border border-gray-200 py-2 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex max-w-[85%] space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${m.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-100 text-indigo-600'}`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                    <span className="text-xs text-gray-400 font-medium ml-1">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            {file && (
              <div className="mb-3 p-2 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-2 text-indigo-700 pl-2">
                  <FileText size={16} />
                  <span className="text-xs font-bold truncate max-w-[200px]">{file.name}</span>
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
                className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Attach Document"
              >
                <FileType size={22} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for an analysis or refinement..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && !file)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-md shadow-indigo-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Result Preview Side Panel */}
        <div className="w-80 flex flex-col bg-white border-l border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center space-x-2 text-gray-800 font-bold">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <Wand2 size={16} />
            </div>
            <span>Extracted Form</span>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {!currentQuestionnaire ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-50 grayscale">
                <div className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300">
                  <FormInput size={24} />
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-gray-400">Analysis results will appear here in real-time as you chat.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group relative">
                  <h4 className="font-bold text-gray-900 text-sm leading-snug">{currentQuestionnaire.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-2 line-clamp-3 leading-relaxed">{currentQuestionnaire.description}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Questions</p>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{currentQuestionnaire.questions.length}</span>
                  </div>
                  {currentQuestionnaire.questions.slice(0, 6).map((q, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 text-[11px] flex items-center space-x-3 hover:border-indigo-200 transition-colors shadow-sm">
                      <div className="w-5 h-5 bg-gray-50 rounded flex items-center justify-center font-bold text-gray-400 text-[9px] shrink-0">
                        {idx + 1}
                      </div>
                      <span className="truncate flex-grow text-gray-700 font-medium">{q.title}</span>
                    </div>
                  ))}
                  {currentQuestionnaire.questions.length > 6 && (
                    <p className="text-center text-[10px] font-bold text-gray-300 py-2">+{currentQuestionnaire.questions.length - 6} more fields detected</p>
                  )}
                </div>

                <div className="pt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={exportCSV}
                      className="flex items-center justify-center space-x-2 bg-white border border-gray-200 py-2.5 rounded-xl text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <Table size={14} /> <span>CSV</span>
                    </button>
                    <button 
                      onClick={exportPDF}
                      className="flex items-center justify-center space-x-2 bg-white border border-gray-200 py-2.5 rounded-xl text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <FileText size={14} /> <span>PDF</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => onTransfer(currentQuestionnaire)}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 py-3.5 rounded-2xl text-[11px] font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                  >
                    <FormInput size={15} /> <span>Import to Editor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocChat;
