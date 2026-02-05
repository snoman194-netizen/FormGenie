
import React from 'react';
import { 
  Sparkles, 
  LayoutGrid, 
  MessageSquareQuote, 
  Search, 
  History as HistoryIcon, 
  ArrowRight, 
  FileText, 
  MousePointer2, 
  Zap, 
  ShieldCheck, 
  Plus
} from 'lucide-react';
import { SavedForm } from '../types';

interface HomeTabProps {
  onNavigate: (tab: 'standard' | 'docchat' | 'search' | 'history') => void;
  history: SavedForm[];
  onSelectHistory: (form: SavedForm) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ onNavigate, history, onSelectHistory }) => {
  const suggestions = history.slice(0, 3);

  const guideItems = [
    {
      icon: <LayoutGrid className="text-indigo-600" size={24} />,
      title: "Forms Lab",
      desc: "Upload CSV or PDF files. Our AI analyzes the data patterns to generate a complete Google Form structure instantly.",
      tab: 'standard' as const
    },
    {
      icon: <MessageSquareQuote className="text-violet-600" size={24} />,
      title: "AI Chatbot",
      desc: "Chat with Gemini to extract questions from complex documents or refine your questionnaire through natural conversation.",
      tab: 'docchat' as const
    },
    {
      icon: <Search className="text-blue-600" size={24} />,
      title: "Legal Search",
      desc: "Find official US state legal forms and documents. Convert search results directly into editable form blueprints.",
      tab: 'search' as const
    },
    {
      icon: <HistoryIcon className="text-amber-600" size={24} />,
      title: "History",
      desc: "Review your previous generations. Re-open any past blueprint to export or modify it without re-uploading.",
      tab: 'history' as const
    }
  ];

  return (
    <div className="space-y-16 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[48px] p-12 md:p-20 text-white shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
            <Zap size={14} /> <span>Welcome to FormGenie v2.0</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-8">
            Create Forms at the <br /> <span className="text-indigo-200">Speed of Thought.</span>
          </h1>
          <p className="text-xl text-indigo-100 font-medium mb-12 leading-relaxed max-w-2xl">
            From raw data to production-ready Google Forms in seconds. Use our suite of AI tools to streamline your workflow.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate('standard')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm flex items-center shadow-xl shadow-indigo-900/20 hover:scale-105 transition-all active:scale-95"
            >
              Start Building <Plus className="ml-2" size={18} />
            </button>
            <button 
              onClick={() => onNavigate('docchat')}
              className="bg-indigo-500/30 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center hover:bg-indigo-500/50 transition-all"
            >
              Try AI Chatbot <MessageSquareQuote className="ml-2" size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Guide Section */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-black text-gray-900 px-2">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guideItems.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => onNavigate(item.tab)}
                className="group bg-white p-8 rounded-[32px] border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel: Recent Activity & Suggestions */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-gray-900">Recent Activity</h2>
            <button 
              onClick={() => onNavigate('history')}
              className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              See All
            </button>
          </div>
          
          <div className="space-y-4">
            {suggestions.length > 0 ? (
              suggestions.map((form) => (
                <div 
                  key={form.historyId}
                  onClick={() => onSelectHistory(form)}
                  className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <FileText size={20} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {form.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium mt-1">
                        {form.questions.length} Questions • {new Date(form.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-[32px] p-10 text-center border border-dashed border-gray-200">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 mx-auto mb-4">
                  <MousePointer2 size={24} />
                </div>
                <p className="text-sm text-gray-400 font-bold">No recent history</p>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">Forms you create will appear here for quick access.</p>
              </div>
            )}

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[32px] p-8 text-white mt-8">
              <ShieldCheck className="text-indigo-400 mb-4" size={32} />
              <h4 className="font-black text-lg mb-2">Secure AI Analysis</h4>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Your uploaded files are processed securely by Gemini and are never used to train global models.
              </p>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</span>
                <span className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" /> Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
