
import React from 'react';
import { FormStructure, QuestionType } from '../types';
import { Settings, Plus, GripVertical, Trash2, Code, Share2 } from 'lucide-react';

interface FormPreviewProps {
  form: FormStructure;
  onUpdate: (form: FormStructure) => void;
  onGenerateScript: () => void;
}

const FormPreview: React.FC<FormPreviewProps> = ({ form, onUpdate, onGenerateScript }) => {
  const removeQuestion = (id: string) => {
    const updated = { ...form, questions: form.questions.filter(q => q.id !== id) };
    onUpdate(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Form Header */}
      <div className="bg-white border-t-8 border-indigo-600 rounded-lg shadow-sm p-6">
        <input 
          type="text" 
          value={form.title} 
          onChange={(e) => onUpdate({ ...form, title: e.target.value })}
          className="text-3xl font-bold text-gray-900 w-full focus:outline-none border-b border-transparent focus:border-gray-200 py-1"
          placeholder="Form Title"
        />
        <textarea 
          value={form.description}
          onChange={(e) => onUpdate({ ...form, description: e.target.value })}
          className="mt-4 text-gray-600 w-full focus:outline-none border-b border-transparent focus:border-gray-200 py-1 resize-none"
          placeholder="Form description"
          rows={2}
        />
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {form.questions.map((q, idx) => (
          <div key={q.id} className="group bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow relative">
            <div className="absolute left-1/2 -top-3 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical size={16} className="text-gray-400 rotate-90" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-grow space-y-3">
                <input 
                  type="text" 
                  value={q.title}
                  onChange={(e) => {
                    const newQuestions = [...form.questions];
                    newQuestions[idx].title = e.target.value;
                    onUpdate({ ...form, questions: newQuestions });
                  }}
                  className="text-lg font-medium text-gray-800 w-full bg-gray-50 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Question text"
                />
                
                {/* Options Rendering */}
                {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOXES || q.type === QuestionType.DROPDOWN) && (
                  <div className="pl-4 space-y-2">
                    {q.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full border border-gray-300 ${q.type === QuestionType.CHECKBOXES ? 'rounded-sm' : ''}`} />
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
                          className="text-sm text-gray-600 focus:outline-none border-b border-transparent hover:border-gray-200"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newQuestions = [...form.questions];
                        const newOptions = [...(newQuestions[idx].options || []), `Option ${(newQuestions[idx].options?.length || 0) + 1}`];
                        newQuestions[idx].options = newOptions;
                        onUpdate({ ...form, questions: newQuestions });
                      }}
                      className="text-indigo-600 text-xs font-medium hover:underline mt-2 flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> Add option
                    </button>
                  </div>
                )}

                {q.type === QuestionType.SHORT_ANSWER && (
                  <div className="pl-4">
                    <div className="w-1/2 border-b border-dotted border-gray-300 py-4 text-xs text-gray-400">Short answer text</div>
                  </div>
                )}
                
                {q.type === QuestionType.PARAGRAPH && (
                  <div className="pl-4">
                    <div className="w-3/4 border-b border-dotted border-gray-300 py-6 text-xs text-gray-400">Long answer text</div>
                  </div>
                )}
              </div>

              <div className="flex items-center md:flex-col space-x-4 md:space-x-0 md:space-y-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                <select 
                  value={q.type}
                  onChange={(e) => {
                    const newQuestions = [...form.questions];
                    newQuestions[idx].type = e.target.value as QuestionType;
                    onUpdate({ ...form, questions: newQuestions });
                  }}
                  className="text-sm bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none"
                >
                  <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                  <option value={QuestionType.PARAGRAPH}>Paragraph</option>
                  <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                  <option value={QuestionType.CHECKBOXES}>Checkboxes</option>
                  <option value={QuestionType.DROPDOWN}>Dropdown</option>
                </select>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <label className="text-xs text-gray-500 mr-2 uppercase tracking-tighter">Required</label>
                    <input 
                      type="checkbox" 
                      checked={q.required} 
                      onChange={(e) => {
                        const newQuestions = [...form.questions];
                        newQuestions[idx].required = e.target.checked;
                        onUpdate({ ...form, questions: newQuestions });
                      }}
                      className="accent-indigo-600"
                    />
                  </div>
                  <button onClick={() => removeQuestion(q.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white shadow-xl rounded-full px-6 py-3 border border-gray-200 z-50">
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
          className="flex items-center text-gray-600 hover:text-indigo-600 font-medium transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Question
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <button 
          onClick={onGenerateScript}
          className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Code size={18} className="mr-2" />
          Create in Google Forms
        </button>
      </div>
    </div>
  );
};

export default FormPreview;
