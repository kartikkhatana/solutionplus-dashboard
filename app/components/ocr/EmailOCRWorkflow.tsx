'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { EMAIL_OCR_COMPARISON_SYSTEM_PROMPT } from '../../config/email-ocr-system-prompt';

let pdfjsLib: any = null;

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type WorkflowStage = 'connection' | 'email-selection' | 'processing' | 'analysis' | 'results';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  // Document states
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [invoiceDocuments, setInvoiceDocuments] = useState<ProcessedDocument[]>([]);
  const [poDocuments, setPODocuments] = useState<ProcessedDocument[]>([]);
  
  // Results states
  const [matchingResult, setMatchingResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Tab states for document preview
  const [invoiceActiveTab, setInvoiceActiveTab] = useState<'preview' | 'json'>('preview');
  const [poActiveTab, setPOActiveTab] = useState<'preview' | 'json'>('preview');
  
  // Expandable data states
  const [expandedInvoiceData, setExpandedInvoiceData] = useState<{[key: string]: boolean}>({});
  const [expandedPOData, setExpandedPOData] = useState<{[key: string]: boolean}>({});
  
  // Action states for approve/reject functionality
  const [selectedComparison, setSelectedComparison] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());
  const [comparisonStatuses, setComparisonStatuses] = useState<{[key: number]: 'Processing' | 'Approved' | 'Rejected'}>({});

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
          toast.success('Connected to Gmail successfully!');
          
          window.removeEventListener('message', messageHandler);
          if (checkClosed) clearInterval(checkClosed);
          
          setTimeout(() => {
            fetchGmailEmails(event.data.tokens);
          }, 1500);
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
        setWorkflowStage('email-selection');
        toast.success(`Found ${data.emails.length} emails with documents`);
      } else {
        toast.error(data.message || 'No emails found with PDF attachments');
      }
      
      setIsAuthenticating(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch emails');
      setIsAuthenticating(false);
    }
  };

  // Modern processing workflow
  const handleProcessDocuments = async () => {
    if (selectedEmails.size !== 1) {
      toast.error('Please select exactly 1 email to process');
      return;
    }
    
    const selectedEmail = emails.find(e => selectedEmails.has(e.id));
    if (!selectedEmail || selectedEmail.attachments.length < 2) {
      toast.error('Selected email must have 2 or more documents');
      return;
    }
    
    setWorkflowStage('processing');
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Preparing documents...');
    
    try {
      // Step 1: Process documents (hidden PDF conversion)
      await processDocuments(selectedEmail);
      
      // Step 2: Analyze documents
      setProcessingStep('Analyzing document types...');
      setProcessingProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Complete processing
      setProcessingStep('Finalizing analysis...');
      setProcessingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setWorkflowStage('analysis');
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Processing error:', error);
      setIsProcessing(false);
      toast.error('Failed to process documents. Please try again.');
      setWorkflowStage('email-selection');
    }
  };

  const processDocuments = async (email: any) => {
    const processed: ProcessedDocument[] = [];
    let totalAttachments = email.attachments.filter((a: any) => a.filename.toLowerCase().endsWith('.pdf')).length;
    let processedCount = 0;
    
    for (const attachment of email.attachments) {
      if (attachment.filename.toLowerCase().endsWith('.pdf')) {
        try {
          setCurrentFile(attachment.filename);
          setProcessingProgress(Math.round((processedCount / totalAttachments) * 40)); // Up to 40% for processing
          
          // Convert PDF to images (hidden from user)
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
            throw new Error(`Failed to process ${attachment.filename}`);
          }
          
          const conversionResult = await response.json();
          
          if (!conversionResult.success || !conversionResult.images) {
            throw new Error(`Failed to process ${attachment.filename}`);
          }
          
          const images: ConvertedImage[] = conversionResult.images.map((img: any) => ({
            base64: img.base64,
            pageNumber: img.pageNumber
          }));
          
          // Classify document
          const documentType = await classifyDocument(attachment.filename, images);
          
          processed.push({
            filename: attachment.filename,
            images: images,
            emailId: email.id,
            attachmentId: attachment.id,
            documentType: documentType.type,
            classificationResponse: documentType.response
          });
          
          processedCount++;
          
        } catch (error) {
          console.error(`Error processing ${attachment.filename}:`, error);
          processedCount++;
        }
      }
    }
    
    setProcessedDocuments(processed);
    
    // Separate documents by type
    const invoices = processed.filter(doc => doc.documentType === 'invoice');
    const pos = processed.filter(doc => doc.documentType === 'purchase_order');
    
    setInvoiceDocuments(invoices);
    setPODocuments(pos);
  };

  const classifyDocument = async (filename: string, images: ConvertedImage[]) => {
    try {
      const imageUrlObjects = images.map((img) => ({
        type: "image_url",
        image_url: { url: img.base64 },
      }));

      const payload = {
        model: "usf-mini",
        messages: [
          {
            role: "system",
            content: "Analyze this document and return a JSON response with document_type (either 'Invoice' or 'Purchase Order') and extracted fields."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "analyze" },
              ...imageUrlObjects,
            ],
          },
        ],
        temperature: 0.1,
        stream: false,
        max_tokens: 1000,
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
      
      let documentType: 'invoice' | 'purchase_order' = 'invoice';
      let parsedContent = null;
      
      if (apiResponse.choices && apiResponse.choices[0]?.message?.content) {
        const content = apiResponse.choices[0].message.content;
        
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedContent = JSON.parse(jsonMatch[1]);
            
            if (parsedContent.document_type) {
              const docType = parsedContent.document_type.toLowerCase();
              if (docType.includes('purchase') || docType.includes('po')) {
                documentType = 'purchase_order';
              } else if (docType.includes('invoice')) {
                documentType = 'invoice';
              }
            }
          } catch (e) {
            parsedContent = { raw_content: content };
          }
        }
      }
      
      // Fallback classification
      if (!parsedContent) {
        if (filename.toLowerCase().includes('po') || filename.toLowerCase().includes('purchase')) {
          documentType = 'purchase_order';
        }
      }
      
      return {
        type: documentType,
        response: {
          ...apiResponse,
          parsedContent: parsedContent
        }
      };
      
    } catch (error) {
      console.error(`Classification error for ${filename}:`, error);
      return {
        type: filename.toLowerCase().includes('po') || filename.toLowerCase().includes('purchase') 
          ? 'purchase_order' as const : 'invoice' as const,
        response: { error: 'Classification failed', fallback: true }
      };
    }
  };

  // Modern comparison function
  const handleStartComparison = async () => {
    if (invoiceDocuments.length === 0 || poDocuments.length === 0) {
      toast.error('Need both invoice and purchase order documents to compare');
      return;
    }

    setIsAnalyzing(true);
    setMatchingResult(null);

    try {
      const totalComparisons = invoiceDocuments.length * poDocuments.length;
      const comparisonResults = [];
      let completedComparisons = 0;

      for (let i = 0; i < invoiceDocuments.length; i++) {
        const invoice = invoiceDocuments[i];
        
        for (let j = 0; j < poDocuments.length; j++) {
          const po = poDocuments[j];
          
          try {
            const invoiceData = invoice.classificationResponse?.parsedContent || {};
            const poData = po.classificationResponse?.parsedContent || {};

            const payload = {
              model: "usf-mini",
              messages: [
                {
                  role: "system",
                  content: EMAIL_OCR_COMPARISON_SYSTEM_PROMPT,
                },
                {
                  role: "user",
                  content: `Compare these documents and provide detailed field-by-field analysis:

INVOICE DATA (${invoice.filename}):
${JSON.stringify(invoiceData, null, 2)}

PURCHASE ORDER DATA (${po.filename}):
${JSON.stringify(poData, null, 2)}

Perform intelligent comparison and provide confidence scores.`,
                },
              ],
              temperature: 0.3,
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
            let parsedContent = response;

            if (response.choices && response.choices[0]?.message?.content) {
              const content = response.choices[0].message.content;
              const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
              if (jsonMatch && jsonMatch[1]) {
                try {
                  parsedContent = JSON.parse(jsonMatch[1]);
                } catch (e) {
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

            comparisonResults.push({
              invoiceIndex: i,
              poIndex: j,
              invoiceFilename: invoice.filename,
              poFilename: po.filename,
              invoiceData: invoiceData,
              poData: poData,
              comparison: parsedContent,
              relationshipScore: parsedContent.summary?.match_percentage || 0,
              isLikelyMatch: (parsedContent.summary?.match_percentage || 0) > 70
            });

            completedComparisons++;

          } catch (error) {
            console.error(`Error comparing ${invoice.filename} with ${po.filename}:`, error);
            
            comparisonResults.push({
              invoiceIndex: i,
              poIndex: j,
              invoiceFilename: invoice.filename,
              poFilename: po.filename,
              invoiceData: invoice.classificationResponse?.parsedContent || {},
              poData: po.classificationResponse?.parsedContent || {},
              comparison: { error: 'Comparison failed', details: String(error) },
              relationshipScore: 0,
              isLikelyMatch: false
            });

            completedComparisons++;
          }
        }
      }

      const aggregatedResult = {
        totalComparisons: totalComparisons,
        completedComparisons: completedComparisons,
        comparisonMatrix: comparisonResults,
        likelyMatches: comparisonResults.filter(result => result.isLikelyMatch),
        summary: {
          totalInvoices: invoiceDocuments.length,
          totalPOs: poDocuments.length,
          highConfidenceMatches: comparisonResults.filter(result => result.relationshipScore > 80).length,
          mediumConfidenceMatches: comparisonResults.filter(result => result.relationshipScore > 50 && result.relationshipScore <= 80).length,
          lowConfidenceMatches: comparisonResults.filter(result => result.relationshipScore <= 50).length
        }
      };

      setMatchingResult(aggregatedResult);
      setWorkflowStage('results');
      toast.success(`Analysis complete! Found ${aggregatedResult.likelyMatches.length} likely matches.`);
      
    } catch (error) {
      toast.error("Analysis failed");
      console.error("Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleEmailSelection = (id: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      if (newSelection.size < 1) {
        newSelection.add(id);
      } else {
        toast.error('Only 1 email allowed. Deselect the current email first.');
        return;
      }
    }
    setSelectedEmails(newSelection);
  };

  // Export functionality
  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    if (!matchingResult) {
      toast.error('No analysis results to export');
      return;
    }

    try {
      switch (format) {
        case 'csv':
          exportToCSV();
          break;
        case 'pdf':
          exportToPDF();
          break;
        case 'json':
          exportToJSON();
          break;
        default:
          toast.error('Unsupported export format');
      }
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
      console.error('Export error:', error);
    }
  };

  const exportToCSV = () => {
    const csvData = [];
    
    // Header row
    csvData.push([
      'Invoice File',
      'PO File', 
      'Overall Match %',
      'Match Status',
      'Field Name',
      'Field Status',
      'Field Confidence %',
      'Invoice Value',
      'PO Value'
    ]);

    // Data rows
    matchingResult.comparisonMatrix?.forEach((comparison: any) => {
      const baseRow = [
        comparison.invoiceFilename,
        comparison.poFilename,
        comparison.relationshipScore,
        comparison.isLikelyMatch ? 'Likely Match' : 'No Match'
      ];

      if (comparison.comparison?.field_comparison) {
        Object.entries(comparison.comparison.field_comparison).forEach(([fieldKey, fieldData]: [string, any]) => {
          const fieldName = fieldKey.replace(/_/g, ' ').replace(/match$/, '');
          csvData.push([
            ...baseRow,
            fieldName,
            fieldData.status || 'Unknown',
            fieldData.confidence ? Math.round(fieldData.confidence * 100) : 0,
            fieldData.invoice_value || fieldData.invoice || 'N/A',
            fieldData.po_value || fieldData.po || 'N/A'
          ]);
        });
      } else {
        csvData.push([...baseRow, 'No field data', '', '', '', '']);
      }
    });

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };

  const exportToPDF = () => {
    // Create a printable version
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <h1>Document Analysis Report</h1>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
      <h2>Summary</h2>
      <p>Total Comparisons: ${matchingResult.totalComparisons}</p>
      <p>Likely Matches: ${matchingResult.likelyMatches?.length || 0}</p>
      <p>High Confidence Matches: ${matchingResult.summary?.highConfidenceMatches || 0}</p>
      
      <h2>Detailed Results</h2>
      ${matchingResult.comparisonMatrix?.map((comparison: any) => `
        <div style="margin-bottom: 20px; border: 1px solid #ccc; padding: 10px;">
          <h3>${comparison.invoiceFilename} ↔ ${comparison.poFilename}</h3>
          <p>Match Score: ${comparison.relationshipScore}%</p>
          <p>Status: ${comparison.isLikelyMatch ? 'Likely Match' : 'No Match'}</p>
        </div>
      `).join('')}
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Document Analysis Report</title></head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      toast.success('PDF export initiated!');
    }
  };

  const exportToJSON = () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      summary: matchingResult.summary,
      totalComparisons: matchingResult.totalComparisons,
      likelyMatches: matchingResult.likelyMatches?.length || 0,
      results: matchingResult.comparisonMatrix
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully!');
  };

  // Email notification functions
  const handleSingleAction = async (comparison: any, index: number, action: 'approve' | 'reject') => {
    try {
      await sendEmailNotification(comparison, action);
      
      // Update status
      setComparisonStatuses(prev => ({
        ...prev,
        [index]: action === 'approve' ? 'Approved' : 'Rejected'
      }));
      
      toast.success(`${action === 'approve' ? 'Approval' : 'Rejection'} email sent successfully!`);
    } catch (error) {
      toast.error(`Failed to send ${action} email`);
      console.error('Email send error:', error);
    }
  };

  const sendEmailNotification = async (comparison: any, action: 'approve' | 'reject') => {
    if (!gmailTokens) {
      throw new Error('No Gmail tokens available');
    }

    // Get vendor email from original email
    const originalEmail = emails.find(e => selectedEmails.has(e.id));
    const vendorEmail = originalEmail?.from.match(/<(.+)>/)?.[1] || originalEmail?.from || 'vendor@example.com';
    
    // Extract field comparisons for email summary
    const mismatches = comparison.comparison?.field_comparison ? 
      Object.entries(comparison.comparison.field_comparison).filter(([_, fieldData]: [string, any]) => 
        fieldData.status === 'MISMATCH'
      ) : [];
    
    const matches = comparison.comparison?.field_comparison ? 
      Object.entries(comparison.comparison.field_comparison).filter(([_, fieldData]: [string, any]) => 
        fieldData.status === 'MATCH'
      ) : [];

    // Create comprehensive email summary
    const emailBodyHTML = `
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: #f8f9fa; margin: 0; padding: 0; }
          .container { max-width: 650px; margin: 40px auto; background: white; border: 1px solid #dee2e6; }
          .header { padding: 30px 40px; border-bottom: 3px solid #2c3e50; }
          .status-line { font-size: 13px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .title { font-size: 24px; font-weight: 600; color: #2c3e50; margin: 0; }
          .content { padding: 40px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          .info-table td { padding: 12px 0; border-bottom: 1px solid #e9ecef; }
          .info-table td:first-child { font-weight: 600; color: #495057; width: 180px; }
          .info-table td:last-child { color: #2c3e50; }
          .info-table tr:last-child td { border-bottom: none; }
          .section-title { font-size: 16px; font-weight: 600; color: #2c3e50; margin: 30px 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e9ecef; }
          .footer { padding: 25px 40px; background: #f8f9fa; border-top: 1px solid #dee2e6; font-size: 13px; color: #6c757d; }
          .score-badge { display: inline-block; padding: 6px 14px; background: #e9ecef; color: #2c3e50; font-weight: 600; font-size: 14px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="status-line">Document Analysis Report</div>
            <div class="title">Invoice ${action === 'approve' ? 'Approved' : 'Rejected'}</div>
            <div class="score-badge">Match Score: ${comparison.relationshipScore || 0}%</div>
          </div>
          
          <!-- Content -->
          <div class="content">
            <p style="margin: 0 0 25px 0; font-size: 15px; color: #495057;">Dear Vendor,</p>
            
            <p style="margin: 0 0 25px 0; font-size: 15px; color: #495057;">
              Your invoice has been processed through our AI-powered document analysis system and has been 
              <strong>${action === 'approve' ? 'approved' : 'rejected'}</strong> for payment processing.
            </p>
            
            <!-- Document Details Table -->
            <div class="section-title">Document Analysis Summary</div>
            <table class="info-table">
              <tr>
                <td>Invoice Document</td>
                <td>${comparison.invoiceFilename}</td>
              </tr>
              <tr>
                <td>Purchase Order</td>
                <td>${comparison.poFilename}</td>
              </tr>
              <tr>
                <td>Overall Match Score</td>
                <td><strong>${comparison.relationshipScore}%</strong></td>
              </tr>
              <tr>
                <td>Analysis Date</td>
                <td>${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>Total Fields Analyzed</td>
                <td>${matches.length + mismatches.length}</td>
              </tr>
              <tr>
                <td>Fields Matched</td>
                <td style="color: #28a745;"><strong>${matches.length}</strong></td>
              </tr>
              <tr>
                <td>Fields with Discrepancies</td>
                <td style="color: #dc3545;"><strong>${mismatches.length}</strong></td>
              </tr>
            </table>
          
          ${mismatches.length > 0 ? `
          <!-- Mismatched Fields Section -->
          <div class="section-title" style="color: #dc2626; border-color: #dc2626;">Fields That Did Not Match</div>
          <table class="info-table" style="margin-bottom: 25px;">
            <thead>
              <tr style="background: #fef2f2;">
                <th style="padding: 12px 12px; font-weight: 600; color: #6c757d; width: 180px; border-bottom: 2px solid #e9ecef; text-align: left;">Field Name</th>
                <th style="padding: 12px 12px; font-weight: 600; color: #6c757d; border-bottom: 2px solid #e9ecef; text-align: left;">Purchase Order</th>
                <th style="padding: 12px 12px; font-weight: 600; color: #6c757d; border-bottom: 2px solid #e9ecef; text-align: left;">Invoice</th>
              </tr>
            </thead>
            <tbody>
              ${mismatches.map(([fieldKey, fieldData]: [string, any]) => {
                const fieldName = fieldKey.replace(/_/g, ' ').replace(/match$/, '').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                return `
                <tr style="background: #fff5f5;">
                  <td style="padding: 12px 12px; border-bottom: 1px solid #fee2e2; font-weight: 600; color: #dc2626;">${fieldName}</td>
                  <td style="padding: 12px 12px; border-bottom: 1px solid #fee2e2; color: #2c3e50;">${fieldData.po_value || fieldData.po || 'N/A'}</td>
                  <td style="padding: 12px 12px; border-bottom: 1px solid #fee2e2; color: #2c3e50;">${fieldData.invoice_value || fieldData.invoice || 'N/A'}</td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #dc2626; margin: 0; font-weight: 600;">
              ${action === 'reject' ? '⚠️ Please review and resubmit the corrected invoice with matching values.' : '⚠️ Despite discrepancies, this invoice has been approved for processing.'}
            </p>
          </div>
          ` : `
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="color: #059669; margin: 0;">✅ All analyzed fields have been validated successfully.</p>
            ${action === 'approve' ? '<p style="margin: 10px 0 0 0;">The invoice has been approved for payment processing.</p>' : ''}
          </div>
          `}
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Solutions Plus AI Analysis Team</strong></p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">This email was generated by our automated document analysis system. For questions, please contact our support team.</p>
        </div>
      </body>
    </html>
    `;

    // Send email via Gmail API
    const response = await fetch('/api/gmail-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokens: gmailTokens,
        threadId: originalEmail?.threadId,
        messageId: originalEmail?.messageId,
        to: vendorEmail,
        subject: `Invoice ${action === 'approve' ? 'APPROVED' : 'REJECTED'} - ${comparison.invoiceFilename}`,
        body: emailBodyHTML
      })
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to send email');
    }

    return response.json();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Smart Document Analysis
              </h1>
              <p className="text-slate-600 mt-2">AI-powered invoice and purchase order comparison</p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-700 hover:bg-white transition-all shadow-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Connection Stage */}
        {workflowStage === 'connection' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              {connectionStatus === 'connecting' ? (
                <div className="space-y-6">
                  <div className="animate-pulse">
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Connecting to Gmail</h2>
                    <p className="text-slate-600 text-lg">Establishing secure connection...</p>
                  </div>
                  <div className="w-64 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ) : connectionStatus === 'connected' ? (
                <div className="space-y-6">
                  <div className="animate-bounce">
                    <h2 className="text-3xl font-bold text-green-600 mb-4">Connected Successfully!</h2>
                    <p className="text-slate-600 text-lg">Loading your documents...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Connect Your Gmail</h2>
                  <p className="text-slate-600 text-lg mb-8">Securely access your emails to analyze documents</p>
                  <button
                    onClick={handleGmailAuth}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    Connect Gmail
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Selection Stage */}
        {workflowStage === 'email-selection' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Email to Analyze</h2>
                  <p className="text-slate-600">Choose an email with multiple documents for comparison</p>
                  {selectedEmails.size > 0 && (
                    <div className="mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm inline-block">
                      {selectedEmails.size} email selected
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleProcessDocuments} 
                  disabled={selectedEmails.size !== 1}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all ${
                    selectedEmails.size === 1
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-xl transform hover:scale-105'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}>
                  Analyze Documents ({selectedEmails.size})
                </button>
              </div>

              <div className="space-y-4">
                {emails.map((email) => (
                  <div 
                    key={email.id} 
                    className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedEmails.has(email.id)
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                    onClick={() => toggleEmailSelection(email.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedEmails.has(email.id)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-slate-300'
                          }`}>
                            {selectedEmails.has(email.id) && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{email.from}</h3>
                            <p className="text-slate-600 text-sm">{email.date}</p>
                          </div>
                        </div>
                        <p className="text-slate-700 mb-3">{email.subject}</p>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            {email.attachments.length} Documents
                          </div>
                          <div className="text-xs text-slate-500">
                            {email.attachments.map((a: any) => a.filename).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Processing Stage */}
        {workflowStage === 'processing' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl animate-pulse">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Processing Documents</h2>
              <p className="text-slate-600 text-lg mb-8">{processingStep}</p>
              
              {currentFile && (
                <p className="text-sm text-slate-500 mb-6">Current: {currentFile}</p>
              )}
              
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-500"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="text-slate-600">{processingProgress}% Complete</p>
            </div>
          </div>
        )}

        {/* Analysis Stage */}
        {workflowStage === 'analysis' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Document Analysis</h2>
                <p className="text-gray-600">Review extracted documents and data</p>
              </div>

              {/* Side-by-Side Document Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* Invoices Column */}
                {invoiceDocuments.length > 0 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Invoices</h3>
                      <p className="text-sm text-gray-500">{invoiceDocuments.length} document{invoiceDocuments.length !== 1 ? 's' : ''}</p>
                    </div>
                    
                    {invoiceDocuments.map((doc, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg">
                        <div className="p-4 border-b border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">{doc.filename}</h4>
                          
                          {/* Minimal Tab Navigation */}
                          <div className="flex border border-gray-200 rounded-md overflow-hidden">
                            <button
                              onClick={() => setInvoiceActiveTab('preview')}
                              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                                invoiceActiveTab === 'preview'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => setInvoiceActiveTab('json')}
                              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                                invoiceActiveTab === 'json'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              JSON
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          {invoiceActiveTab === 'preview' ? (
                            <div className="space-y-4">
                              {doc.images.map((img) => (
                                <div key={img.pageNumber} className="space-y-2">
                                  <div className="text-xs text-gray-500 font-medium">Page {img.pageNumber}</div>
                                  <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                                    <img
                                      src={img.base64}
                                      alt={`Page ${img.pageNumber}`}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                              <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                                {JSON.stringify(
                                  doc.classificationResponse?.parsedContent || 
                                  doc.classificationResponse || 
                                  { message: 'No data available' }, 
                                  null, 
                                  2
                                )}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Purchase Orders Column */}
                {poDocuments.length > 0 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Purchase Orders</h3>
                      <p className="text-sm text-gray-500">{poDocuments.length} document{poDocuments.length !== 1 ? 's' : ''}</p>
                    </div>
                    
                    {poDocuments.map((doc, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg">
                        <div className="p-4 border-b border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">{doc.filename}</h4>
                          
                          {/* Minimal Tab Navigation */}
                          <div className="flex border border-gray-200 rounded-md overflow-hidden">
                            <button
                              onClick={() => setPOActiveTab('preview')}
                              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                                poActiveTab === 'preview'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => setPOActiveTab('json')}
                              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                                poActiveTab === 'json'
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Data
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          {poActiveTab === 'preview' ? (
                            <div className="space-y-4">
                              {doc.images.map((img) => (
                                <div key={img.pageNumber} className="space-y-2">
                                  <div className="text-xs text-gray-500 font-medium">Page {img.pageNumber}</div>
                                  <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                                    <img
                                      src={img.base64}
                                      alt={`Page ${img.pageNumber}`}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                              <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                                {JSON.stringify(
                                  doc.classificationResponse?.parsedContent || 
                                  doc.classificationResponse || 
                                  { message: 'No data available' }, 
                                  null, 
                                  2
                                )}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Comparison Button */}
              {invoiceDocuments.length > 0 && poDocuments.length > 0 && (
                <div className="text-center pt-6 border-t border-gray-200">
                  <button
                    onClick={handleStartComparison}
                    disabled={isAnalyzing}
                    className="px-8 py-3 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      'Start Comparison'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Stage */}
        {workflowStage === 'results' && matchingResult && (
          <div className="space-y-8">
            {/* Results Header with Export Options */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div className="text-center flex-1">
                  <h2 className="text-3xl font-bold mb-2">Analysis Complete!</h2>
                  <p className="text-indigo-100">Smart comparison results are ready</p>
                </div>
                
                {/* Export Dropdown */}
                <div className="relative">
                  <select 
                    className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleExport(e.target.value as 'csv' | 'pdf' | 'json');
                        e.target.value = ''; // Reset selection
                      }
                    }}
                  >
                    <option value="">Export Report</option>
                    <option value="csv">📊 Export as CSV</option>
                    <option value="pdf">📄 Export as PDF</option>
                    <option value="json">🔧 Export as JSON</option>
                    <option value="api" disabled>🚀 REST API (Coming Soon)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{matchingResult.totalComparisons}</p>
                  <p className="text-sm text-indigo-100">Comparisons</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-300">{matchingResult.likelyMatches?.length || 0}</p>
                  <p className="text-sm text-indigo-100">Likely Matches</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-300">{matchingResult.summary?.highConfidenceMatches || 0}</p>
                  <p className="text-sm text-indigo-100">High Confidence</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{(matchingResult.summary?.totalInvoices || 0) + (matchingResult.summary?.totalPOs || 0)}</p>
                  <p className="text-sm text-indigo-100">Documents</p>
                </div>
              </div>
            </div>

            {/* Comparison Results */}
            <div className="space-y-6">
              {matchingResult.comparisonMatrix?.map((comparison: any, index: number) => (
                <div key={index} className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 shadow-xl p-6 ${
                  comparison.isLikelyMatch 
                    ? 'border-green-300 bg-green-50/50' 
                    : comparison.relationshipScore > 50 
                      ? 'border-yellow-300 bg-yellow-50/50'
                      : 'border-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {comparison.invoiceFilename} ↔ {comparison.poFilename}
                      </h3>
                      <p className="text-slate-600">Document comparison analysis</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                        comparison.relationshipScore > 80
                          ? 'bg-green-500 text-white'
                          : comparison.relationshipScore > 50
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {comparison.relationshipScore}% Match
                      </div>
                      {comparison.isLikelyMatch && (
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          ✓ Likely Match
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comprehensive Field Comparison - All Extracted Fields */}
                  <div className="space-y-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Detailed Field Analysis
                    </h4>
                    
                    {/* Render all available field comparisons */}
                    {comparison.comparison?.field_comparison && Object.keys(comparison.comparison.field_comparison).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(comparison.comparison.field_comparison).map(([fieldKey, fieldData]: [string, any]) => {
                          if (!fieldData || typeof fieldData !== 'object') return null;
                          
                          // Format field name for display
                          const fieldName = fieldKey
                            .replace(/_/g, ' ')
                            .replace(/match$/, '')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                          const getStatusIcon = (status: string) => {
                            if (status === 'MATCH') {
                              return (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              );
                            } else if (status === 'MISMATCH') {
                              return (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              );
                            } else {
                              return <span className="text-white text-xs">?</span>;
                            }
                          };

                          const getStatusColor = (status: string) => {
                            if (status === 'MATCH') return 'bg-green-500';
                            if (status === 'MISMATCH') return 'bg-red-500';
                            return 'bg-yellow-500';
                          };

                          return (
                            <div key={fieldKey} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900 text-sm">{fieldName}</h5>
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${getStatusColor(fieldData.status)}`}>
                                    {getStatusIcon(fieldData.status)}
                                  </div>
                                  {fieldData.confidence && (
                                    <span className="text-xs text-gray-500 font-medium">
                                      {Math.round((fieldData.confidence || 0) * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="bg-gray-50 rounded p-2">
                                  <p className="text-xs text-gray-600 font-medium mb-1">Invoice</p>
                                  <p className="text-sm text-gray-900 break-words">
                                    {fieldData.invoice_value || fieldData.invoice || 'N/A'}
                                  </p>
                                </div>
                                <div className="bg-gray-50 rounded p-2">
                                  <p className="text-xs text-gray-600 font-medium mb-1">Purchase Order</p>
                                  <p className="text-sm text-gray-900 break-words">
                                    {fieldData.po_value || fieldData.po || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              
                              {fieldData.notes && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                  <p className="text-xs text-yellow-800">{fieldData.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600">No detailed field comparison data available</p>
                      </div>
                    )}

                    {/* User-Friendly Complete Data Comparison */}
                    <div className="mt-8">
                      <h5 className="text-md font-medium text-gray-900 mb-4">Complete Data Comparison</h5>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Invoice Data */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h6 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Invoice Data
                          </h6>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {comparison.invoiceData && Object.keys(comparison.invoiceData).length > 0 ? (
                              Object.entries(comparison.invoiceData).map(([key, value]) => {
                                const expandKey = `invoice-${index}-${key}`;
                                const isExpanded = expandedInvoiceData[expandKey];
                                
                                // Format the value for user-friendly display with actual details
                                let displayValue = 'N/A';
                                let hasMore = false;
                                let fullContent = '';
                                
                                if (value !== null && value !== undefined) {
                                  if (typeof value === 'object') {
                                    if (Array.isArray(value)) {
                                      if (value.length > 0) {
                                        if (isExpanded) {
                                          // Show all items when expanded
                                          displayValue = value.map(item => 
                                            typeof item === 'object' ? JSON.stringify(item).substring(0, 100) + '...' : String(item)
                                          ).join(', ');
                                        } else {
                                          // Show first few items with expand option
                                          const preview = value.slice(0, 2).map(item => 
                                            typeof item === 'object' ? JSON.stringify(item).substring(0, 50) + '...' : String(item)
                                          ).join(', ');
                                          hasMore = value.length > 2;
                                          displayValue = hasMore ? preview : value.join(', ');
                                          fullContent = `(+${value.length - 2} more)`;
                                        }
                                      } else {
                                        displayValue = 'Empty list';
                                      }
                                    } else {
                                      // Show key-value pairs from object
                                      const entries = Object.entries(value);
                                      if (entries.length > 0) {
                                        if (isExpanded) {
                                          // Show all entries when expanded
                                          displayValue = entries.map(([k, v]) => 
                                            `${k}: ${typeof v === 'object' ? '[Object]' : String(v)}`
                                          ).join(', ');
                                        } else {
                                          // Show first few entries with expand option
                                          const preview = entries.slice(0, 2).map(([k, v]) => 
                                            `${k}: ${typeof v === 'object' ? '[Object]' : String(v).substring(0, 20)}`
                                          ).join(', ');
                                          hasMore = entries.length > 2;
                                          displayValue = hasMore ? preview : entries.map(([k, v]) => `${k}: ${v}`).join(', ');
                                          fullContent = `(+${entries.length - 2} more)`;
                                        }
                                      } else {
                                        displayValue = 'Empty object';
                                      }
                                    }
                                  } else {
                                    displayValue = String(value);
                                  }
                                }

                                return (
                                  <div key={key} className="py-1 border-b border-gray-200 last:border-b-0">
                                    <div className="flex justify-between items-start">
                                      <span className="text-xs font-medium text-gray-600 capitalize min-w-0 flex-shrink-0 mr-2">
                                        {key.replace(/_/g, ' ')}:
                                      </span>
                                      <div className="text-xs text-gray-900 text-right break-words max-w-xs">
                                        <span>{displayValue}</span>
                                        {hasMore && !isExpanded && (
                                          <button
                                            onClick={() => setExpandedInvoiceData(prev => ({
                                              ...prev,
                                              [expandKey]: true
                                            }))}
                                            className="ml-1 text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                          >
                                            {fullContent}
                                          </button>
                                        )}
                                        {isExpanded && (
                                          <button
                                            onClick={() => setExpandedInvoiceData(prev => ({
                                              ...prev,
                                              [expandKey]: false
                                            }))}
                                            className="ml-1 text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                          >
                                            (show less)
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-gray-500">No invoice data available</p>
                            )}
                          </div>
                        </div>

                        {/* Purchase Order Data */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h6 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            Purchase Order Data
                          </h6>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {comparison.poData && Object.keys(comparison.poData).length > 0 ? (
                              Object.entries(comparison.poData).map(([key, value]) => {
                                const expandKey = `po-${index}-${key}`;
                                const isExpanded = expandedPOData[expandKey];
                                
                                // Format the value for user-friendly display with actual details
                                let displayValue = 'N/A';
                                let hasMore = false;
                                let fullContent = '';
                                
                                if (value !== null && value !== undefined) {
                                  if (typeof value === 'object') {
                                    if (Array.isArray(value)) {
                                      if (value.length > 0) {
                                        if (isExpanded) {
                                          // Show all items when expanded
                                          displayValue = value.map(item => 
                                            typeof item === 'object' ? JSON.stringify(item).substring(0, 100) + '...' : String(item)
                                          ).join(', ');
                                        } else {
                                          // Show first few items with expand option
                                          const preview = value.slice(0, 2).map(item => 
                                            typeof item === 'object' ? JSON.stringify(item).substring(0, 50) + '...' : String(item)
                                          ).join(', ');
                                          hasMore = value.length > 2;
                                          displayValue = hasMore ? preview : value.join(', ');
                                          fullContent = `(+${value.length - 2} more)`;
                                        }
                                      } else {
                                        displayValue = 'Empty list';
                                      }
                                    } else {
                                      // Show key-value pairs from object
                                      const entries = Object.entries(value);
                                      if (entries.length > 0) {
                                        if (isExpanded) {
                                          // Show all entries when expanded
                                          displayValue = entries.map(([k, v]) => 
                                            `${k}: ${typeof v === 'object' ? '[Object]' : String(v)}`
                                          ).join(', ');
                                        } else {
                                          // Show first few entries with expand option
                                          const preview = entries.slice(0, 2).map(([k, v]) => 
                                            `${k}: ${typeof v === 'object' ? '[Object]' : String(v).substring(0, 20)}`
                                          ).join(', ');
                                          hasMore = entries.length > 2;
                                          displayValue = hasMore ? preview : entries.map(([k, v]) => `${k}: ${v}`).join(', ');
                                          fullContent = `(+${entries.length - 2} more)`;
                                        }
                                      } else {
                                        displayValue = 'Empty object';
                                      }
                                    }
                                  } else {
                                    displayValue = String(value);
                                  }
                                }

                                return (
                                  <div key={key} className="py-1 border-b border-gray-200 last:border-b-0">
                                    <div className="flex justify-between items-start">
                                      <span className="text-xs font-medium text-gray-600 capitalize min-w-0 flex-shrink-0 mr-2">
                                        {key.replace(/_/g, ' ')}:
                                      </span>
                                      <div className="text-xs text-gray-900 text-right break-words max-w-xs">
                                        <span>{displayValue}</span>
                                        {hasMore && !isExpanded && (
                                          <button
                                            onClick={() => setExpandedPOData(prev => ({
                                              ...prev,
                                              [expandKey]: true
                                            }))}
                                            className="ml-1 text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                          >
                                            {fullContent}
                                          </button>
                                        )}
                                        {isExpanded && (
                                          <button
                                            onClick={() => setExpandedPOData(prev => ({
                                              ...prev,
                                              [expandKey]: false
                                            }))}
                                            className="ml-1 text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                          >
                                            (show less)
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-gray-500">No purchase order data available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Status and Buttons */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedResults.has(index)} 
                            onChange={() => {
                              const newSelection = new Set(selectedResults);
                              if (newSelection.has(index)) {
                                newSelection.delete(index);
                              } else {
                                newSelection.add(index);
                              }
                              setSelectedResults(newSelection);
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-600">Select for bulk action</span>
                        </div>
                        
                        {comparisonStatuses[index] && (
                          <div className={`px-3 py-1 text-xs font-bold rounded-full ${
                            comparisonStatuses[index] === 'Approved' 
                              ? 'bg-green-100 text-green-700' 
                              : comparisonStatuses[index] === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {comparisonStatuses[index]}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedComparison({ ...comparison, index });
                            setShowActionModal(true);
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                        
                        {!comparisonStatuses[index] || comparisonStatuses[index] === 'Processing' ? (
                          <>
                            <button
                              onClick={() => handleSingleAction(comparison, index, 'reject')}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject & Send Email
                            </button>
                            <button
                              onClick={() => handleSingleAction(comparison, index, 'approve')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve & Send Email
                            </button>
                          </>
                        ) : (
                          <div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg">
                            Action Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-50 p-3 rounded-lg">
                      View Technical Details
                    </summary>
                    <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <pre className="text-xs text-slate-800 overflow-auto max-h-64 whitespace-pre-wrap">
                        {JSON.stringify(comparison.comparison, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setWorkflowStage('analysis')}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                ← Back to Analysis
              </button>
              <button
                onClick={() => {
                  setWorkflowStage('email-selection');
                  setMatchingResult(null);
                  setInvoiceDocuments([]);
                  setPODocuments([]);
                  setSelectedEmails(new Set());
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Analyze New Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
