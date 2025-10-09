import { useState } from "react";
import toast from "react-hot-toast";
import {
  OCR_COMPARISON_SYSTEM_PROMPT,
  OCR_EXTRACTION_INSTRUCTION,
} from "../../config/ocr-system-prompt";
import JsonViewer from "../JsonViewer";

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
  const [matchingResult, setMatchingResult] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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
      // Reduced scale from 2.0 to 1.2 for smaller file size
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      // Use JPEG format with compression (0.7 quality) instead of PNG
      // This significantly reduces the base64 size
      images.push({
        base64: canvas.toDataURL("image/jpeg", 0.7),
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
              text: `
                You are an intelligent document data extraction and classification system. You will receive MULTIPLE images. For each image, your task is to:\n\n1) DETECTION & CLASSIFICATION\n- Identify whether the image contains an INVOICE or a PURCHASE ORDER (PO).\n- If neither applies, mark it as {\"document_type\": \"none\", \"skipped\": true, \"reason\": \"No invoice or purchase order detected\"}.\n- If both types appear, select the dominant type (the document's main purpose).\n\n2) SMART DOCUMENT TYPE INFERENCE\nBe context-aware and infer the document type even if explicit words like \"Invoice\" or \"Purchase Order\" are missing.\nUse these advanced heuristics:\n  - **Invoice indicators:** presence of terms like \"Invoice Number\", \"Bill To\", \"Due Date\", \"Payment Terms\", \"Subtotal\", \"Tax\", or bank/payment info.\n  - **Purchase Order indicators:** presence of structured order lines, fields like \"PO Number\", \"Requested By\", \"Approved By\", \"Ship To\", \"Delivery Date\", \"Order Date\", or a layout showing ordered items before invoicing.\n  - If the document shows buyer-issued intent (ordering goods/services) — classify as PURCHASE ORDER.\n  - If the document shows seller-issued billing intent (requesting payment) — classify as INVOICE.\n  - Be smart enough to infer from context (e.g., headers, field semantics, layout, or typical company identifiers).\n\n3) OUTPUT FORMAT (STRICT, UNIFORM JSON)\nReturn a single JSON object with a top-level key \"documents\" that is an array.\nEach array element represents one input image, maintaining the same schema for all document types.\nIf a value is unavailable, use null (do not omit keys).\n\n4) UNIFORM SCHEMA\nEach document object must have the following structure:\n{\n  \"source_id\": string,                // filename or sequential index (e.g. \"1\", \"img_001\")\n  \"document_type\": \"invoice\" | \"purchase_order\" | \"none\",\n  \"skipped\": boolean,\n  \"reason\": string | null,\n  \"currency\": string | null,          // ISO currency code if identifiable\n  \"totals\": {\n    \"subtotal\": number | null,\n    \"tax\": number | null,\n    \"shipping\": number | null,\n    \"discount\": number | null,\n    \"grand_total\": number | null\n  },\n  \"parties\": {\n    \"seller\": {\n      \"name\": string | null,\n      \"tax_id\": string | null,\n      \"address\": string | null,\n      \"email\": string | null,\n      \"phone\": string | null\n    },\n    \"buyer\": {\n      \"name\": string | null,\n      \"tax_id\": string | null,\n      \"address\": string | null,\n      \"email\": string | null,\n      \"phone\": string | null\n    }\n  },\n  \"line_items\": [\n    {\n      \"description\": string | null,\n      \"sku\": string | null,\n      \"quantity\": number | null,\n      \"unit\": string | null,\n      \"unit_price\": number | null,\n      \"tax_rate\": number | null,\n      \"amount\": number | null\n    }\n  ],\n  \"dates\": {\n    \"issue_date\": \"YYYY-MM-DD\" | null,\n    \"due_date\": \"YYYY-MM-DD\" | null,\n    \"delivery_date\": \"YYYY-MM-DD\" | null\n  },\n  \"identifiers\": {\n    \"invoice_number\": string | null,\n    \"po_number\": string | null,\n    \"order_number\": string | null,\n    \"customer_id\": string | null\n  },\n  \"payment_terms\": {\n    \"terms_text\": string | null,\n    \"days\": number | null\n  },\n  \"shipping\": {\n    \"ship_to\": string | null,\n    \"bill_to\": string | null,\n    \"incoterms\": string | null,\n    \"method\": string | null,\n    \"tracking_number\": string | null\n  },\n  \"confidence\": {\n    \"document_type\": number,          // 0-1 likelihood of correct classification\n    \"fields_overall\": number          // 0-1 average extraction confidence\n  }\n}\n\n5) FIELD EXTRACTION LOGIC\n- Always include all keys in the schema, even if null.\n- INVOICE priority fields: invoice_number, issue_date, due_date, totals, payment_terms, seller, buyer.\n- PURCHASE ORDER priority fields: po_number, order_date (issue_date), delivery_date, buyer/seller, line items, and shipping details.\n- Use consistent ISO 8601 (YYYY-MM-DD) for all dates.\n- Parse numeric fields as numbers, remove currency symbols, and put the ISO code in \"currency\".\n- Compute line item amount = quantity x unit_price when possible.\n- Never hallucinate values; use null if uncertain.\n\n6) OUTPUT REQUIREMENTS\n- Output must be a single valid JSON object, structured as:\n{\n  \"documents\": [ {document_1}, {document_2}, ... ]\n}\n- No markdown, no explanations, no commentary.\n- Maintain input order.\n- Ensure perfect JSON validity.\n\nReturn ONLY this JSON structure.
              `,

              // text: `Extract all data from this ${
              //   type === "invoice" ? "invoice" : "purchase order"
              // } document`,
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
        const jsonMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedContent = JSON.parse(jsonMatch[1].trim());
            console.log("Successfully parsed JSON from markdown block:", parsedContent);
          } catch (e) {
            console.error("Failed to parse JSON from markdown block:", e);
            parsedContent = { raw_content: content };
          }
        } else {
          // If no JSON block found, try to parse the entire content as JSON
          try {
            parsedContent = JSON.parse(content);
            console.log("Successfully parsed raw JSON content:", parsedContent);
          } catch (e) {
            console.error("Content is not valid JSON, keeping as raw text");
            // If parsing fails, extract structured data from raw content
            parsedContent = {
              raw_content: content,
              extracted_data: extractSummaryFromText(content)
            };
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

  const handleProceed = async () => {
    if (!invoiceResult || !poResult) return;

    setIsMatching(true);
    setMatchingResult(null);

    try {
      toast.loading("Comparing Invoice and PO...", { id: "matching" });

      // Combine all images from both invoice and PO
      const allImages = [...invoiceResult.images, ...poResult.images];

      const imageUrlObjects = allImages.map((img) => ({
        type: "image_url",
        image_url: { url: img.base64 },
      }));

      const payload = {
        model: "usf-mini",
        messages: [
          {
            role: "system",
            content: OCR_COMPARISON_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Compare these invoice and purchase order documents. The first ${invoiceResult.images.length} image(s) are from the invoice, and the remaining ${poResult.images.length} image(s) are from the purchase order.

IMPORTANT: In your response, please:
1. Extract all data from both documents in JSON format
2. Create a field mapping showing which Invoice fields correspond to which PO fields (even if key names differ)
3. Identify value matches (where values are same but keys might be different)
4. Identify mismatches (where keys map but values differ)
5. Show the differences between Invoice and Purchase Order clearly
6. Provide a risk score and overall analysis

Include sections for:
- invoice_data: All extracted invoice fields
- po_data: All extracted PO/Work Confirmation fields
- field_mapping: Show how fields correspond (e.g., "invoice_number" → "document_number")
- matched_values: Fields with same values (even if key names differ)
- mismatched_values: Fields that should match but have different values
- differences_summary: Clear explanation of what differs between the documents`,
              },
              ...imageUrlObjects,
            ],
          },
        ],
        temperature: 0.7,
        stream: false,
        max_tokens: 4096,
      };

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

      // Extract and parse the JSON content
      let parsedContent = response;

      if (response.choices && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content;

        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedContent = JSON.parse(jsonMatch[1]);
          } catch (e) {
            console.error("Failed to parse JSON from content:", e);
            parsedContent = { raw_content: content };
          }
        } else {
          try {
            parsedContent = JSON.parse(content);
          } catch (e) {
            parsedContent = { raw_content: content };
          }
        }
      }

      // Check if we got raw_content and try to parse it better
      if (parsedContent.raw_content && typeof parsedContent.raw_content === 'string') {
        // Try to extract structured data from markdown-style text
        const rawText = parsedContent.raw_content;
        parsedContent = {
          is_raw_response: true,
          raw_text: rawText,
          extracted_summary: extractSummaryFromText(rawText)
        };
      }

      setMatchingResult(parsedContent);
      toast.success("Comparison complete!", { id: "matching" });
      
      // Auto-scroll to comparison section
      setTimeout(() => {
        const comparisonSection = document.getElementById('comparison-section');
        if (comparisonSection) {
          comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      toast.error("Comparison failed", { id: "matching" });
      console.error("Matching Error:", error);
    } finally {
      setIsMatching(false);
    }
  };

  // Helper function to extract structured data from raw text
  const extractSummaryFromText = (text: string) => {
    const result: any = {};
    
    // Remove markdown formatting
    let cleanText = text.replace(/\*\*/g, '');
    
    // Extract Document Type
    const docTypeMatch = cleanText.match(/Document Type:\s*([^\n]+)/i);
    if (docTypeMatch) result.document_type = docTypeMatch[1].trim();

    // Extract Vendor Details
    const vendorNameMatch = cleanText.match(/Vendor Name:\s*([^\n]+)/i);
    if (vendorNameMatch) result.vendor_name = vendorNameMatch[1].trim();

    const vendorTaxMatch = cleanText.match(/Vendor Tax Registration Number:\s*([^\n]+)/i);
    if (vendorTaxMatch) result.vendor_tax_number = vendorTaxMatch[1].trim();

    // Extract Invoice Details
    const invoiceNumMatch = cleanText.match(/Invoice Number:\s*([^\n]+)/i);
    if (invoiceNumMatch) result.invoice_number = invoiceNumMatch[1].trim();

    const invoiceDateMatch = cleanText.match(/Invoice Date:\s*([^\n]+)/i);
    if (invoiceDateMatch) result.invoice_date = invoiceDateMatch[1].trim();

    const dueDateMatch = cleanText.match(/Due Date:\s*([^\n]+)/i);
    if (dueDateMatch) result.due_date = dueDateMatch[1].trim();

    const contractPOMatch = cleanText.match(/Contract\/P\.?O\.? Number:\s*([^\n]+)/i);
    if (contractPOMatch) result.contract_po_number = contractPOMatch[1].trim();

    const serviceMonthMatch = cleanText.match(/Service Month:\s*([^\n]+)/i);
    if (serviceMonthMatch) result.service_month = serviceMonthMatch[1].trim();

    // Extract Customer Details
    const customerToMatch = cleanText.match(/To:\s*([^\n]+)/i);
    if (customerToMatch) result.customer_name = customerToMatch[1].trim();

    const addressMatch = cleanText.match(/Address:\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    if (addressMatch) result.customer_address = addressMatch[1].trim().replace(/\n/g, ' ');

    const phoneMatch = cleanText.match(/Phone:\s*([^\n]+)/i);
    if (phoneMatch) result.phone = phoneMatch[1].trim();

    const taxRegMatch = cleanText.match(/Tax Registration Number:\s*([^\n]+)/i);
    if (taxRegMatch) result.customer_tax_number = taxRegMatch[1].trim();

    // Extract Financial Details
    const subtotalMatch = cleanText.match(/Subtotal:\s*(?:AED\s*)?([0-9,]+\.?\d*)/i);
    if (subtotalMatch) result.subtotal = subtotalMatch[1].trim();

    const taxMatch = cleanText.match(/Tax.*?:\s*(?:AED\s*)?([0-9,]+\.?\d*)/i);
    if (taxMatch) result.tax_amount = taxMatch[1].trim();

    const totalMatch = cleanText.match(/Total:\s*(?:AED\s*)?([0-9,]+\.?\d*)/i);
    if (totalMatch) result.total_amount = totalMatch[1].trim();

    // Extract Item Details
    const descMatch = cleanText.match(/Description:\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    if (descMatch) result.item_description = descMatch[1].trim().replace(/\n/g, ' ');

    const qtyMatch = cleanText.match(/(?:Qty|Quantity):\s*([^\n]+)/i);
    if (qtyMatch) result.quantity = qtyMatch[1].trim();

    const rateMatch = cleanText.match(/Rate:\s*([^\n]+)/i);
    if (rateMatch) result.rate = rateMatch[1].trim();

    return result;
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
          <h3 className="text-lg font-medium text-slate-900 truncate max-w-xs" title={result.fileName}>
            {result.fileName}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-blue-500 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Image
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "json"
                  ? "bg-blue-500 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              JSON
            </button>
            </div>
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
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm max-h-[600px] overflow-auto">
            <pre className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-mono">
              {result.response.extracted_data 
                ? JSON.stringify(result.response.extracted_data, null, 2)
                : result.response.raw_content 
                ? result.response.raw_content
                : JSON.stringify(result.response, null, 2)}
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Manual Upload
          </h1>
          <p className="text-slate-600">
            Upload PDFs for AI-powered data extraction
          </p>
        </div>
        <div className="flex items-center gap-4">
          {invoiceResult && poResult && !matchingResult && (
            <button
              onClick={handleProceed}
              disabled={isMatching}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isMatching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span>Proceed to Match</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoice Section */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Invoice Upload
            </h2>
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

      {/* Matching Results Section */}
      {matchingResult && (
        <div id="comparison-section" className="mt-8 space-y-6">
       
          {/* Side-by-Side Comparison of Invoice and PO Data */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Document Comparison</h3>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-white font-medium">Export</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/4">
                      Field Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/3">
                      Invoice Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/3">
                      PO Value
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-24">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    // Extract document data - handle both nested documents array and flat structure
                    const getDocumentData = (response: any) => {
                      if (response?.documents && Array.isArray(response.documents) && response.documents.length > 0) {
                        return response.documents[0];
                      }
                      return response?.extracted_data || response || {};
                    };

                    const invoiceDoc = getDocumentData(invoiceResult?.response);
                    const poDoc = getDocumentData(poResult?.response);

                    // Helper to safely get nested values
                    const getValue = (obj: any, path: string) => {
                      const keys = path.split('.');
                      let value = obj;
                      for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                          value = value[key];
                        } else {
                          return undefined;
                        }
                      }
                      return value;
                    };

                    // Define key fields to display
                    const fieldsToShow = [
                      { label: 'Document Type', path: 'document_type' },
                      { label: 'Source ID', path: 'source_id' },
                      { label: 'Currency', path: 'currency' },
                      { label: 'Subtotal', path: 'totals.subtotal' },
                      { label: 'Tax', path: 'totals.tax' },
                      { label: 'Shipping', path: 'totals.shipping' },
                      { label: 'Discount', path: 'totals.discount' },
                      { label: 'Grand Total', path: 'totals.grand_total' },
                      { label: 'Seller Name', path: 'parties.seller.name' },
                      { label: 'Seller Tax ID', path: 'parties.seller.tax_id' },
                      { label: 'Seller Address', path: 'parties.seller.address' },
                      { label: 'Seller Email', path: 'parties.seller.email' },
                      { label: 'Seller Phone', path: 'parties.seller.phone' },
                      { label: 'Buyer Name', path: 'parties.buyer.name' },
                      { label: 'Buyer Tax ID', path: 'parties.buyer.tax_id' },
                      { label: 'Buyer Address', path: 'parties.buyer.address' },
                      { label: 'Issue Date', path: 'dates.issue_date' },
                      { label: 'Due Date', path: 'dates.due_date' },
                      { label: 'Delivery Date', path: 'dates.delivery_date' },
                      { label: 'Invoice Number', path: 'identifiers.invoice_number' },
                      { label: 'PO Number', path: 'identifiers.po_number' },
                      { label: 'Order Number', path: 'identifiers.order_number' },
                      { label: 'Customer ID', path: 'identifiers.customer_id' },
                      { label: 'Payment Terms', path: 'payment_terms.terms_text' },
                      { label: 'Payment Days', path: 'payment_terms.days' },
                    ];

                    return fieldsToShow.map(({ label, path }) => {
                      const invoiceValue = getValue(invoiceDoc, path);
                      const poValue = getValue(poDoc, path);

                      // Skip if both are null/undefined
                      if (invoiceValue === null && poValue === null) return null;
                      if (invoiceValue === undefined && poValue === undefined) return null;

                      // Check if values match
                      const valuesMatch = JSON.stringify(invoiceValue) === JSON.stringify(poValue);

                      const formatValue = (val: any) => {
                        if (val === null || val === undefined) return '-';
                        if (typeof val === 'object') return JSON.stringify(val);
                        return String(val);
                      };

                      return (
                        <tr
                          key={path}
                          className={`hover:bg-slate-50 transition-colors ${
                            !valuesMatch && invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null
                              ? 'bg-red-50/20'
                              : valuesMatch && invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null
                              ? 'bg-green-50/20'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900">
                              {label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-700 break-words">
                              {formatValue(invoiceValue)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-700 break-words">
                              {formatValue(poValue)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null ? (
                              valuesMatch ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    }).filter(Boolean);
                  })()}
                </tbody>
              </table>
            </div>
          </div>

         

          {/* Raw JSON View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <details>
              <summary className="px-6 py-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                View Complete JSON Response
              </summary>
              <div className="px-6 pb-6">
                <pre className="text-xs text-slate-800 overflow-auto max-h-96 whitespace-pre-wrap bg-slate-50 p-4 rounded border border-slate-200">
                  {JSON.stringify(matchingResult, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Export Options</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-3">
              {/* Export as PDF */}
              <button
                onClick={() => {
                  toast.success('PDF export coming soon!');
                  setShowExportModal(false);
                }}
                className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Export as PDF</span>
              </button>

              {/* Export as CSV */}
              <button
                onClick={() => {
                  // Extract document data
                  const getDocumentData = (response: any) => {
                    if (response?.documents && Array.isArray(response.documents) && response.documents.length > 0) {
                      return response.documents[0];
                    }
                    return response?.extracted_data || response || {};
                  };

                  const invoiceDoc = getDocumentData(invoiceResult?.response);
                  const poDoc = getDocumentData(poResult?.response);

                  const getValue = (obj: any, path: string) => {
                    const keys = path.split('.');
                    let value = obj;
                    for (const key of keys) {
                      if (value && typeof value === 'object' && key in value) {
                        value = value[key];
                      } else {
                        return undefined;
                      }
                    }
                    return value;
                  };

                  const fieldsToShow = [
                    { label: 'Document Type', path: 'document_type' },
                    { label: 'Source ID', path: 'source_id' },
                    { label: 'Currency', path: 'currency' },
                    { label: 'Subtotal', path: 'totals.subtotal' },
                    { label: 'Tax', path: 'totals.tax' },
                    { label: 'Grand Total', path: 'totals.grand_total' },
                    { label: 'Seller Name', path: 'parties.seller.name' },
                    { label: 'Buyer Name', path: 'parties.buyer.name' },
                    { label: 'Issue Date', path: 'dates.issue_date' },
                    { label: 'Invoice Number', path: 'identifiers.invoice_number' },
                    { label: 'PO Number', path: 'identifiers.po_number' },
                  ];

                  // Create CSV content
                  let csvContent = 'Field Name,Invoice Value,PO Value,Status\n';
                  
                  fieldsToShow.forEach(({ label, path }) => {
                    const invoiceValue = getValue(invoiceDoc, path);
                    const poValue = getValue(poDoc, path);
                    
                    if (invoiceValue !== null && invoiceValue !== undefined || poValue !== null && poValue !== undefined) {
                      const formatValue = (val: any) => {
                        if (val === null || val === undefined) return '-';
                        if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
                        return String(val).replace(/"/g, '""');
                      };
                      
                      const valuesMatch = JSON.stringify(invoiceValue) === JSON.stringify(poValue);
                      const status = (invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null) 
                        ? (valuesMatch ? 'Match' : 'Mismatch') 
                        : '-';
                      
                      csvContent += `"${label}","${formatValue(invoiceValue)}","${formatValue(poValue)}","${status}"\n`;
                    }
                  });

                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'document-comparison.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('CSV exported successfully!');
                  setShowExportModal(false);
                }}
                className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Export as CSV</span>
              </button>

              {/* Export as JSON */}
              <button
                onClick={() => {
                  const dataToExport = {
                    invoice: invoiceResult?.response,
                    purchaseOrder: poResult?.response,
                    comparison: matchingResult
                  };
                  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'document-comparison.json';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('JSON exported successfully!');
                  setShowExportModal(false);
                }}
                className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="font-medium">Export as JSON</span>
              </button>

              {/* REST API (Coming Soon) */}
              <button
                disabled
                className="w-full px-4 py-3 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <span className="font-medium">REST API (Coming Soon)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
