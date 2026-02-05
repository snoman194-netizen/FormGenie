
import React, { useState } from 'react';
import { Copy, Check, Download, ExternalLink, X } from 'lucide-react';
import { FormStructure } from '../types';

interface CodePreviewProps {
  form: FormStructure;
  onClose: () => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({ form, onClose }) => {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
        <div className="p-6 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Final Step: Generate Form</h2>
            <p className="text-sm text-gray-500">Copy the code below into Google Apps Script to create your form.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-auto p-6 bg-gray-900">
          <pre className="text-indigo-300 font-mono text-sm leading-relaxed">
            <code>{generateAppsScript()}</code>
          </pre>
        </div>

        <div className="p-6 border-t bg-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-xs text-gray-500 uppercase tracking-widest font-medium">
            <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] mr-2">1</span> Copy Script</span>
            <div className="w-8 h-px bg-gray-200" />
            <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] mr-2">2</span> Paste at script.google.com</span>
            <div className="w-8 h-px bg-gray-200" />
            <span className="flex items-center"><span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] mr-2">3</span> Click Run</span>
          </div>
          
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button 
              onClick={copyToClipboard}
              className="flex-grow md:flex-none flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
              {copied ? 'Copied!' : 'Copy Apps Script'}
            </button>
            <a 
              href="https://script.google.com" 
              target="_blank" 
              rel="noreferrer"
              className="flex-grow md:flex-none flex items-center justify-center border-2 border-indigo-600 text-indigo-600 px-6 py-[10px] rounded-xl font-bold hover:bg-indigo-50 transition-all"
            >
              Open Apps Script <ExternalLink size={16} className="ml-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
