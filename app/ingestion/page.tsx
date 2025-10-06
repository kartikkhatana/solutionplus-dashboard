'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

type IngestionMethod = 'pdf' | 'mongodb' | 'azure' | 'fusion' | null;

export default function IngestionPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<IngestionMethod>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const ingestionMethods = [
    {
      id: 'pdf',
      name: 'PDF Upload',
      description: 'Upload invoice and PO documents in PDF format',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      description: 'Connect to MongoDB database for invoice data',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'azure',
      name: 'Azure Blob Storage',
      description: 'Import documents from Azure Blob Storage',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'fusion',
      name: 'Fusion ERM',
      description: 'Integrate with Fusion ERM system',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const handleProcessData = () => {
    setUploading(true);
    setTimeout(() => {
      router.push('/processing');
    }, 2000);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Ingestion</h1>
              <p className="text-sm text-gray-600 mt-1">Step 1 of 4 - Select your data source</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">1</div>
              <span className="ml-2 text-sm font-medium text-gray-900">Ingestion</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">2</div>
              <span className="ml-2 text-sm text-gray-500">Processing</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">3</div>
              <span className="ml-2 text-sm text-gray-500">Results</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">4</div>
              <span className="ml-2 text-sm text-gray-500">Share</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Data Source</h2>
          <p className="text-gray-600">Choose how you want to ingest your invoice and purchase order data</p>
        </div>

        {/* Ingestion Methods Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {ingestionMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id as IngestionMethod)}
              className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${method.color} flex items-center justify-center text-white mb-4 mx-auto`}>
                {method.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{method.name}</h3>
              <p className="text-sm text-gray-600 text-center">{method.description}</p>
              {selectedMethod === method.id && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Configuration Panel */}
        {selectedMethod && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 animate-fadeIn">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Configure {ingestionMethods.find(m => m.id === selectedMethod)?.name}
            </h3>

            {selectedMethod === 'pdf' && (
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">Drop PDF files here or click to browse</p>
                    <p className="text-sm text-gray-600">Support for invoices and purchase orders in PDF format</p>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-900">{file}</span>
                          </div>
                          <span className="text-xs text-green-600 font-medium">Ready</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedMethod === 'mongodb' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Connection String</label>
                  <input
                    type="text"
                    placeholder="mongodb://username:password@host:port/database"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    defaultValue="mongodb://localhost:27017/invoices"
                    style={{ outline: "none" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collection Name</label>
                  <input
                    type="text"
                    placeholder="invoices"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    defaultValue="invoice_data"
                    style={{ outline: "none" }}
                  />
                </div>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Test Connection
                </button>
              </div>
            )}

            {selectedMethod === 'azure' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Storage Account Name</label>
                  <input
                    type="text"
                    placeholder="mystorageaccount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue="invoicestorage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Container Name</label>
                  <input
                    type="text"
                    placeholder="invoices"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue="invoice-documents"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Key</label>
                  <input
                    type="password"
                    placeholder="•••••••••••••••••••••••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Connect to Azure
                </button>
              </div>
            )}

            {selectedMethod === 'fusion' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fusion ERM URL</label>
                  <input
                    type="text"
                    placeholder="https://fusion.company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue="https://fusion.solutionplus.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    placeholder="•••••••••••••••••••••••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Range</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Custom range</option>
                  </select>
                </div>
                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Connect to Fusion ERM
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Login
          </button>
          <button
            onClick={handleProcessData}
            disabled={!selectedMethod || uploading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Continue to Processing'
            )}
          </button>
        </div>
      </div>
      </main>
    </div>
  );
}
