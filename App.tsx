
import React, { useState, useEffect } from 'react';
import { Sparkles, FormInput, FileJson, Info, LayoutGrid, MessageSquareQuote, Search, History as HistoryIcon, Home, LogOut } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FormPreview from './components/FormPreview';
import ChatBot from './components/ChatBot';
import CodePreview from './components/CodePreview';
import DataPreview from './components/DataPreview';
import DocChat from './components/DocChat';
import SearchTab from './components/SearchTab';
import HistoryTab from './components/HistoryTab';
import HomeTab from './components/HomeTab';
import Onboarding from './components/Onboarding';
import { convertFileToForm } from './services/gemini';
import { FormStructure, SavedForm } from './types';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawCsvData, setRawCsvData] = useState<string[][] | null>(null);
  const [pendingFile, setPendingFile] = useState<{file: any, content: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'standard' | 'docchat' | 'search' | 'history'>('home');
  const [history, setHistory] = useState<SavedForm[]>([]);

  // Load user and history from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('formGenieUserName');
    const savedAuth = localStorage.getItem('formGenieIsAuthenticated');
    if (savedName && savedAuth === 'true') {
      setUserName(savedName);
      setIsAuthenticated(true);
    }

    const savedHistory = localStorage.getItem('formGenieHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('formGenieHistory', JSON.stringify(history));
  }, [history]);

  const handleLoginComplete = (name: string) => {
    setUserName(name);
    setIsAuthenticated(true);
    localStorage.setItem('formGenieUserName', name);
    localStorage.setItem('formGenieIsAuthenticated', 'true');
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out? Your current chat sessions will be cleared.")) {
      setUserName(null);
      setIsAuthenticated(false);
      
      // Clear all user data
      localStorage.removeItem('formGenieUserName');
      localStorage.removeItem('formGenieIsAuthenticated');
      localStorage.removeItem('formGenieHistory');
      
      // Clear Chat Data
      localStorage.removeItem('formGenie_assistant_active_chat');
      localStorage.removeItem('formGenie_assistant_history');
      localStorage.removeItem('formGenie_docchat_active_chat');
      localStorage.removeItem('formGenie_docchat_history');
      
      // Reset App State
      setFormStructure(null);
      setHistory([]);
      setActiveTab('home');
    }
  };

  const saveToHistory = (structure: FormStructure) => {
    const newEntry: SavedForm = {
      ...structure,
      historyId: Math.random().toString(36).substr(2, 9),
      savedAt: Date.now()
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50 entries
  };

  const handleUpload = async (file: any, content: string) => {
    setError(null);
    
    if (file.type === 'text/csv' || (file.name && file.name.endsWith('.csv'))) {
      const rows = content.split('\n')
        .map(row => row.split(',').map(cell => cell.trim().replace(/^"|^"|"$/g, '')))
        .filter(row => row.length > 1 || row[0] !== '');
      
      setRawCsvData(rows);
      setPendingFile({ file, content });
    } else {
      processFile(file, content);
    }
  };

  const processFile = async (file: any, content: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const structure = await convertFileToForm(content, file.type, file.name);
      setFormStructure(structure);
      saveToHistory(structure);
      setRawCsvData(null);
      setPendingFile(null);
    } catch (err) {
      setError("Failed to process file. Make sure it's a valid format and readable.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocTransfer = (structure: FormStructure) => {
    setFormStructure(structure);
    saveToHistory(structure);
    setActiveTab('standard');
  };

  const handleSelectHistoryItem = (saved: SavedForm) => {
    const { historyId, savedAt, ...structure } = saved;
    setFormStructure(structure);
    setActiveTab('standard');
  };

  const handleDeleteHistoryItem = (historyId: string) => {
    setHistory(prev => prev.filter(item => item.historyId !== historyId));
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (!isAuthenticated) {
    return <Onboarding onComplete={handleLoginComplete} />;
  }

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-100 animate-in fade-in duration-1000">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                <Sparkles className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                FormGenie
              </span>
            </div>
            
            <div className="hidden md:flex h-8 w-px bg-gray-100 mx-2" />
            
            <div className="hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">{getGreeting()},</p>
              <p className="text-sm font-black text-indigo-600 tracking-tight">{userName}! ✨</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-gray-100/80 p-1.5 rounded-2xl backdrop-blur-sm">
              <button 
                onClick={() => setActiveTab('home')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Home size={18} />
                <span className="hidden lg:inline">Home</span>
              </button>
              <button 
                onClick={() => setActiveTab('standard')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'standard' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid size={18} />
                <span className="hidden lg:inline">Lab</span>
              </button>
              <button 
                onClick={() => setActiveTab('docchat')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'docchat' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <MessageSquareQuote size={18} />
                <span className="hidden lg:inline">AI Chat</span>
              </button>
              <button 
                onClick={() => setActiveTab('search')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'search' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Search size={18} />
                <span className="hidden lg:inline">Search</span>
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <HistoryIcon size={18} />
                <span className="hidden lg:inline">History</span>
              </button>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'home' ? (
          <HomeTab 
            onNavigate={setActiveTab} 
            history={history} 
            onSelectHistory={handleSelectHistoryItem} 
          />
        ) : activeTab === 'docchat' ? (
          <DocChat onTransfer={handleDocTransfer} onExit={() => setActiveTab('home')} />
        ) : activeTab === 'search' ? (
          <SearchTab onTransfer={handleDocTransfer} />
        ) : activeTab === 'history' ? (
          <HistoryTab 
            history={history} 
            onSelect={handleSelectHistoryItem} 
            onDelete={handleDeleteHistoryItem}
            onClear={handleClearHistory}
          />
        ) : (
          <>
            {!formStructure ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-16 py-10">
                {!rawCsvData ? (
                  <>
                    <div className="text-center space-y-6 max-w-3xl">
                      <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                        <Sparkles size={14} /> <span>Built for Professionals</span>
                      </div>
                      <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                        Convert data to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Google Forms</span>
                      </h1>
                      <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Effortlessly transform CSV data or complex PDF documents into structured surveys. Powered by Gemini AI for perfect pattern matching.
                      </p>
                    </div>

                    <FileUploader onUpload={handleUpload} isProcessing={isProcessing} />

                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center animate-slide-in">
                        <Info size={20} className="mr-3 shrink-0" />
                        <span className="text-sm font-bold">{error}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-12">
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                          <FileJson size={24} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Cloud Driven</h3>
                        <p className="text-sm text-gray-500 mt-3 leading-relaxed font-medium">Connect directly to Google Drive to import source files or save your final scripts securely.</p>
                      </div>
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-violet-50/50 transition-all">
                        <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mb-6">
                          <Sparkles size={24} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Neural Analysis</h3>
                        <p className="text-sm text-gray-500 mt-3 leading-relaxed font-medium">Advanced pattern detection automatically configures dropdowns, checkboxes, and required fields.</p>
                      </div>
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-50/50 transition-all">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                          <FormInput size={24} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Native Export</h3>
                        <p className="text-sm text-gray-500 mt-3 leading-relaxed font-medium">Generates production-ready Google Apps Script. 100% compatible with the official Google Forms API.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex flex-col items-center space-y-8 animate-slide-in">
                    <button 
                      onClick={() => setRawCsvData(null)}
                      className="text-sm text-gray-400 hover:text-indigo-600 font-bold flex items-center transition-colors group"
                    >
                      <span className="mr-2 group-hover:-translate-x-1 transition-transform">&larr;</span> Change Source File
                    </button>
                    <DataPreview 
                      csvData={rawCsvData} 
                      onConfirm={() => pendingFile && processFile(pendingFile.file, pendingFile.content)} 
                      isProcessing={isProcessing}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
                  <div>
                    <button 
                      onClick={() => {
                        setFormStructure(null);
                        setRawCsvData(null);
                      }}
                      className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center hover:opacity-70"
                    >
                      <span className="mr-2">&larr;</span> Back to Upload
                    </button>
                    <h2 className="text-4xl font-black text-gray-900 mt-4 tracking-tight">Form Blueprint</h2>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center shadow-sm">
                    <Sparkles size={16} className="mr-3" /> Structure Generated by AI
                  </div>
                </div>

                <FormPreview 
                  form={formStructure} 
                  onUpdate={setFormStructure} 
                  onGenerateScript={() => setShowCode(true)}
                />
              </div>
            )}
          </>
        )}
      </main>

      {showCode && formStructure && (
        <CodePreview form={formStructure} onClose={() => setShowCode(false)} />
      )}
      
      <ChatBot />

      <footer className="mt-32 py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3 grayscale opacity-50 cursor-pointer" onClick={() => setActiveTab('home')}>
             <div className="bg-gray-200 p-1.5 rounded-lg"><Sparkles size={18} /></div>
             <span className="font-bold text-gray-500">FormGenie AI</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">This app was built by Syed Noman with Gemini AI 2026</p>
          <div className="flex space-x-8 text-xs font-black text-gray-400 uppercase tracking-widest">
             <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
             <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
             <a href="#" className="hover:text-indigo-600 transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
