'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjsLib: any = null;

interface ConvertedImage {
  base64: string;
  pageNumber: number;
}

export default function OCRAutomationPage() {
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceImages, setInvoiceImages] = useState<ConvertedImage[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [copiedInvoicePage, setCopiedInvoicePage] = useState<number | null>(null);
  
  const [poFile, setPOFile] = useState<File | null>(null);
  const [poImages, setPOImages] = useState<ConvertedImage[]>([]);
  const [poLoading, setPOLoading] = useState(false);
  const [copiedPOPage, setCopiedPOPage] = useState<number | null>(null);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

  // Load PDF.js only on client side
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjsLib = pdfjs;
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        setPdfLibLoaded(true);
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
      }
    };
    loadPdfJs();
  }, []);

  const convertPDFToImages = async (file: File): Promise<ConvertedImage[]> => {
    if (!pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: ConvertedImage[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const base64 = canvas.toDataURL('image/png');
      images.push({ base64, pageNumber: pageNum });
    }

    return images;
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!pdfLibLoaded) {
      alert('PDF library is still loading. Please wait a moment.');
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setInvoiceFile(file);
    setInvoiceLoading(true);
    setInvoiceImages([]);

    try {
      const images = await convertPDFToImages(file);
      setInvoiceImages(images);
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Error converting PDF to images');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handlePOUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!pdfLibLoaded) {
      alert('PDF library is still loading. Please wait a moment.');
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setPOFile(file);
    setPOLoading(true);
    setPOImages([]);

    try {
      const images = await convertPDFToImages(file);
      setPOImages(images);
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Error converting PDF to images');
    } finally {
      setPOLoading(false);
    }
  };

  const copyToClipboard = async (base64: string, pageNumber: number, type: string) => {
    try {
      await navigator.clipboard.writeText(base64);
      
      // Update the copied state based on type
      if (type === 'Invoice') {
        setCopiedInvoicePage(pageNumber);
        setTimeout(() => setCopiedInvoicePage(null), 2000);
      } else {
        setCopiedPOPage(pageNumber);
        setTimeout(() => setCopiedPOPage(null), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const downloadImage = (base64: string, pageNumber: number, type: string) => {
    try {
      const link = document.createElement('a');
      link.href = base64;
      link.download = `${type.replace(/\s+/g, '_')}_Page_${pageNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download image');
    }
  };

  const clearInvoice = () => {
    setInvoiceFile(null);
    setInvoiceImages([]);
    setCopiedInvoicePage(null);
  };

  const clearPO = () => {
    setPOFile(null);
    setPOImages([]);
    setCopiedPOPage(null);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)' }}>
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Automation via OCR</h1>
            <p className="text-gray-400">Upload PDF documents to convert them into images and extract base64 data</p>
          </div>

          {/* Grid Layout for Two Upload Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Invoice Upload Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Invoice Upload
                </h2>
                {invoiceFile && (
                  <button
                    onClick={clearInvoice}
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Upload Area */}
              <div className="mb-6">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF files only</p>
                    {invoiceFile && (
                      <p className="mt-2 text-sm text-blue-400 font-medium">{invoiceFile.name}</p>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleInvoiceUpload}
                  />
                </label>
              </div>

              {/* Loading State */}
              {invoiceLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  <span className="ml-3 text-gray-400">Converting PDF to images...</span>
                </div>
              )}

              {/* Converted Images */}
              {invoiceImages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Converted Images ({invoiceImages.length} {invoiceImages.length === 1 ? 'page' : 'pages'})
                  </h3>
                  {invoiceImages.map((image) => (
                    <div key={image.pageNumber} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">Page {image.pageNumber}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(image.base64, image.pageNumber, 'Invoice')}
                            className={`px-4 py-2 ${
                              copiedInvoicePage === image.pageNumber
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                            } text-white rounded-lg text-sm font-medium transition-colors flex items-center`}
                          >
                            {copiedInvoicePage === image.pageNumber ? (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Base64
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => downloadImage(image.base64, image.pageNumber, 'Invoice')}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-white/10">
                        <img src={image.base64} alt={`Invoice Page ${image.pageNumber}`} className="w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Order Upload Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Purchase Order Upload
                </h2>
                {poFile && (
                  <button
                    onClick={clearPO}
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Upload Area */}
              <div className="mb-6">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF files only</p>
                    {poFile && (
                      <p className="mt-2 text-sm text-green-400 font-medium">{poFile.name}</p>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handlePOUpload}
                  />
                </label>
              </div>

              {/* Loading State */}
              {poLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
                  <span className="ml-3 text-gray-400">Converting PDF to images...</span>
                </div>
              )}

              {/* Converted Images */}
              {poImages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Converted Images ({poImages.length} {poImages.length === 1 ? 'page' : 'pages'})
                  </h3>
                  {poImages.map((image) => (
                    <div key={image.pageNumber} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">Page {image.pageNumber}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(image.base64, image.pageNumber, 'Purchase Order')}
                            className={`px-4 py-2 ${
                              copiedPOPage === image.pageNumber
                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                : 'bg-green-500 hover:bg-green-600'
                            } text-white rounded-lg text-sm font-medium transition-colors flex items-center`}
                          >
                            {copiedPOPage === image.pageNumber ? (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Base64
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => downloadImage(image.base64, image.pageNumber, 'Purchase Order')}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-white/10">
                        <img src={image.base64} alt={`PO Page ${image.pageNumber}`} className="w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
