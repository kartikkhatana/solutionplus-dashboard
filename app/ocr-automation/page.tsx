'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import ModeSelectionCard from '../components/ocr/ModeSelectionCard';
import ManualUpload from '../components/ocr/ManualUpload';

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
    // Redirect to semi-automated workflow for email processing
    window.location.href = '/semi-automated-workflow';
  };

  const handleManualMode = () => {
    setSelectedMode('manual');
  };

  const handleBack = () => {
    setSelectedMode(null);
  };

  // Mode selection screen
  if (!selectedMode) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)' }}>
        <Toaster position="top-right" toastOptions={{ 
          duration: 3000, 
          style: { background: '#1a1f3a', color: '#fff', border: '1px solid rgba(107, 70, 193, 0.3)' }, 
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } }, 
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } } 
        }} />
        <Sidebar />
        <div className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-white mb-3">Automation via OCR</h1>
              <p className="text-gray-400 text-lg">Choose your document processing method</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <ModeSelectionCard
                title="Email"
                description="Automatically process invoices from emails"
                icon={
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                }
                buttonText="Initiate"
                gradientClass="bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"
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
        </div>
      </div>
    );
  }

  // Manual upload mode
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)' }}>
      <Toaster position="top-right" toastOptions={{ 
        duration: 3000, 
        style: { background: '#1a1f3a', color: '#fff', border: '1px solid rgba(107, 70, 193, 0.3)' }, 
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } }, 
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } } 
      }} />
      <Sidebar />
      <div className="ml-64 p-8">
        <ManualUpload onBack={handleBack} pdfLibLoaded={pdfLibLoaded} />
      </div>
    </div>
  );
}
