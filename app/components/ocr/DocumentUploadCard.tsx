import React from 'react';

interface DocumentUploadCardProps {
  title: string;
  result: any;
  loading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  renderTabbedResult: (result: any, activeTab: "preview" | "json", setActiveTab: (tab: "preview" | "json") => void) => React.ReactElement;
  activeTab: "preview" | "json";
  setActiveTab: (tab: "preview" | "json") => void;
}

export default function DocumentUploadCard({
  title,
  result,
  loading,
  onUpload,
  onClear,
  renderTabbedResult,
  activeTab,
  setActiveTab,
}: DocumentUploadCardProps) {
  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {result && (
          <button
            onClick={onClear}
            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {!result && !loading && (
        <div className="mb-6">
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-12 h-12 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500">PDF files only</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={onUpload}
            />
          </label>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
          <span className="text-gray-400">Processing...</span>
        </div>
      )}

      {result && renderTabbedResult(result, activeTab, setActiveTab)}
    </div>
  );
}
