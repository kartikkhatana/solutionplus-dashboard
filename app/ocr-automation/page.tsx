'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import ModeSelectionCard from '../components/ocr/ModeSelectionCard';
import ManualUpload from '../components/ocr/ManualUpload';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type WorkflowStage = 'home' | 'connection' | 'extraction' | 'processing' | 'output';
type RecordStatus = 'pending' | 'matched' | 'mismatched';

interface FieldComparison {
  field: string;
  poValue: string;
  invoiceValue: string;
  match: boolean;
}

interface POInvoicePair {
  id: string;
  vendorName: string;
  invoiceId: string;
  poNumber: string;
  invoiceAmount: number;
  poAmount: number;
  invoiceDate: string;
  poDate: string;
  invoicePaymentTerms: string;
  poPaymentTerms: string;
  invoiceTaxAmount: number;
  poTaxAmount: number;
  invoiceShippingAddress: string;
  poShippingAddress: string;
  status: RecordStatus;
  processedDate?: string;
  matchScore?: number;
  fieldComparisons?: FieldComparison[];
  actionStatus?: 'Processing' | 'Approved' | 'Rejected';
}

export default function OCRAutomationPage() {
  const [selectedMode, setSelectedMode] = useState<'email' | 'manual' | null>(null);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

  // Email workflow states
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('home');
  const [gmailTokens, setGmailTokens] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [processedData, setProcessedData] = useState<POInvoicePair[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedDetail, setSelectedDetail] = useState<POInvoicePair | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

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
    setWorkflowStage('connection');
    setTimeout(() => handleGmailAuth(), 100);
  };

  const handleManualMode = () => {
    setSelectedMode('manual');
  };

  const handleBack = () => {
    setSelectedMode(null);
    setWorkflowStage('home');
    setConnectionStatus('disconnected');
    setEmails([]);
    setSelectedEmails(new Set());
    setProcessedData([]);
    setSelectedResults(new Set());
  };

  // Gmail authentication
  const handleGmailAuth = async () => {
    setIsAuthenticating(true);
    setConnectionStatus('connecting');
    setProcessingProgress(0);
    
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
          setProcessingProgress(100);
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
          setProcessingProgress(0);
          setWorkflowStage('home');
          setSelectedMode(null);
          
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
            setProcessingProgress(0);
            setWorkflowStage('home');
            setSelectedMode(null);
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
        setWorkflowStage('home');
        setSelectedMode(null);
      }
      
      setIsAuthenticating(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch emails');
      setIsAuthenticating(false);
      setWorkflowStage('home');
      setSelectedMode(null);
    }
  };

  const processEmailPDFs = async () => {
    if (selectedEmails.size === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setWorkflowStage('processing');
    
    try {
      const selectedEmailsList = emails.filter(e => selectedEmails.has(e.id));
      const matched: POInvoicePair[] = [];
      let progress = 0;
      
      for (const email of selectedEmailsList) {
        for (const attachment of email.attachments) {
          if (attachment.filename.toLowerCase().endsWith('.pdf')) {
            try {
              setProcessingProgress(Math.min(progress, 30));
              
              const invoiceResponse = await fetch(`/api/mongodb/invoice-mock-data?fileName=${encodeURIComponent(attachment.filename)}`);
              const invoiceData = await invoiceResponse.json();
              
              if (!invoiceData.success || !invoiceData.invoices || invoiceData.invoices.length === 0) {
                console.error(`No invoice mock data found for ${attachment.filename}`);
                continue;
              }
              
              const invoiceFromDB = invoiceData.invoices[0];
              
              setProcessingProgress(Math.min(progress + 20, 60));
              
              const poResponse = await fetch(`/api/mongodb/purchase-orders?fileName=${encodeURIComponent(attachment.filename)}`);
              const poData = await poResponse.json();
              
              if (poData.success && poData.purchaseOrders && poData.purchaseOrders.length > 0) {
                const matchingPO = poData.purchaseOrders[0];
                
                setProcessingProgress(Math.min(progress + 30, 80));
                
                const fieldComparisons: FieldComparison[] = [
                  {
                    field: 'PO Number',
                    poValue: matchingPO.poNumber || 'N/A',
                    invoiceValue: invoiceFromDB.poNumber || 'N/A',
                    match: matchingPO.poNumber === invoiceFromDB.poNumber
                  },
                  {
                    field: 'Vendor Name',
                    poValue: matchingPO.vendorName || 'N/A',
                    invoiceValue: invoiceFromDB.vendorName || 'N/A',
                    match: matchingPO.vendorName?.toLowerCase() === invoiceFromDB.vendorName?.toLowerCase()
                  },
                  {
                    field: 'Date',
                    poValue: matchingPO.date || 'N/A',
                    invoiceValue: invoiceFromDB.date || 'N/A',
                    match: matchingPO.date === invoiceFromDB.date
                  },
                  {
                    field: 'Total Amount',
                    poValue: `${matchingPO.currency || 'AED'} ${(matchingPO.totalAmount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`,
                    invoiceValue: `${invoiceFromDB.currency || 'AED'} ${(invoiceFromDB.totalAmount || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`,
                    match: Math.abs((matchingPO.totalAmount || 0) - (invoiceFromDB.totalAmount || 0)) < 0.01
                  },
                  {
                    field: 'Currency',
                    poValue: matchingPO.currency || 'AED',
                    invoiceValue: invoiceFromDB.currency || 'AED',
                    match: (matchingPO.currency || 'AED') === (invoiceFromDB.currency || 'AED')
                  },
                  {
                    field: 'Description of Items',
                    poValue: matchingPO.descriptionOfItems || 'N/A',
                    invoiceValue: invoiceFromDB.descriptionOfItems || 'N/A',
                    match: matchingPO.descriptionOfItems === invoiceFromDB.descriptionOfItems
                  },
                  {
                    field: 'Quantity',
                    poValue: String(matchingPO.quantity || 0),
                    invoiceValue: String(invoiceFromDB.quantity || 0),
                    match: matchingPO.quantity === invoiceFromDB.quantity
                  }
                ];
                
                const matchCount = fieldComparisons.filter(c => c.match).length;
                const matchScore = Math.round((matchCount / fieldComparisons.length) * 100);
                const status: RecordStatus = matchCount === fieldComparisons.length ? 'matched' : 'mismatched';
                
                matched.push({
                  id: `${email.id}-${attachment.filename}`,
                  vendorName: invoiceFromDB.vendorName,
                  invoiceId: `INV-${attachment.filename.replace('.pdf', '')}`,
                  poNumber: matchingPO.poNumber || 'N/A',
                  invoiceAmount: invoiceFromDB.totalAmount,
                  poAmount: matchingPO.totalAmount || 0,
                  invoiceDate: invoiceFromDB.date,
                  poDate: matchingPO.date || '',
                  invoicePaymentTerms: matchingPO.paymentTerms || 'N/A',
                  poPaymentTerms: matchingPO.paymentTerms || 'N/A',
                  invoiceTaxAmount: matchingPO.taxAmount || 0,
                  poTaxAmount: matchingPO.taxAmount || 0,
                  invoiceShippingAddress: matchingPO.shippingAddress || 'N/A',
                  poShippingAddress: matchingPO.shippingAddress || 'N/A',
                  status,
                  processedDate: new Date().toISOString().split('T')[0],
                  matchScore,
                  fieldComparisons,
                  actionStatus: 'Processing' as 'Processing' | 'Approved' | 'Rejected',
                  emailThreadId: email.threadId,
                  emailMessageId: email.messageId,
                  emailOriginalSubject: email.subject,
                  vendorEmail: email.from.match(/<(.+)>/)?.[1] || email.from,
                  fileName: attachment.filename
                } as any);
              }
              
              progress += (80 / (selectedEmailsList.length * email.attachments.length));
            } catch (error) {
              console.error(`Error processing ${attachment.filename}:`, error);
            }
          }
        }
      }
      
      setProcessingProgress(100);
      
      if (matched.length === 0) {
        toast.error('No matching POs found in MongoDB for the selected emails.');
        setIsProcessing(false);
        setWorkflowStage('extraction');
      } else {
        setProcessedData(matched);
        toast.success(`Successfully matched ${matched.length} invoice${matched.length > 1 ? 's' : ''} with POs from MongoDB`);
        setIsProcessing(false);
        setProcessingProgress(0);
        setWorkflowStage('output');
      }
      
    } catch (error) {
      console.error('Error processing PDFs:', error);
      setIsProcessing(false);
      setProcessingProgress(0);
      toast.error('Failed to process PDFs. Please try again.');
      setWorkflowStage('extraction');
    }
  };

  const toggleEmailSelection = (id: string) => {
    const newSelection = new Set(selectedEmails);
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
    setSelectedEmails(newSelection);
  };

  const toggleSelectAllEmails = () => {
    setSelectedEmails(selectedEmails.size === emails.length ? new Set() : new Set(emails.map(e => e.id)));
  };

  const confirmAction = async (action: 'approve' | 'reject') => {
    if (!selectedDetail) return;
    
    const mismatches = selectedDetail.fieldComparisons?.filter(fc => !fc.match) || [];
    
    const poNumberComp = selectedDetail.fieldComparisons?.find(f => f.field === 'PO Number');
    const vendorNameComp = selectedDetail.fieldComparisons?.find(f => f.field === 'Vendor Name');
    const dateComp = selectedDetail.fieldComparisons?.find(f => f.field === 'Date' || f.field === 'Invoice Date');
    const amountComp = selectedDetail.fieldComparisons?.find(f => f.field === 'Total Amount');
    const currencyComp = selectedDetail.fieldComparisons?.find(f => f.field === 'Currency');
    const descriptionComp = selectedDetail.fieldComparisons?.find(f => f.field === 'Description of Items');
    const quantityComp = selectedDetail.fieldComparisons?.find(f => f.field === 'Quantity');
    
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
          .score-badge { display: inline-block; padding: 6px 14px; background: #e9ecef; color: #2c3e50; font-weight: 600; font-size: 14px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="status-line">Invoice Validation Report</div>
            <div class="title">Invoice ${action === 'approve' ? 'Approved' : 'Rejected'}</div>
            <div class="score-badge">Match Score: ${selectedDetail.matchScore || 0}%</div>
          </div>
          
          <div class="content">
            <p style="margin: 0 0 25px 0; font-size: 15px; color: #495057;">Dear ${selectedDetail.vendorName},</p>
            
            <p style="margin: 0 0 25px 0; font-size: 15px; color: #495057;">
              Your invoice has been processed through our automated validation system and has been 
              <strong>${action === 'approve' ? 'approved' : 'rejected'}</strong> for payment processing.
            </p>
            
            <div class="section-title">Invoice Details</div>
            <table class="info-table">
              <tr>
                <td>PO Number</td>
                <td>${poNumberComp?.invoiceValue || selectedDetail.poNumber}</td>
              </tr>
              <tr>
                <td>Vendor Name</td>
                <td>${vendorNameComp?.invoiceValue || selectedDetail.vendorName}</td>
              </tr>
              <tr>
                <td>Date</td>
                <td>${dateComp?.invoiceValue || selectedDetail.invoiceDate}</td>
              </tr>
              <tr>
                <td>Total Amount</td>
                <td><strong>${amountComp?.invoiceValue || `$${selectedDetail.invoiceAmount.toLocaleString()}`}</strong></td>
              </tr>
              <tr>
                <td>Currency</td>
                <td>${currencyComp?.invoiceValue || 'USD'}</td>
              </tr>
              <tr>
                <td>Description of Items</td>
                <td>${descriptionComp?.invoiceValue || 'N/A'}</td>
              </tr>
              <tr>
                <td>Quantity</td>
                <td>${quantityComp?.invoiceValue || 'N/A'}</td>
              </tr>
            </table>
          
          ${mismatches.length > 0 ? `
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
              ${mismatches.map(m => `
              <tr style="background: #fff5f5;">
                <td style="padding: 12px 12px; border-bottom: 1px solid #fee2e2; font-weight: 600; color: #dc2626;">${m.field}</td>
                <td style="padding: 12px 12px; border-bottom: 1px solid #fee2e2; color: #2c3e50;">${m.poValue}</td>
                <td style="padding: 12px 12px; border-bottom: 1px solid #fee2e2; color: #2c3e50;">${m.invoiceValue}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #dc2626; margin: 0; font-weight: 600;">
              ${action === 'reject' ? '⚠️ Please review and resubmit the corrected invoice with matching values.' : '⚠️ Despite discrepancies, this invoice has been approved for processing.'}
            </p>
          </div>
          ` : `
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="color: #059669; margin: 0;">✅ All fields have been validated successfully.</p>
            ${action === 'approve' ? '<p style="margin: 10px 0 0 0;">The invoice has been approved for payment processing.</p>' : ''}
          </div>
          `}
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Solutions Plus Team</strong></p>
        </div>
      </body>
    </html>
    `;
    
    if (gmailTokens) {
      try {
        const originalSubject = (selectedDetail as any).emailOriginalSubject;
        const emailSubject = originalSubject || `Invoice ${action === 'approve' ? 'APPROVED' : 'REJECTED'} - ${selectedDetail.invoiceId}`;
        
        const response = await fetch('/api/gmail-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: gmailTokens,
            threadId: (selectedDetail as any).emailThreadId,
            messageId: (selectedDetail as any).emailMessageId,
            to: (selectedDetail as any).vendorEmail || selectedDetail.vendorName,
            subject: emailSubject,
            body: emailBodyHTML
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to send email');
        }
      } catch (error) {
        toast.error(`Failed to send email: ${(error as Error).message}`);
        return;
      }
    }
    
    setProcessedData(prev => prev.map(r => 
      r.id === selectedDetail.id 
        ? { ...r, actionStatus: action === 'approve' ? 'Approved' : 'Rejected' }
        : r
    ));
    
    toast.success(`Email ${action === 'approve' ? 'approval' : 'rejection'} notification sent to ${selectedDetail.vendorName}`);
    setShowDetailModal(false);
  };

  const getStatusColor = (status: RecordStatus) => {
    const colors = {
      matched: 'bg-green-100 text-green-700',
      mismatched: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.pending;
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedDetail(null);
  };

  const toggleResultSelection = (id: string) => {
    const newSelection = new Set(selectedResults);
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
    setSelectedResults(newSelection);
  };

  const allRecordsProcessed = processedData.length > 0 && processedData.every(r => r.actionStatus === 'Approved' || r.actionStatus === 'Rejected');

  const handleDone = () => {
    setSelectedMode(null);
    setWorkflowStage('home');
    setConnectionStatus('disconnected');
    setEmails([]);
    setSelectedEmails(new Set());
    setProcessedData([]);
    setSelectedResults(new Set());
    setProcessingProgress(0);
    toast.success('Workflow completed successfully!');
  };

  // If Manual mode is selected, show Manual Upload
  if (selectedMode === 'manual') {
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

  // Email workflow
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Toaster position="top-right" />
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Automation via OCR</h1>
          <p className="text-slate-600 mt-1">Choose your document processing method</p>
        </div>

        {/* Home - Mode Selection */}
        {workflowStage === 'home' && (
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
        )}

        {/* Connection Stage */}
        {workflowStage === 'connection' && selectedMode === 'email' && (
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
                  <div className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-600 to-green-600" style={{ width: `${processingProgress}%` }} />
                </div>
                <p className="text-center text-slate-600 mt-2 text-sm">{processingProgress.toFixed(2)}% Complete</p>
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
        {workflowStage === 'extraction' && selectedMode === 'email' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Emails with PDF Attachments</h2>
                <p className="text-slate-600">Select emails to process PO and Invoice documents</p>
              </div>
              <button onClick={processEmailPDFs} disabled={selectedEmails.size === 0}
                className="px-6 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-600 hover:from-emerald-700 hover:to-green-700 shadow-lg">
                Process Selected ({selectedEmails.size})
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" checked={selectedEmails.size === emails.length && emails.length > 0} onChange={toggleSelectAllEmails} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
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
                      <input type="checkbox" checked={selectedEmails.has(email.id)} onChange={() => toggleEmailSelection(email.id)} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
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

        {/* Processing Stage */}
        {workflowStage === 'processing' && isProcessing && (
          <div className="max-w-3xl mx-auto mt-20">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">AI-Powered Processing</h3>
              <p className="text-center text-slate-600 mb-6">Processing selected records with AI matching engine...</p>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: `${processingProgress}%` }} />
              </div>
              <p className="text-center text-slate-600 text-sm">{processingProgress.toFixed(2)}% Complete</p>
            </div>
          </div>
        )}

        {/* Output Layer */}
        {workflowStage === 'output' && !isProcessing && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Processing Results</h2>
              <p className="text-slate-600 mt-1">Review matched and mismatched records</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <p className="text-sm opacity-90 mb-2">Success Rate</p>
                <p className="text-4xl font-bold">
                  {processedData.length > 0 ? Math.round((processedData.filter(r => r.status === 'matched').length / processedData.length) * 100) : 0}%
                </p>
                <p className="text-sm opacity-90 mt-2">
                  {processedData.filter(r => r.status === 'matched').length} of {processedData.length} matched
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <p className="text-sm opacity-90 mb-2">Total Amount</p>
                <p className="text-4xl font-bold">
                  ${(processedData.reduce((sum, r) => sum + r.invoiceAmount, 0) / 1000).toFixed(1)}K
                </p>
                <p className="text-sm opacity-90 mt-2">Validated</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <p className="text-sm opacity-90 mb-2">Avg Score</p>
                <p className="text-4xl font-bold">
                  {processedData.length > 0 ? Math.round(processedData.reduce((sum, r) => sum + (r.matchScore || 0), 0) / processedData.length) : 0}%
                </p>
                <p className="text-sm opacity-90 mt-2">Match confidence</p>
              </div>
            </div>

            {/* Done Button */}
            {allRecordsProcessed && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-900">All Records Processed!</h3>
                      <p className="text-sm text-green-700">All invoices have been reviewed and actioned. Click Done to return to the start.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDone}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-bold text-lg flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input 
                        type="checkbox" 
                        checked={
                          processedData.filter(r => r.actionStatus === 'Processing').length > 0 &&
                          selectedResults.size === processedData.filter(r => r.actionStatus === 'Processing').length
                        } 
                        onChange={() => {
                          const processingRecords = processedData.filter(r => r.actionStatus === 'Processing');
                          if (selectedResults.size === processingRecords.length) {
                            setSelectedResults(new Set());
                          } else {
                            setSelectedResults(new Set(processingRecords.map(d => d.id)));
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">PO Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Match Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {processedData.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      {record.actionStatus === 'Processing' ? (
                        <input 
                          type="checkbox" 
                          checked={selectedResults.has(record.id)} 
                          onChange={() => toggleResultSelection(record.id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 break-words max-w-xs">{record.vendorName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 break-words max-w-xs">{record.invoiceId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 break-words max-w-xs">{record.poNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${record.status === 'matched' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {record.matchScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {record.status === 'matched' ? 'Matched' : 'Review Required'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        record.actionStatus === 'Approved' 
                          ? 'bg-green-100 text-green-700' 
                          : record.actionStatus === 'Rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {record.actionStatus || 'Processing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => { setSelectedDetail(record); setShowDetailModal(true); }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg">
                        View Details
                      </button>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedDetail && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-6 text-white border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Document Validation Report</h3>
                    <p className="text-slate-300 mt-1 font-medium">Invoice {selectedDetail.invoiceId} • Purchase Order {selectedDetail.poNumber}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`px-6 py-2 rounded-xl font-bold text-base shadow-lg ${
                      selectedDetail.status === 'matched' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      Match Score: {selectedDetail.matchScore}%
                    </div>
                    <div className="bg-slate-600 px-4 py-2 rounded-xl text-sm font-medium">
                      Vendor: {selectedDetail.vendorName}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    {selectedDetail.fieldComparisons?.filter(f => f.match).length} / {selectedDetail.fieldComparisons?.length} fields validated
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                <div className="space-y-4">
                  {selectedDetail.fieldComparisons?.map((comparison, idx) => (
                    <div 
                      key={idx}
                      className={`rounded-2xl p-6 transition-all shadow-md hover:shadow-lg ${
                        comparison.match 
                          ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200' 
                          : 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200'
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-900 text-base">{comparison.field}</h4>
                        <div className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                          comparison.match 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {comparison.match ? '✓ VALIDATED' : '✗ MISMATCH'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-5">
                        <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm">
                          <p className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center tracking-wide">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Purchase Order
                          </p>
                          <p className={`text-base font-bold ${
                            comparison.match ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {comparison.poValue}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm">
                          <p className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center tracking-wide">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Invoice
                          </p>
                          <p className={`text-base font-bold ${
                            comparison.match ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {comparison.invoiceValue}
                          </p>
                        </div>
                      </div>

                      {!comparison.match && (
                        <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 rounded-r-lg">
                          <p className="text-sm text-red-900 font-medium flex items-center">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Manual review required - Data discrepancy detected
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-6 pb-8 border-t-2 border-slate-200 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-6">
                  <div className="text-sm">
                    <span className="font-bold text-emerald-600 text-lg">
                      {selectedDetail.fieldComparisons?.filter(f => f.match).length}
                    </span>
                    <span className="text-slate-600 ml-1">/ {selectedDetail.fieldComparisons?.length} fields validated</span>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    selectedDetail.status === 'matched'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}>
                    {selectedDetail.status === 'matched' ? 'Validation Passed' : 'Review Required'}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => confirmAction('reject')}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Reject & Send Email</span>
                  </button>
                  <button 
                    onClick={() => confirmAction('approve')}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Approve & Send Email</span>
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-md">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
