
import React, { useState } from 'react';
import { FormStructure, QuestionType } from '../types';
import { Plus, GripVertical, Trash2, Code, Wand2, Loader2, Send, Sparkles, X } from 'lucide-react';
import { refineFormWithAI } from '../services/gemini';

interface FormPreviewProps {
  form: FormStructure;
  onUpdate: (form: FormStructure) => void;
  onGenerateScript: () => void;
}

const FormPreview: React.FC<FormPreviewProps> = ({ form, onUpdate, onGenerateScript }) => {
  const [isRefining, setIsRefining] = useState(false);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');

  const removeQuestion = (id: string) => {
    const updated = { ...form, questions: form.questions.filter(q => q.id !== id) };
    onUpdate(updated);
  };

  const handleRefine = async () => {
    if (!refinePrompt.trim()) return;
    setIsRefining(true);
    try {
      const refined = await refineFormWithAI(form, refinePrompt);
      onUpdate(refined);
      setShowRefineInput(false);
      setRefinePrompt('');
    } catch (error) {
      console.error(error);
      alert("Failed to refine form. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      {/* Form Header */}
      <div className="bg-white border-t-8 border-indigo-600 rounded-[32px] shadow-sm p-10">
        <input 
          type="text" 
          value={form.title} 
          onChange={(e) => onUpdate({ ...form, title: e.target.value })}
          className="text-4xl font-black text-black w-full focus:outline-none border-b border-transparent focus:border-gray-100 py-1 transition-all"
          placeholder="Form Title"
        />
        <textarea 
          value={form.description}
          onChange={(e) => onUpdate({ ...form, description: e.target.value })}
          className="mt-6 text-black font-medium w-full focus:outline-none border-b border-transparent focus:border-gray-100 py-1 resize-none leading-relaxed text-lg"
          placeholder="Form description"
          rows={2}
        />
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {form.questions.map((q, idx) => (
          <div key={q.id} className="group bg-white border border-gray-100 rounded-[32px] shadow-sm p-10 hover:shadow-xl hover:shadow-indigo-50/40 transition-all relative overflow-hidden">
            <div className="absolute left-1/2 -top-3 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all cursor-grab bg-white border border-gray-100 rounded-full px-2 py-0.5 shadow-sm">
              <GripVertical size={14} className="text-gray-300 rotate-90" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-start space-y-8 md:space-y-0 md:space-x-8">
              <div className="flex-grow space-y-6">
                <input 
                  type="text" 
                  value={q.title}
                  onChange={(e) => {
                    const newQuestions = [...form.questions];
                    newQuestions[idx].title = e.target.value;
                    onUpdate({ ...form, questions: newQuestions });
                  }}
                  className="text-xl font-bold text-black w-full bg-gray-50/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all border border-transparent focus:border-indigo-50"
                  placeholder="Question text"
                />
                
                {/* Options Rendering */}
                {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOXES || q.type === QuestionType.DROPDOWN) && (
                  <div className="pl-6 space-y-4">
                    {q.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center space-x-4 group/opt">
                        <div className={`w-5 h-5 rounded-full border-2 border-gray-200 group-hover/opt:border-indigo-300 transition-colors shrink-0 ${q.type === QuestionType.CHECKBOXES ? 'rounded-md' : ''}`} />
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => {
                            const newQuestions = [...form.questions];
                            const newOptions = [...(newQuestions[idx].options || [])];
                            newOptions[optIdx] = e.target.value;
                            newQuestions[idx].options = newOptions;
                            onUpdate({ ...form, questions: newQuestions });
                          }}
                          className="text-sm font-medium text-black focus:outline-none border-b border-transparent hover:border-gray-100 transition-colors py-1 flex-grow bg-transparent"
                        />
                        <button 
                          onClick={() => {
                            const newQuestions = [...form.questions];
                            const newOptions = (newQuestions[idx].options || []).filter((_, i) => i !== optIdx);
                            newQuestions[idx].options = newOptions;
                            onUpdate({ ...form, questions: newQuestions });
                          }}
                          className="opacity-0 group-hover/opt:opacity-100 p-2 text-gray-300 hover:text-red-400 transition-all rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newQuestions = [...form.questions];
                        const newOptions = [...(newQuestions[idx].options || []), `Option ${(newQuestions[idx].options?.length || 0) + 1}`];
                        newQuestions[idx].options = newOptions;
                        onUpdate({ ...form, questions: newQuestions });
                      }}
                      className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline mt-6 flex items-center bg-indigo-50/50 px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-all"
                    >
                      <Plus size={16} className="mr-2" /> Add option
                    </button>
                  </div>
                )}

                {q.type === QuestionType.SHORT_ANSWER && (
                  <div className="pl-6">
                    <div className="w-1/2 border-b-2 border-dotted border-gray-100 py-6 text-[11px] text-gray-300 uppercase font-black tracking-[0.2em]">Short answer placeholder</div>
                  </div>
                )}
                
                {q.type === QuestionType.PARAGRAPH && (
                  <div className="pl-6">
                    <div className="w-3/4 border-b-2 border-dotted border-gray-100 py-10 text-[11px] text-gray-300 uppercase font-black tracking-[0.2em]">Long answer placeholder</div>
                  </div>
                )}
              </div>

              <div className="flex items-center md:flex-col space-x-6 md:space-x-0 md:space-y-6 border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-8">
                <select 
                  value={q.type}
                  onChange={(e) => {
                    const newQuestions = [...form.questions];
                    newQuestions[idx].type = e.target.value as QuestionType;
                    onUpdate({ ...form, questions: newQuestions });
                  }}
                  className="text-xs font-black bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700 uppercase tracking-wider"
                >
                  <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                  <option value={QuestionType.PARAGRAPH}>Paragraph</option>
                  <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                  <option value={QuestionType.CHECKBOXES}>Checkboxes</option>
                  <option value={QuestionType.DROPDOWN}>Dropdown</option>
                </select>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <label className="text-[10px] font-black text-gray-400 mr-3 uppercase tracking-widest">Required</label>
                    <input 
                      type="checkbox" 
                      checked={q.required} 
                      onChange={(e) => {
                        const newQuestions = [...form.questions];
                        newQuestions[idx].required = e.target.checked;
                        onUpdate({ ...form, questions: newQuestions });
                      }}
                      className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={() => removeQuestion(q.id)} 
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                    title="Delete question"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-6 bg-white/80 backdrop-blur-2xl shadow-2xl rounded-[40px] px-10 py-5 border border-white/50 z-50 ring-1 ring-gray-900/5">
        <button 
          onClick={() => {
            const newQ: any = {
              id: Math.random().toString(36).substr(2, 9),
              title: "Untitled Question",
              type: QuestionType.SHORT_ANSWER,
              required: false
            };
            onUpdate({ ...form, questions: [...form.questions, newQ] });
          }}
          className="flex items-center text-gray-500 hover:text-indigo-600 font-black text-sm transition-all group"
        >
          <Plus size={22} className="mr-2 group-hover:rotate-90 transition-transform" />
          <span className="hidden sm:inline">Add Question</span>
        </button>

        <div className="w-px h-8 bg-gray-100" />

        <div className="relative">
          <button 
            onClick={() => setShowRefineInput(!showRefineInput)}
            className={`flex items-center ${showRefineInput ? 'text-indigo-600' : 'text-gray-500'} hover:text-indigo-600 font-black text-sm transition-all group`}
          >
            <Wand2 size={22} className="mr-2 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Smart Edit</span>
          </button>

          {showRefineInput && (
            <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 w-96 bg-white rounded-[32px] shadow-2xl border border-gray-100 p-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center">
                    <Sparkles size={14} className="mr-2" /> Gemini AI Editor
                  </div>
                  <button onClick={() => setShowRefineInput(false)} className="text-gray-300 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <textarea 
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Ask Gemini to 'make it formal', 'add contact info', 'rephrase questions'..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none h-32 font-medium text-black"
                  autoFocus
                />
                <button 
                  onClick={handleRefine}
                  disabled={isRefining || !refinePrompt.trim()}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  <span>{isRefining ? 'AI is processing...' : 'Refine Form'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-px h-8 bg-gray-100" />
        
        <button 
          onClick={onGenerateScript}
          className="flex items-center bg-indigo-600 text-white px-10 py-4 rounded-[20px] font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex-shrink-0"
        >
          <Code size={20} className="mr-2" />
          Export Form
        </button>
      </div>
    </div>
  );
};

export default FormPreview;
