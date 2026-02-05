
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, Loader2, Table } from 'lucide-react';
import { initGoogleAuth } from '../services/googleDrive';

// Fix: Declare global google object to resolve 'Cannot find name google' errors
declare const google: any;

interface FileUploaderProps {
  onUpload: (file: File | { name: string, type: string }, content: string) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{name: string, size?: number, type: string} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Attempt to init Google Identity Services if needed
    if (typeof google !== 'undefined') {
      initGoogleAuth().catch(console.error);
    }
  }, []);

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onUpload(file, result);
    };

    if (file.type === 'application/pdf') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all duration-300 ${
          dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-gray-200 bg-white hover:border-indigo-300 shadow-sm'
        }`}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept=".csv,.pdf" 
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          {!selectedFile ? (
            <>
              <div className="p-5 bg-indigo-50 rounded-2xl text-indigo-600">
                <Upload size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-gray-900">Upload your source file</p>
                <p className="text-sm text-gray-500">Drag and drop CSV or PDF to begin analysis</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                <button 
                  onClick={() => inputRef.current?.click()}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2"
                >
                  <FileText size={18} />
                  <span>Browse Locally</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 animate-in zoom-in-95">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white shadow-sm rounded-xl">
                  {selectedFile.name.endsWith('.csv') ? <Table className="text-emerald-600" size={24} /> : <FileText className="text-rose-600" size={24} />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Local File'}
                  </p>
                </div>
              </div>
              {isProcessing ? (
                <div className="flex items-center space-x-3 text-indigo-600 font-bold text-sm">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Analyzing...</span>
                </div>
              ) : (
                <button onClick={reset} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
