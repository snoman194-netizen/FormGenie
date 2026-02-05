
import React, { useState } from 'react';
import { Search, MapPin, FileText, ExternalLink, Loader2, Info, Gavel, Wand2, Download, FileType } from 'lucide-react';
import { searchLegalDocuments, convertSearchContextToForm, synthesizeDocumentDraft } from '../services/gemini';
import { FormStructure } from '../types';
import { jsPDF } from 'jspdf';

interface SearchTabProps {
  onTransfer?: (form: FormStructure) => void;
}

const SearchTab: React.FC<SearchTabProps> = ({ onTransfer }) => {
  const [docType, setDocType] = useState('');
  const [stateName, setStateName] = useState('');
  const [results, setResults] = useState<{ text: string, groundingChunks: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConverting, setIsConverting] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<{index: number, type: 'pdf' | 'doc'} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docType.trim() || !stateName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await searchLegalDocuments(docType, stateName);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Failed to perform search. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToForm = async (chunk: any, index: number) => {
    if (!results || !onTransfer) return;
    
    setIsConverting(index);
    setError(null);
    try {
      const structure = await convertSearchContextToForm(
        results.text, 
        chunk.web?.title || "Legal Document", 
        chunk.web?.uri || ""
      );
      onTransfer(structure);
    } catch (err) {
      console.error(err);
      setError("Failed to convert search result into a form. Please try another link.");
    } finally {
      setIsConverting(null);
    }
  };

  const handleDownload = async (chunk: any, index: number, type: 'pdf' | 'doc') => {
    if (!results) return;
    setIsDownloading({ index, type });
    setError(null);

    try {
      const draft = await synthesizeDocumentDraft(
        results.text,
        chunk.web?.title || docType,
        chunk.web?.uri || ""
      );

      const fileName = `${(chunk.web?.title || docType).replace(/\s+/g, '_')}_Draft`;

      if (type === 'pdf') {
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(draft, 180);
        doc.setFontSize(12);
        doc.text(splitText, 15, 20);
        doc.save(`${fileName}.pdf`);
      } else {
        // Simple Word download trick using HTML
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
              "xmlns:w='urn:schemas-microsoft-com:office:word' "+
              "xmlns='http://www.w3.org/TR/REC-html40'>"+
              "<head><meta charset='utf-8'><title>Draft</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + draft.replace(/\n/g, '<br>') + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `${fileName}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to synthesize and download the document.");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
          <Gavel size={14} /> <span>USA Legal Intelligence</span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Legal Document Finder</h2>
        <p className="text-gray-500 font-medium max-w-xl mx-auto">
          Locate official state-level legal forms, application files, and regulatory documents across all 50 US states.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="Document Type (e.g. Divorce Decree, Incorporation)"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium"
              required
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder="US State (e.g. California, Texas)"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center animate-slide-in">
          <Info size={20} className="mr-3 shrink-0" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {/* Search Results */}
      {results && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center">
              <Info size={20} className="mr-2 text-indigo-600" /> Analysis & Overview
            </h3>
            <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
              <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed font-medium">
                {results.text.split('\n').map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>
            </div>
          </div>

          {results.groundingChunks && results.groundingChunks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-2">Verified Sources & Direct Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.groundingChunks.map((chunk: any, i: number) => {
                  if (chunk.web) {
                    const converting = isConverting === i;
                    const downloadingPdf = isDownloading?.index === i && isDownloading?.type === 'pdf';
                    const downloadingDoc = isDownloading?.index === i && isDownloading?.type === 'doc';
                    
                    return (
                      <div 
                        key={i}
                        className="group bg-white p-6 rounded-[32px] border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all flex flex-col space-y-6"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <ExternalLink size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {chunk.web.title || "Official Resource"}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1 opacity-60">{chunk.web.uri}</p>
                            </div>
                          </div>
                          <a 
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Visit Website"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <button 
                            onClick={() => handleConvertToForm(chunk, i)}
                            disabled={isConverting !== null || isDownloading !== null}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                          >
                            {converting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                            <span>{converting ? 'Generating blueprint...' : 'Convert to Questionnaire'}</span>
                          </button>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleDownload(chunk, i, 'pdf')}
                              disabled={isConverting !== null || isDownloading !== null}
                              className="flex items-center justify-center space-x-2 py-3 bg-gray-50 text-gray-600 rounded-2xl text-[11px] font-bold hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-50"
                            >
                              {downloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                              <span>{downloadingPdf ? 'Drafting...' : 'PDF Draft'}</span>
                            </button>
                            <button 
                              onClick={() => handleDownload(chunk, i, 'doc')}
                              disabled={isConverting !== null || isDownloading !== null}
                              className="flex items-center justify-center space-x-2 py-3 bg-gray-50 text-gray-600 rounded-2xl text-[11px] font-bold hover:bg-blue-50 hover:text-blue-600 transition-all disabled:opacity-50"
                            >
                              {downloadingDoc ? <Loader2 size={14} className="animate-spin" /> : <FileType size={14} />}
                              <span>{downloadingDoc ? 'Drafting...' : 'Word Draft'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="text-center py-20 opacity-30 grayscale pointer-events-none">
          <Search size={64} className="mx-auto text-gray-300" />
          <p className="mt-4 font-black text-gray-400">Your search results will appear here</p>
        </div>
      )}
    </div>
  );
};

export default SearchTab;