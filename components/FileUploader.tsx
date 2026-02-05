
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, Table } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (file: File, content: string) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 ${
          dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 bg-white hover:border-indigo-400'
        }`}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept=".csv,.pdf" 
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {!selectedFile ? (
            <>
              <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
                <Upload size={32} />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-800">Drop your file here</p>
                <p className="text-sm text-gray-500 mt-1">Support for CSV and PDF files</p>
              </div>
              <button 
                onClick={() => inputRef.current?.click()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Browse Files
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white shadow-sm rounded-lg">
                  {selectedFile.name.endsWith('.csv') ? <Table className="text-green-600" /> : <FileText className="text-red-600" />}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {isProcessing ? (
                <div className="flex items-center space-x-2 text-indigo-600 font-medium">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Converting...</span>
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
