'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { EMAIL_OCR_COMPARISON_SYSTEM_PROMPT } from '../../config/email-ocr-system-prompt';

let pdfjsLib: any = null;

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type WorkflowStage = 'connection' | 'extraction' | 'email-validation' | 'pdf-conversion' | 'document-classification' | 'document-display' | 'comparison' | 'results';

interface ConvertedImage {
  base64: string;
  pageNumber: number;
}

interface ProcessedDocument {
  filename: string;
  images: ConvertedImage[];
  emailId: string;
  attachmentId: string;
  documentType?: 'invoice' | 'purchase_order';
  classificationResponse?: any;
  extractionResponse?: any;
}

interface EmailOCRWorkflowProps {
  onBack: () => void;
}

export default function EmailOCRWorkflow({ onBack }: EmailOCRWorkflowProps) {
  // Email workflow states
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('connection');
  const [gmailTokens, setGmailTokens] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Processing states
  const [convertingPDFs, setConvertingPDFs] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [currentConvertingFile, setCurrentConvertingFile] = useState<string>('');
  const [classifyingDocuments, setClassifyingDocuments] = useState(false);
  const [classificationProgress, setClassificationProgress] = useState(0);

  // Document states
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [invoiceDocuments, setInvoiceDocuments] = useState<ProcessedDocument[]>([]);
  const [poDocuments, setPODocuments] = useState<ProcessedDocument[]>([]);
  
  // Results states
  const [invoiceActiveTab, setInvoiceActiveTab] = useState<'preview' | 'json'>('preview');
  const [poActiveTab, setPOActiveTab] = useState<'preview' | 'json'>('preview');
  const [matchingResult, setMatchingResult] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    // Auto-start Gmail authentication when component mounts
    setTimeout(() => handleGmailAuth(), 100);
  }, []);

  // Gmail authentication
  const handleGmailAuth = async () => {
    setIsAuthenticating(true);
    setConnectionStatus('connecting');
    
    try {
      const response = await fetch('/api/gmail-auth?action=authorize');
      const { authUrl } = await response.json();
      
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      let authSucceeded = false;
      
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GMAIL_AUTH_SUCCESS' && event.data.tokens) {
          authSucceeded = true;
          setGmailTokens(event.data.tokens);
          setConnectionStatus('connected');
          toast.success('Successfully authenticated with Gmail!');
          
          window.removeEventListener('message', messageHandler);
          if (checkClosed) clearInterval(checkClosed);
          
          setTimeout(() => {
            fetchGmailEmails(event.data.tokens);
          }, 2000);
        } else if (event.data.type === 'GMAIL_AUTH_FAILED') {
          authSucceeded = false;
          window.removeEventListener('message', messageHandler);
          if (checkClosed) clearInterval(checkClosed);
          
          setIsAuthenticating(false);
          setConnectionStatus('disconnected');
          
          toast.error(`Gmail authorization failed: ${event.data.error || 'Unknown error'}`);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          
          if (!authSucceeded) {
            setIsAuthenticating(false);
            setConnectionStatus('disconnected');
            toast.error('Gmail authorization cancelled. Please try again.');
          }
        }
      }, 500);
      
    } catch (error) {
      toast.error('Failed to authenticate with Gmail');
      setIsAuthenticating(false);
      setConnectionStatus('disconnected');
    }
  };

  const fetchGmailEmails = async (tokensParam?: any) => {
    try {
      const tokens = tokensParam || gmailTokens;
      
      if (!tokens) {
        toast.error('No authentication tokens available');
        return;
      }

      const response = await fetch('/api/gmail-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: tokens,
          senderEmail: process.env.EMAIL_SENDER_FILTER
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      if (data.emails && data.emails.length > 0) {
        setEmails(data.emails);
        setWorkflowStage('extraction');
        toast.success(`Found ${data.emails.length} emails with attachments`);
      } else {
        toast.error(data.message || 'No emails found with PDF attachments');
      }
      
      setIsAuthenticating(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch emails');
      setIsAuthenticating(false);
    }
  };

  // Enhanced handleProcess function with validation and new workflow
  const handleProcess = async () => {
    // Step 1: Email Validation - Must have exactly 1 email with 2+ PDFs
    if (selectedEmails.size !== 1) {
      toast.error('Please select exactly 1 email with 2+ PDFs to proceed');
      return;
    }
    
    // Validate that the selected email has 2 or more PDFs
    const selectedEmail = emails.find(e => selectedEmails.has(e.id));
    if (!selectedEmail || selectedEmail.attachments.length < 2) {
      toast.error('Selected email must have 2 or more PDF attachments');
      return;
    }
    
    setWorkflowStage('email-validation');
    toast.success(`Email validation passed - Processing 1 email with ${selectedEmail.attachments.length} PDFs`);
    
    // Step 2: PDF Conversion
    await convertEmailPDFs();
  };

  const convertEmailPDFs = async () => {
    setConvertingPDFs(true);
    setConversionProgress(0);
    setWorkflowStage('pdf-conversion');
    setProcessedDocuments([]);
    
    try {
      const selectedEmailsList = emails.filter(e => selectedEmails.has(e.id));
      const processed: ProcessedDocument[] = [];
      let totalAttachments = 0;
      let processedAttachments = 0;
      
      // Count total PDF attachments
      selectedEmailsList.forEach(email => {
        email.attachments.forEach((attachment: any) => {
          if (attachment.filename.toLowerCase().endsWith('.pdf')) {
            totalAttachments++;
          }
        });
      });
      
      for (const email of selectedEmailsList) {
        for (const attachment of email.attachments) {
          if (attachment.filename.toLowerCase().endsWith('.pdf')) {
            try {
              setCurrentConvertingFile(attachment.filename);
              setConversionProgress(Math.round((processedAttachments / totalAttachments) * 100));
              
              // Call the new high-quality PDF-to-image conversion API
              const response = await fetch('/api/pdf-to-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tokens: gmailTokens,
                  messageId: email.messageId,
                  attachmentId: attachment.attachmentId || attachment.id,
                  filename: attachment.filename
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error('PDF conversion API Error:', errorData);
                throw new Error(`Failed to convert ${attachment.filename}: ${errorData.error || 'Unknown error'}`);
              }
              
              const conversionResult = await response.json();
              
              if (!conversionResult.success || !conversionResult.images) {
                throw new Error(`Failed to convert ${attachment.filename}: No images returned`);
              }
              
              // Use the high-quality images from the conversion API
              const images: ConvertedImage[] = conversionResult.images.map((img: any) => ({
                base64: img.base64,
                pageNumber: img.pageNumber
              }));
              
              processed.push({
                filename: attachment.filename,
                images: images,
                emailId: email.id,
                attachmentId: attachment.id
              });
              
              processedAttachments++;
              setConversionProgress(Math.round((processedAttachments / totalAttachments) * 100));
              
              toast.success(`Converted ${attachment.filename} (${images.length} high-quality pages)`);
              
            } catch (error) {
              console.error(`Error converting ${attachment.filename}:`, error);
              toast.error(`Failed to convert ${attachment.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              processedAttachments++;
            }
          }
        }
      }
      
      setProcessedDocuments(processed);
      setConvertingPDFs(false);
      setConversionProgress(100);
      
      if (processed.length > 0) {
        toast.success(`Successfully converted ${processed.length} PDF${processed.length > 1 ? 's' : ''} to images!`);
        // Move to document classification
        setTimeout(() => {
          classifyDocuments(processed);
        }, 1500);
      } else {
        toast.error('No PDFs were successfully converted');
        setWorkflowStage('extraction');
      }
      
    } catch (error) {
      console.error('Error converting PDFs:', error);
      setConvertingPDFs(false);
      setConversionProgress(0);
      toast.error('Failed to convert PDFs. Please try again.');
      setWorkflowStage('extraction');
    }
  };

  // Document Classification - New step
  const classifyDocuments = async (documents: ProcessedDocument[]) => {
    setClassifyingDocuments(true);
    setClassificationProgress(0);
    setWorkflowStage('document-classification');
    
    try {
      const classified: ProcessedDocument[] = [];
      
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setClassificationProgress(Math.round((i / documents.length) * 100));
        
        toast.loading(`Classifying ${doc.filename}...`, { id: `classify-${doc.filename}` });
        
        try {
          // Prepare API payload for classification
          const imageUrlObjects = doc.images.map((img) => ({
            type: "image_url",
            image_url: { url: img.base64 },
          }));

          const payload = {
            model: "usf-mini",
            messages: [
              {
                role: "system",
                content: `
You are a document classification and data extraction assistant trained for financial document analysis.

### Objective:
Given a single PDF document (either an INVOICE or a PURCHASE ORDER), determine:
1. The document type (Invoice, PO, or Work Confirmation)
2. Extract all key business fields relevant for invoice-to-PO matching.

Output must be valid JSON with this schema:

{
  "document_type": "Invoice" | "Purchase Order" | "Work Confirmation",
  "fields": {
    "Supplier Name": "...",
    "Customer Name": "...",
    "Invoice Number": "...",
    "PO Number": "...",
    "Agreement Reference": "...",
    "Date": "...",
    "Subtotal": "...",
    "VAT": "...",
    "VAT Amount": "...",
    "Total Amount": "...",
    "Currency": "...",
    "TRN": "...",
    "Description": "...",
    "Not Found Fields": ["..."]
  }
}

If a field is missing, set it to "Not Found".
Return **only JSON**, with no explanation.
              `,
              },
              {
                role: "user",
                content: [
                  {
                    "type": "text",
                    "text": "analyze"
                },
                  ...imageUrlObjects,
                ],
              },
            ],
            temperature: 0.7,
            stream: false,
            max_tokens: 4096,
          };

          // Call USF API for classification
          const response = await fetch(
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

          const apiResponse = await response.json();
          
          let documentType: 'invoice' | 'purchase_order' = 'invoice'; // default
          
          if (apiResponse.choices && apiResponse.choices[0]?.message?.content) {
            const content = apiResponse.choices[0].message.content.toLowerCase();
            if (content.includes('purchase_order') || content.includes('purchase order')) {
              documentType = 'purchase_order';
            } else if (content.includes('invoice')) {
              documentType = 'invoice';
            }
          }
          
          // Fallback: classify based on filename
          if (!apiResponse.choices) {
            if (doc.filename.toLowerCase().includes('po') || doc.filename.toLowerCase().includes('purchase')) {
              documentType = 'purchase_order';
            }
          }
          
          classified.push({
            ...doc,
            documentType,
            classificationResponse: apiResponse
          });
          
          toast.success(`Classified ${doc.filename} as ${documentType.replace('_', ' ')}`, { id: `classify-${doc.filename}` });
          
        } catch (error) {
          console.error(`Classification error for ${doc.filename}:`, error);
          // Fallback classification based on filename
          const documentType: 'invoice' | 'purchase_order' = 
            doc.filename.toLowerCase().includes('po') || doc.filename.toLowerCase().includes('purchase') 
              ? 'purchase_order' : 'invoice';
          
          classified.push({
            ...doc,
            documentType,
            classificationResponse: { error: 'Classification failed', fallback: true }
          });
          
          toast.error(`Classification failed for ${doc.filename}, using filename fallback`, { id: `classify-${doc.filename}` });
        }
      }
      
      setClassificationProgress(100);
      setClassifyingDocuments(false);
      
      // Separate documents by type
      const invoices = classified.filter(doc => doc.documentType === 'invoice');
      const pos = classified.filter(doc => doc.documentType === 'purchase_order');
      
      setInvoiceDocuments(invoices);
      setPODocuments(pos);
      
      toast.success(`Classification complete! Found ${invoices.length} invoice(s) and ${pos.length} PO(s)`);
      
      // Move to document display stage
      setWorkflowStage('document-display');
      
    } catch (error) {
      console.error('Error classifying documents:', error);
      setClassifyingDocuments(false);
      toast.error('Failed to classify documents. Please try again.');
      setWorkflowStage('extraction');
    }
  };

  // Extract data from documents (like Manual workflow)
  const extractDocumentData = async (documents: ProcessedDocument[], type: 'invoice' | 'purchase_order') => {
    const extracted: ProcessedDocument[] = [];
    
    for (const doc of documents) {
      try {
        const imageUrlObjects = doc.images.map((img) => ({
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
                  text: `You are an intelligent document-processing assistant trained to analyze multiple image inputs.
Review each image carefully and identify whether it contains an ${type === 'invoice' ? 'invoice' : 'purchase order'}.

If it does, extract all relevant structured fields (vendor, ${type === 'invoice' ? 'invoice' : 'PO'} number, date, amount, item details, taxes, totals, etc.).

If an image does not contain relevant financial data, exclude it from analysis.
Maintain consistent output formatting and indicate skipped images clearly if necessary.
Ensure numerical accuracy and preserve formatting for dates and currency.`,
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

        const response = await fetch(
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

        const apiResponse = await response.json();

        // Extract and parse the JSON content from the LLM response
        let parsedContent = apiResponse;

        if (apiResponse.choices && apiResponse.choices[0]?.message?.content) {
          const content = apiResponse.choices[0].message.content;

          // Extract JSON from markdown code block if present
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              parsedContent = JSON.parse(jsonMatch[1]);
            } catch (e) {
              console.error("Failed to parse JSON from content:", e);
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

        extracted.push({
          ...doc,
          extractionResponse: parsedContent
        });

      } catch (error) {
        console.error(`Extraction error for ${doc.filename}:`, error);
        extracted.push({
          ...doc,
          extractionResponse: { error: 'Extraction failed', raw_error: String(error) }
        });
      }
    }
    
    return extracted;
  };

  // Enhanced Comparison Matrix - Compare every invoice with every PO
  const handleProceedToMatch = async () => {
    if (invoiceDocuments.length === 0 || poDocuments.length === 0) {
      toast.error('Need both invoice and PO documents to proceed');
      return;
    }

    setIsMatching(true);
    setMatchingResult(null);
    setWorkflowStage('comparison');

    try {
      const totalComparisons = invoiceDocuments.length * poDocuments.length;
      toast.loading(`Performing ${totalComparisons} comparison(s)...`, { id: "matching" });

      // Extract data from both document types first
      const extractedInvoices = await extractDocumentData(invoiceDocuments, 'invoice');
      const extractedPOs = await extractDocumentData(poDocuments, 'purchase_order');

      // Comparison Matrix: Compare every invoice with every PO
      const comparisonResults = [];
      let completedComparisons = 0;

      for (let i = 0; i < extractedInvoices.length; i++) {
        const invoice = extractedInvoices[i];
        
        for (let j = 0; j < extractedPOs.length; j++) {
          const po = extractedPOs[j];
          
          try {
            toast.loading(`Comparing ${invoice.filename} with ${po.filename}... (${completedComparisons + 1}/${totalComparisons})`, { id: "matching" });

            // Combine images from this specific invoice-PO pair
            const pairImages: ConvertedImage[] = [];
            
            // Add invoice images first
            pairImages.push(...invoice.images);
            // Add PO images
            pairImages.push(...po.images);

            const imageUrlObjects = pairImages.map((img) => ({
              type: "image_url",
              image_url: { url: img.base64 },
            }));

            const payload = {
              model: "usf-mini",
              messages: [
                {
                  role: "system",
                  content: EMAIL_OCR_COMPARISON_SYSTEM_PROMPT,
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Compare this invoice (${invoice.filename}) with this purchase order (${po.filename}). The first ${invoice.images.length} image(s) are from the invoice, and the remaining ${po.images.length} image(s) are from the purchase order. Determine if these documents are related and provide detailed field comparison.`,
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

            // Store comparison result with metadata
            comparisonResults.push({
              invoiceIndex: i,
              poIndex: j,
              invoiceFilename: invoice.filename,
              poFilename: po.filename,
              comparison: parsedContent,
              relationshipScore: parsedContent.summary?.match_percentage || 0,
              isLikelyMatch: (parsedContent.summary?.match_percentage || 0) > 70
            });

            completedComparisons++;

          } catch (error) {
            console.error(`Error comparing ${invoice.filename} with ${po.filename}:`, error);
            
            // Store error result
            comparisonResults.push({
              invoiceIndex: i,
              poIndex: j,
              invoiceFilename: invoice.filename,
              poFilename: po.filename,
              comparison: { error: 'Comparison failed', details: String(error) },
              relationshipScore: 0,
              isLikelyMatch: false
            });

            completedComparisons++;
          }
        }
      }

      // Aggregate results
      const aggregatedResult = {
        totalComparisons: totalComparisons,
        completedComparisons: completedComparisons,
        comparisonMatrix: comparisonResults,
        likelyMatches: comparisonResults.filter(result => result.isLikelyMatch),
        summary: {
          totalInvoices: extractedInvoices.length,
          totalPOs: extractedPOs.length,
          highConfidenceMatches: comparisonResults.filter(result => result.relationshipScore > 80).length,
          mediumConfidenceMatches: comparisonResults.filter(result => result.relationshipScore > 50 && result.relationshipScore <= 80).length,
          lowConfidenceMatches: comparisonResults.filter(result => result.relationshipScore <= 50).length
        }
      };

      setMatchingResult(aggregatedResult);
      setWorkflowStage('results');
      toast.success(`Comparison matrix complete! ${aggregatedResult.likelyMatches.length} likely matches found.`, { id: "matching" });
      
    } catch (error) {
      toast.error("Comparison failed", { id: "matching" });
      console.error("Matching Error:", error);
      setWorkflowStage('document-display');
    } finally {
      setIsMatching(false);
    }
  };

  const toggleEmailSelection = (id: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      // Only allow maximum 1 email
      if (newSelection.size < 1) {
        newSelection.add(id);
      } else {
        toast.error('Only 1 email allowed. Deselect the current email first.');
        return;
      }
    }
    setSelectedEmails(newSelection);
  };

  const renderTabbedResult = (
    documents: ProcessedDocument[],
    activeTab: "preview" | "json",
    setActiveTab: (tab: "preview" | "json") => void,
    title: string
  ) => {
    if (documents.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No {title.toLowerCase()} documents found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-900">
            {title} ({documents.length} document{documents.length > 1 ? 's' : ''})
          </h3>
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
          <div className="space-y-6">
            {documents.map((doc, docIdx) => (
              <div key={docIdx} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-800">{doc.filename}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    doc.documentType === 'invoice' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {doc.documentType?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {doc.images.length} page(s)
                </p>
                {doc.images.map((img) => (
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
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc, docIdx) => (
              <div key={docIdx} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <h4 className="font-medium text-slate-800 mb-3">{doc.filename}</h4>
                <pre className="text-sm text-slate-800 overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {JSON.stringify(doc.extractionResponse || doc.classificationResponse || { message: 'No data available' }, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Connection Stage */}
      {workflowStage === 'connection' && (
        <div className="max-w-3xl mx-auto mt-20">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Connect to Gmail</h2>
            <p className="text-slate-600 mb-8">Authorize access to Gmail to fetch emails with invoice attachments</p>
          </div>

          {connectionStatus === 'connecting' && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-emerald-600"></div>
              </div>
              <p className="text-center text-slate-900 font-medium mb-4">Connecting to Gmail...</p>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-600 to-green-600" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="bg-white rounded-xl shadow-lg border border-green-200 p-8 animate-pulse">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-center text-green-600 font-semibold text-lg">Successfully Connected!</p>
              <p className="text-center text-slate-600 mt-2">Fetching emails...</p>
            </div>
          )}
        </div>
      )}

      {/* Email List - Extraction Stage */}
      {workflowStage === 'extraction' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Emails with Multiple PDF Attachments</h2>
              <p className="text-slate-600">Select 1 email with 2+ PDFs (Invoices and Purchase Orders)</p>
              {selectedEmails.size > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  {selectedEmails.size}/1 email selected
                </p>
              )}
            </div>
            <button 
              onClick={handleProcess} 
              disabled={selectedEmails.size !== 1}
              className={`px-6 py-3 rounded-lg text-white font-semibold transition-all shadow-lg ${
                selectedEmails.size === 1
                  ? 'bg-gradient-to-r from-emerald-600 hover:from-emerald-700 hover:to-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}>
              Process Selected ({selectedEmails.size})
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Select</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Attachments</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {emails.map((email) => (
                <tr key={email.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedEmails.has(email.id)} 
                      onChange={() => toggleEmailSelection(email.id)} 
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 break-words max-w-xs">{email.from}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 break-words max-w-md">{email.subject}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 break-words max-w-xs">{email.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{email.attachments.length} PDF{email.attachments.length > 1 ? 's' : ''}</span>
                      <span className="text-xs text-slate-500 break-words">({email.attachments.map((a: any) => a.filename).join(', ')})</span>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Conversion Stage */}
      {workflowStage === 'pdf-conversion' && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Converting PDFs to Images</h2>
              <p className="text-slate-600 mb-6">Processing PDF attachments for OCR analysis</p>
            </div>

            {convertingPDFs && (
              <div className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-purple-600"></div>
                </div>
                <p className="text-center text-slate-900 font-medium mb-2">
                  Converting: {currentConvertingFile}
                </p>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600" style={{ width: `${conversionProgress}%` }} />
                </div>
                <p className="text-center text-slate-600 text-sm">{conversionProgress}% Complete</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Classification Stage */}
      {workflowStage === 'document-classification' && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Classifying Documents</h2>
              <p className="text-slate-600 mb-6">AI is analyzing documents to identify invoices and purchase orders</p>
            </div>

            {classifyingDocuments && (
              <div className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-blue-600"></div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600" style={{ width: `${classificationProgress}%` }} />
                </div>
                <p className="text-center text-slate-600 text-sm">{classificationProgress}% Complete</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Display Stage - Like Manual Workflow */}
      {workflowStage === 'document-display' && (
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Document Classification Results
              </h1>
              <p className="text-slate-600">
                AI-powered document processing and comparison
              </p>
            </div>
            <div className="flex items-center gap-4">
              {invoiceDocuments.length > 0 && poDocuments.length > 0 && !matchingResult && (
                <button
                  onClick={handleProceedToMatch}
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
                  Invoice Documents
                </h2>
                {invoiceDocuments.length > 0 && (
                  <button
                    onClick={() => setInvoiceDocuments([])}
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {renderTabbedResult(
                invoiceDocuments,
                invoiceActiveTab,
                setInvoiceActiveTab,
                "Invoice"
              )}
            </div>

            {/* Purchase Order Section */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Purchase Order Documents
                </h2>
                {poDocuments.length > 0 && (
                  <button
                    onClick={() => setPODocuments([])}
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {renderTabbedResult(
                poDocuments,
                poActiveTab,
                setPOActiveTab,
                "Purchase Order"
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Stage - Enhanced Comparison Matrix Display */}
      {workflowStage === 'results' && matchingResult && (
        <div className="mt-8 space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Comparison Matrix Results
                </h2>
                <p className="text-blue-100">AI-Powered Document Analysis & Matching</p>
              </div>
              <button
                onClick={() => setMatchingResult(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-blue-200 text-sm mb-2">Total Comparisons</p>
                <p className="text-white text-xl font-bold">
                  {matchingResult.totalComparisons || 0}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-blue-200 text-sm mb-2">Likely Matches</p>
                <p className="text-white text-xl font-bold">
                  {matchingResult.likelyMatches?.length || 0}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-blue-200 text-sm mb-2">High Confidence</p>
                <p className="text-white text-xl font-bold">
                  {matchingResult.summary?.highConfidenceMatches || 0}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-blue-200 text-sm mb-2">Documents</p>
                <p className="text-white text-xl font-bold">
                  {(matchingResult.summary?.totalInvoices || 0) + (matchingResult.summary?.totalPOs || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Matrix Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Document Comparison Matrix</h3>
              <p className="text-sm text-slate-600">All invoice-PO comparisons with confidence scores</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {matchingResult.comparisonMatrix?.map((comparison: any, index: number) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    comparison.isLikelyMatch 
                      ? 'border-green-200 bg-green-50' 
                      : comparison.relationshipScore > 50 
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="font-medium text-slate-900">{comparison.invoiceFilename}</span>
                          <span className="text-slate-500 mx-2">vs</span>
                          <span className="font-medium text-slate-900">{comparison.poFilename}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          comparison.relationshipScore > 80
                            ? 'bg-green-500 text-white'
                            : comparison.relationshipScore > 50
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          {comparison.relationshipScore}% Match
                        </span>
                        {comparison.isLikelyMatch && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Likely Match
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                        View Detailed Comparison
                      </summary>
                      <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                        <pre className="text-xs text-slate-800 overflow-auto max-h-64 whitespace-pre-wrap">
                          {JSON.stringify(comparison.comparison, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Analysis Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{matchingResult.summary?.totalInvoices || 0}</p>
                <p className="text-sm text-slate-600">Invoices</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">{matchingResult.summary?.totalPOs || 0}</p>
                <p className="text-sm text-slate-600">Purchase Orders</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{matchingResult.summary?.highConfidenceMatches || 0}</p>
                <p className="text-sm text-slate-600">High Confidence</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{matchingResult.summary?.mediumConfidenceMatches || 0}</p>
                <p className="text-sm text-slate-600">Medium Confidence</p>
              </div>
            </div>
          </div>

          {/* Complete JSON View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <details>
              <summary className="px-6 py-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                View Complete Matrix JSON Response
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
    </div>
  );
}
