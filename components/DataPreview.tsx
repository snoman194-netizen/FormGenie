
import React from 'react';
import { Table, Layers } from 'lucide-react';

interface DataPreviewProps {
  csvData: string[][];
  onConfirm: () => void;
  isProcessing: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({ csvData, onConfirm, isProcessing }) => {
  if (csvData.length === 0) return null;

  const headers = csvData[0];
  const rows = csvData.slice(1, 6); // Show only first 5 rows for preview

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-indigo-700">
          <Table size={20} />
          <h3 className="font-bold">Detected CSV Structure</h3>
        </div>
        <div className="text-xs font-medium text-indigo-500 uppercase tracking-wider">
          {csvData.length} Rows detected
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold text-gray-700 border-b border-gray-100 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-gray-600 border-b border-gray-50 truncate max-w-[200px]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
          <Layers size={14} />
          <span>Our AI will analyze these patterns to select the best question types.</span>
        </div>
        
        <button 
          onClick={onConfirm}
          disabled={isProcessing}
          className="w-full md:w-auto px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Patterns...</span>
            </>
          ) : (
            <span>Convert to Google Form</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DataPreview;
