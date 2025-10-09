import { useState } from 'react';
import toast from 'react-hot-toast';

let pdfjsLib: any = null;

interface ConvertedImage {
  base64: string;
  pageNumber: number;
}

interface ManualUploadProps {
  onBack: () => void;
  pdfLibLoaded: boolean;
}

export default function ManualUpload({ onBack, pdfLibLoaded }: ManualUploadProps) {
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceImages, setInvoiceImages] = useState<ConvertedImage[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [poFile, setPOFile] = useState<File | null>(null);
  const [poImages, setPOImages] = useState<ConvertedImage[]>([]);
  const [poLoading, setPOLoading] = useState(false);

  const convertPDFToImages = async (file: File): Promise<ConvertedImage[]> => {
    if (!pdfjsLib) {
      const pdfjs = await import('pdfjs-dist');
      pdfjsLib = pdfjs;
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
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
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      images.push({ base64: canvas.toDataURL('image/png'), pageNumber: pageNum });
    }
    return images;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'invoice' | 'po') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!pdfLibLoaded) { toast.error('PDF library loading...'); return; }
    if (file.type !== 'application/pdf') { toast.error('PDF files only'); return; }
    
    if (type === 'invoice') {
      setInvoiceFile(file);
      setInvoiceLoading(true);
      setInvoiceImages([]);
    } else {
      setPOFile(file);
      setPOLoading(true);
      setPOImages([]);
    }
    
    try {
      const images = await convertPDFToImages(file);
      if (type === 'invoice') setInvoiceImages(images);
      else setPOImages(images);
      toast.success(`${type === 'invoice' ? 'Invoice' : 'PO'} converted: ${images.length} page(s)`);
    } catch (error) {
      toast.error('Error converting PDF');
    } finally {
      if (type === 'invoice') setInvoiceLoading(false);
      else setPOLoading(false);
    }
  };

  const handleProcess = async () => {
    if (invoiceImages.length === 0 || poImages.length === 0) {
      toast.error('Both Invoice and PO PDFs required');
      return;
    }
    toast.loading('Processing...', { id: 'proc' });
    const allImages = [...invoiceImages, ...poImages];
    const imageUrlObjects = allImages.map(img => ({ type: "image_url", image_url: { url: img.base64 } }));
    const payload = {
      model: "usf-mini",
      messages: [{ role: "user", content: [{ type: "text", text: "Process images" }, ...imageUrlObjects, { type: "text", text: "Extract data" }] }],
      tools: [{ name: "image_generate", description: "Generate images", parameters: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } }],
      temperature: 0.7, stream: false, max_tokens: 1024
    };
    try {
      const res = await fetch('https://api.example.com/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      await res.json();
      toast.success('Processing complete!', { id: 'proc' });
    } catch (error) {
      toast.error('Processing failed', { id: 'proc' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manual Upload</h1>
          <p className="text-gray-400">Upload PDFs to convert to images</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onBack} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">Back</button>
          <button onClick={handleProcess} disabled={!invoiceImages.length || !poImages.length} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Process
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {['invoice', 'po'].map((type) => (
          <div key={type} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">{type === 'invoice' ? 'Invoice' : 'Purchase Order'} Upload</h2>
              {(type === 'invoice' ? invoiceFile : poFile) && <button onClick={() => type === 'invoice' ? (setInvoiceFile(null), setInvoiceImages([])) : (setPOFile(null), setPOImages([]))} className="text-red-400 hover:text-red-300 text-sm font-medium">Clear</button>}
            </div>
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                  {(type === 'invoice' ? invoiceFile : poFile) && <p className="mt-2 text-sm text-blue-400 font-medium">{(type === 'invoice' ? invoiceFile : poFile)?.name}</p>}
                </div>
                <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleUpload(e, type as 'invoice' | 'po')} />
              </label>
            </div>
            {(type === 'invoice' ? invoiceLoading : poLoading) && <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div><span className="ml-3 text-gray-400">Converting...</span></div>}
            {(type === 'invoice' ? invoiceImages : poImages).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">Converted Images ({(type === 'invoice' ? invoiceImages : poImages).length} page(s))</h3>
                {(type === 'invoice' ? invoiceImages : poImages).map((img) => (
                  <div key={img.pageNumber} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="mb-3"><span className="text-sm font-medium text-gray-300">Page {img.pageNumber}</span></div>
                    <div className="rounded-lg overflow-hidden border border-white/10"><img src={img.base64} alt={`Page ${img.pageNumber}`} className="w-full" /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
