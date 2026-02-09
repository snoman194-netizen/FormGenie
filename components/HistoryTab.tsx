
import React from 'react';
import { History, Calendar, Trash2, Edit3, FileText, ChevronRight, Inbox } from 'lucide-react';
import { SavedForm } from '../types';

interface HistoryTabProps {
  history: SavedForm[];
  onSelect: (form: SavedForm) => void;
  onDelete: (historyId: string) => void;
  onClear: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history, onSelect, onDelete, onClear }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
            <History size={14} /> <span>Recent Generations</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Form History</h2>
          <p className="text-gray-500 font-medium max-w-xl">
            Access, edit, and manage all your previously generated Google Form blueprints in one place.
          </p>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={onClear}
            className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-100"
          >
            <Trash2 size={18} />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-40">
          <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 border-dashed">
            <Inbox size={64} className="text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">Your history is empty</p>
            <p className="text-sm text-gray-500 mt-2 font-medium">Converted forms will automatically appear here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.sort((a, b) => b.savedAt - a.savedAt).map((form) => (
            <div 
              key={form.historyId}
              className="group bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="p-8 space-y-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                    <FileText size={14} />
                    <span>{form.questions.length} Questions</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-xs font-medium">
                    <Calendar size={14} />
                    <span>{formatDate(form.savedAt)}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {form.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 font-medium leading-relaxed">
                    {form.description}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button 
                  onClick={() => onDelete(form.historyId)}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-red-100"
                  title="Delete from history"
                >
                  <Trash2 size={18} />
                </button>
                
                <button 
                  onClick={() => onSelect(form)}
                  className="flex items-center space-x-2 bg-white px-6 py-3 rounded-2xl font-bold text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group/btn"
                >
                  <span>Open in Editor</span>
                  <Edit3 size={16} />
                  <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
