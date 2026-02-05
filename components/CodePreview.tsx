
import React, { useState } from 'react';
import { Copy, Check, Download, ExternalLink, X, Cloud, Loader2 } from 'lucide-react';
import { FormStructure } from '../types';
import { saveFileToDrive } from '../services/googleDrive';

interface CodePreviewProps {
  form: FormStructure;
  onClose: () => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({ form, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const generateAppsScript = () => {
    const jsonStr = JSON.stringify(form, null, 2);
    return `/**
 * FormGenie - Automatically create Google Form
 * Paste this script into https://script.google.com
 */
function createGoogleForm() {
  const formData = ${jsonStr};
  
  const form = FormApp.create(formData.title);
  form.setDescription(formData.description);
  
  formData.questions.forEach(q => {
    let item;
    switch(q.type) {
      case 'SHORT_ANSWER':
        item = form.addTextItem();
        break;
      case 'PARAGRAPH':
        item = form.addParagraphTextItem();
        break;
      case 'MULTIPLE_CHOICE':
        item = form.addMultipleChoiceItem();
        if (q.options) item.setChoiceValues(q.options);
        break;
      case 'CHECKBOXES':
        item = form.addCheckboxItem();
        if (q.options) item.setChoiceValues(q.options);
        break;
      case 'DROPDOWN':
        item = form.addListItem();
        if (q.options) item.setChoiceValues(q.options);
        break;
    }
    
    if (item) {
      item.setTitle(q.title);
      item.setRequired(q.required);
      if (q.helpText) item.setHelpText(q.helpText);
    }
  });
  
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Editor URL: ' + form.getEditUrl());
  
  return form.getEditUrl();
}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateAppsScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToDrive = async () => {
    setIsSaving(true);
    try {
      const fileName = `${form.title.replace(/\s+/g, '_')}_Creator_Script.gs`;
      await saveFileToDrive(fileName, generateAppsScript(), 'text/plain');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to save to Drive. Ensure Client ID is configured and you have granted permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 scale-in duration-300">
        <div className="p-8 border-b flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Generate Your Google Form</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">Run this script in Google Apps Script to build your form automatically.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-auto p-8 bg-[#0d1117]">
          <pre className="text-indigo-300 font-mono text-xs md:text-sm leading-relaxed whitespace-pre">
            <code>{generateAppsScript()}</code>
          </pre>
        </div>

        <div className="p-8 border-t bg-gray-50 flex flex-col space-y-6">
          <div className="flex flex-wrap items-center gap-6 text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black">
            <span className="flex items-center"><span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-2 shadow-sm shadow-indigo-200">1</span> Copy Script</span>
            <div className="flex-grow h-px bg-gray-200" />
            <span className="flex items-center"><span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center mr-2">2</span> Open Apps Script</span>
            <div className="flex-grow h-px bg-gray-200" />
            <span className="flex items-center"><span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center mr-2">3</span> Paste & Run</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <button 
              onClick={copyToClipboard}
              className="w-full md:flex-1 flex items-center justify-center bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
            >
              {copied ? <Check size={20} className="mr-2" /> : <Copy size={20} className="mr-2 group-hover:scale-110 transition-transform" />}
              {copied ? 'Successfully Copied!' : 'Copy Script to Clipboard'}
            </button>
            
            <button 
              onClick={handleSaveToDrive}
              disabled={isSaving}
              className={`w-full md:flex-1 flex items-center justify-center px-8 py-4 rounded-2xl font-bold transition-all shadow-sm border-2 ${
                saveSuccess 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {isSaving ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : saveSuccess ? (
                <Check size={20} className="mr-2" />
              ) : (
                <Cloud size={20} className="mr-2 text-blue-500" />
              )}
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved to Drive' : 'Save Script to Drive'}
            </button>

            <a 
              href="https://script.google.com" 
              target="_blank" 
              rel="noreferrer"
              className="w-full md:w-auto flex items-center justify-center bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-[14px] rounded-2xl font-bold hover:bg-indigo-50 transition-all"
            >
              Launch Editor <ExternalLink size={18} className="ml-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
