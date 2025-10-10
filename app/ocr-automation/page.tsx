'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import ModeSelectionCard from '../components/ocr/ModeSelectionCard';
import ManualUpload from '../components/ocr/ManualUpload';
import EmailOCRWorkflow from '../components/ocr/EmailOCRWorkflow';

export default function OCRAutomationPage() {
  const [selectedMode, setSelectedMode] = useState<'email' | 'manual' | null>(null);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        setPdfLibLoaded(true);
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
      }
    };
    loadPdfJs();
  }, []);

  const handleEmailMode = () => {
    setSelectedMode('email');
  };

  const handleManualMode = () => {
    setSelectedMode('manual');
  };

  const handleBack = () => {
    setSelectedMode(null);
  };

  // If Email mode is selected, show Email OCR Workflow
  if (selectedMode === 'email') {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <Toaster position="top-right" />
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <EmailOCRWorkflow onBack={handleBack} />
        </div>
      </div>
    );
  }

  // If Manual mode is selected, show Manual Upload
  if (selectedMode === 'manual') {
    return (
      <div className="min-h-screen bg-white">
        <Toaster position="top-right" />
        <Sidebar />
        <div className="ml-64 p-8">
          <ManualUpload onBack={handleBack} pdfLibLoaded={pdfLibLoaded} />
        </div>
      </div>
    );
  }

  // Default view - Mode Selection
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Toaster position="top-right" />
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Automation via OCR</h1>
          <p className="text-slate-600 mt-1">Choose your document processing method</p>
        </div>

        {/* Mode Selection */}
        <div className="max-w-6xl mx-auto mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ModeSelectionCard
              title="Email"
              description="Automatically process invoices from emails with intelligent extraction and validation workflows"
              icon={
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              }
              buttonText="Initiate"
              gradientClass="bg-gradient-to-br from-emerald-600 to-green-600"
              onClick={handleEmailMode}
            />
            <ModeSelectionCard
              title="Manual"
              description="Upload PDFs for OCR processing"
              icon={
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              }
              buttonText="Initiate"
              gradientClass="bg-gradient-to-br from-blue-500 to-purple-600"
              onClick={handleManualMode}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
