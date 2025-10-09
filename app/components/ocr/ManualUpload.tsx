import { useState } from "react";
import toast from "react-hot-toast";

let pdfjsLib: any = null;

interface ConvertedImage {
  base64: string;
  pageNumber: number;
}

interface ProcessedResult {
  images: ConvertedImage[];
  response: any;
  fileName: string;
}

interface ManualUploadProps {
  onBack: () => void;
  pdfLibLoaded: boolean;
}

export default function ManualUpload({
  onBack,
  pdfLibLoaded,
}: ManualUploadProps) {
  const [invoiceResult, setInvoiceResult] = useState<ProcessedResult | null>(
    null
  );
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [poResult, setPOResult] = useState<ProcessedResult | null>(null);
  const [poLoading, setPOLoading] = useState(false);
  const [invoiceActiveTab, setInvoiceActiveTab] = useState<"preview" | "json">(
    "preview"
  );
  const [poActiveTab, setPOActiveTab] = useState<"preview" | "json">("preview");

  const convertPDFToImages = async (file: File): Promise<ConvertedImage[]> => {
    if (!pdfjsLib) {
      const pdfjs = await import("pdfjs-dist");
      pdfjsLib = pdfjs;
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: ConvertedImage[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      images.push({
        base64: canvas.toDataURL("image/png"),
        pageNumber: pageNum,
      });
    }
    return images;
  };

  const handleProcess = async (
    images: ConvertedImage[],
    fileName: string,
    type: "invoice" | "po"
  ) => {
    // Prepare API payload with base64 images
    const imageUrlObjects = images.map((img) => ({
      type: "image_url",
      image_url: { url: img.base64 },
    }));

    const payload = {
      model: "usf-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all data from this ${
                type === "invoice" ? "invoice" : "purchase order"
              } document`,
            },
            ...imageUrlObjects,
            {
              type: "text",
              text: "Provide structured data extraction including vendor name, amount, date, items, and other relevant fields",
            },
          ],
        },
      ],
      temperature: 0.7,
      stream: false,
      max_tokens: 2048,
    };

    try {
      // Call your API endpoint here
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/usf/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
          body: JSON.stringify(payload),
        }
      );

      const response = await res.json();

      // Extract and parse the JSON content from the LLM response
      let parsedContent = response;
      
      if (response.choices && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content;
        
        // Extract JSON from markdown code block if present
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedContent = JSON.parse(jsonMatch[1]);
          } catch (e) {
            console.error('Failed to parse JSON from content:', e);
            parsedContent = { raw_content: content };
          }
        } else {
          // If no JSON block found, try to parse the entire content
          try {
            parsedContent = JSON.parse(content);
          } catch (e) {
            // If parsing fails, store the raw content
            parsedContent = { raw_content: content };
          }
        }
      }

      // Store the result with images and parsed response
      const result: ProcessedResult = {
        images,
        response: parsedContent,
        fileName,
      };

      if (type === "invoice") {
        setInvoiceResult(result);
        setInvoiceActiveTab("preview");
      } else {
        setPOResult(result);
        setPOActiveTab("preview");
      }

      toast.success(
        `${type === "invoice" ? "Invoice" : "PO"} processed successfully!`
      );
    } catch (error) {
      toast.error("Processing failed");
      console.error("API Error:", error);
    }
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "invoice" | "po"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!pdfLibLoaded) {
      toast.error("PDF library loading...");
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("PDF files only");
      return;
    }

    // Start loading
    if (type === "invoice") {
      setInvoiceLoading(true);
      setInvoiceResult(null);
    } else {
      setPOLoading(true);
      setPOResult(null);
    }

    try {
      // Step 1: Convert PDF to images
      toast.loading(`Converting ${file.name}...`, { id: `convert-${type}` });
      const images = await convertPDFToImages(file);
      toast.success(`Converted ${images.length} page(s)`, {
        id: `convert-${type}`,
      });

      // Step 2: Automatically process the images
      toast.loading("Processing with AI...", { id: `process-${type}` });
      await handleProcess(images, file.name, type);
      toast.success("Processing complete!", { id: `process-${type}` });
    } catch (error) {
      toast.error("Error processing PDF", { id: `process-${type}` });
      console.error(error);
    } finally {
      if (type === "invoice") {
        setInvoiceLoading(false);
      } else {
        setPOLoading(false);
      }
    }

    // Reset file input
    e.target.value = "";
  };

  const renderTabbedResult = (
    result: ProcessedResult,
    activeTab: "preview" | "json",
    setActiveTab: (tab: "preview" | "json") => void
  ) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-900">{result.fileName}</h3>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-blue-500 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Image Preview
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "json"
                  ? "bg-blue-500 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              JSON Response
            </button>
          </div>
        </div>

        {activeTab === "preview" ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {result.images.length} page(s)
            </p>
            {result.images.map((img) => (
              <div
                key={img.pageNumber}
                className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm"
              >
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-700">
                    Page {img.pageNumber}
                  </span>
                </div>
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={img.base64}
                    alt={`Page ${img.pageNumber}`}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <pre className="text-sm text-slate-800 overflow-auto max-h-[600px] whitespace-pre-wrap">
              {JSON.stringify(result.response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Manual Upload</h1>
          <p className="text-slate-600">
            Upload PDFs for AI-powered data extraction
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoice Section */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Invoice Upload</h2>
            {invoiceResult && (
              <button
                onClick={() => setInvoiceResult(null)}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {!invoiceResult && !invoiceLoading && (
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
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => handleUpload(e, "invoice")}
                />
              </label>
            </div>
          )}

          {invoiceLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
              <span className="text-gray-400">Processing...</span>
            </div>
          )}

          {invoiceResult &&
            renderTabbedResult(
              invoiceResult,
              invoiceActiveTab,
              setInvoiceActiveTab
            )}
        </div>

        {/* Purchase Order Section */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Purchase Order Upload
            </h2>
            {poResult && (
              <button
                onClick={() => setPOResult(null)}
                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {!poResult && !poLoading && (
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
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => handleUpload(e, "po")}
                />
              </label>
            </div>
          )}

          {poLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
              <span className="text-gray-400">Processing...</span>
            </div>
          )}

          {poResult &&
            renderTabbedResult(poResult, poActiveTab, setPOActiveTab)}
        </div>
      </div>
    </div>
  );
}
