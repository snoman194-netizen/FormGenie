
import React, { useState } from 'react';
import { Sparkles, FormInput, FileJson, Info, LayoutGrid, MessageSquareQuote } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FormPreview from './components/FormPreview';
import ChatBot from './components/ChatBot';
import CodePreview from './components/CodePreview';
import DataPreview from './components/DataPreview';
import DocChat from './components/DocChat';
import { convertFileToForm } from './services/gemini';
import { FormStructure } from './types';

const App: React.FC = () => {
  const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawCsvData, setRawCsvData] = useState<string[][] | null>(null);
  const [pendingFile, setPendingFile] = useState<{file: File, content: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'standard' | 'docchat'>('standard');

  const handleUpload = async (file: File, content: string) => {
    setError(null);
    
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const rows = content.split('\n')
        .map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))
        .filter(row => row.length > 1 || row[0] !== '');
      
      setRawCsvData(rows);
      setPendingFile({ file, content });
    } else {
      processFile(file, content);
    }
  };

  const processFile = async (file: File, content: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const structure = await convertFileToForm(content, file.type, file.name);
      setFormStructure(structure);
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
    setActiveTab('standard');
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              FormGenie AI
            </span>
          </div>
          
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('standard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid size={16} />
              <span>Generator</span>
            </button>
            <button 
              onClick={() => setActiveTab('docchat')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'docchat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MessageSquareQuote size={16} />
              <span>Document AI Chat</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'docchat' ? (
          <DocChat onTransfer={handleDocTransfer} onExit={() => setActiveTab('standard')} />
        ) : (
          <>
            {!formStructure ? (
              <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12">
                {!rawCsvData ? (
                  <>
                    <div className="text-center space-y-4 max-w-2xl">
                      <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
                        Turn your static files into <br />
                        <span className="text-indigo-600">Dynamic Google Forms</span>
                      </h1>
                      <p className="text-lg text-gray-600">
                        Upload a CSV or PDF file and our AI will automatically structure questions, types, and options based on data analysis.
                      </p>
                    </div>

                    <FileUploader onUpload={handleUpload} isProcessing={isProcessing} />

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center">
                        <Info size={20} className="mr-2" />
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-8">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                          <FileJson size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900">Upload CSV/PDF</h3>
                        <p className="text-sm text-gray-500 mt-2">Just drop your file. We support complex surveys and lists.</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 mb-4">
                          <Sparkles size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900">Data-Driven AI</h3>
                        <p className="text-sm text-gray-500 mt-2">Gemini 3 Pro analyzes patterns to choose the best question types.</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                          <FormInput size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900">Export to Forms</h3>
                        <p className="text-sm text-gray-500 mt-2">Get a one-click Google Apps Script to build your form live.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex flex-col items-center space-y-6">
                    <button 
                      onClick={() => setRawCsvData(null)}
                      className="text-sm text-gray-500 hover:text-indigo-600 font-medium self-start ml-4 md:ml-20 flex items-center"
                    >
                      &larr; Upload different file
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
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between">
                  <div>
                    <button 
                      onClick={() => {
                        setFormStructure(null);
                        setRawCsvData(null);
                      }}
                      className="text-sm text-indigo-600 hover:underline flex items-center font-medium"
                    >
                      &larr; Start New Conversion
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mt-2">Edit Generated Form</h2>
                  </div>
                  <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                    <Sparkles size={14} className="mr-2" /> Patterns Analyzed
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

      <footer className="mt-20 py-10 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">This app was built by Syed Noman with Gemini AI 2026</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
