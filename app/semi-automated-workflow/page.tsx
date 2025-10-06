'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
type WorkflowStage = 'home' | 'connection' | 'extraction' | 'processing' | 'output';
type WorkflowType = 'oracle' | 'email' | null;
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

const MOCK_DATA = [
  { id: '1', vendorName: 'Sea Shell LLC', invoiceId: 'INV-2024-001', poNumber: 'PO-2024-156', invoiceAmount: 15750, poAmount: 15750, invoiceDate: '2024-01-15', poDate: '2024-01-15', invoicePaymentTerms: 'Net 30', poPaymentTerms: 'Net 30', invoiceTaxAmount: 1575, poTaxAmount: 1575, invoiceShippingAddress: 'Dubai Marina, UAE', poShippingAddress: 'Dubai Marina, UAE' },
  { id: '2', vendorName: 'Etisalat', invoiceId: 'INV-2024-002', poNumber: 'PO-2024-157', invoiceAmount: 8450, poAmount: 8450, invoiceDate: '2024-01-18', poDate: '2024-01-18', invoicePaymentTerms: 'Net 30', poPaymentTerms: 'Net 45', invoiceTaxAmount: 845, poTaxAmount: 845, invoiceShippingAddress: 'Sheikh Zayed Road, Dubai', poShippingAddress: 'Sheikh Zayed Road, Dubai' },
  { id: '3', vendorName: 'ADNOC', invoiceId: 'INV-2024-003', poNumber: 'PO-2024-158', invoiceAmount: 23200, poAmount: 23200, invoiceDate: '2024-01-20', poDate: '2024-01-20', invoicePaymentTerms: 'Net 60', poPaymentTerms: 'Net 60', invoiceTaxAmount: 2320, poTaxAmount: 2320, invoiceShippingAddress: 'Corniche Road, Abu Dhabi', poShippingAddress: 'Corniche Road, Abu Dhabi' },
  { id: '4', vendorName: 'MDC Business', invoiceId: 'INV-2024-004', poNumber: 'PO-2024-159', invoiceAmount: 12990, poAmount: 12890, invoiceDate: '2024-01-25', poDate: '2024-01-22', invoicePaymentTerms: 'Net 45', poPaymentTerms: 'Net 30', invoiceTaxAmount: 1299, poTaxAmount: 1289, invoiceShippingAddress: 'Muroor Road, Abu Dhabi', poShippingAddress: 'Muroor Road, Abu Dhabi, UAE' },
];

export default function SemiAutomatedWorkflow() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('home');
  const [workflowType, setWorkflowType] = useState<WorkflowType>(null);
  const [extractedData, setExtractedData] = useState<POInvoicePair[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [processedData, setProcessedData] = useState<POInvoicePair[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedDetail, setSelectedDetail] = useState<POInvoicePair | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [gmailAccessToken, setGmailAccessToken] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<any[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleConnect = () => {
    setConnectionStatus('connecting');
    setProcessingProgress(0);
    const interval = setInterval(() => setProcessingProgress(prev => prev >= 100 ? 100 : prev + 10), 150);
    setTimeout(() => { 
      clearInterval(interval); 
      setConnectionStatus('connected'); 
      setProcessingProgress(0); 
      setTimeout(() => fetchData(), 500); 
    }, 1800);
  };

  const fetchData = () => {
    setWorkflowStage('extraction');
    setExtractedData(MOCK_DATA.map(item => ({ ...item, status: 'pending' as RecordStatus })));
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedRecords);
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
    setSelectedRecords(newSelection);
  };

  const toggleSelectAll = () => setSelectedRecords(selectedRecords.size === extractedData.length ? new Set() : new Set(extractedData.map(d => d.id)));

  const processRecords = () => {
    if (selectedRecords.size === 0) return;
    setIsProcessing(true);
    setProcessingProgress(0);
    setWorkflowStage('processing');
    
    const interval = setInterval(() => setProcessingProgress(prev => prev >= 100 ? 100 : prev + 5), 100);
    
    setTimeout(() => {
      clearInterval(interval);
      const processed = extractedData.filter(r => selectedRecords.has(r.id)).map(record => {
        // Create field comparisons
        const fieldComparisons: FieldComparison[] = [
          {
            field: 'PO Number',
            poValue: record.poNumber,
            invoiceValue: record.poNumber,
            match: true
          },
          {
            field: 'Vendor Name',
            poValue: record.vendorName,
            invoiceValue: record.vendorName,
            match: true
          },
          {
            field: 'Invoice Date',
            poValue: record.poDate,
            invoiceValue: record.invoiceDate,
            match: record.poDate === record.invoiceDate
          },
          {
            field: 'Total Amount',
            poValue: `$${record.poAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            invoiceValue: `$${record.invoiceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            match: Math.abs(record.poAmount - record.invoiceAmount) < 0.01
          },
          {
            field: 'Currency',
            poValue: 'USD',
            invoiceValue: 'USD',
            match: true
          },
          {
            field: 'Payment Terms',
            poValue: record.poPaymentTerms,
            invoiceValue: record.invoicePaymentTerms,
            match: record.poPaymentTerms === record.invoicePaymentTerms
          },
          {
            field: 'Shipping Address',
            poValue: record.poShippingAddress,
            invoiceValue: record.invoiceShippingAddress,
            match: record.poShippingAddress === record.invoiceShippingAddress
          },
          {
            field: 'Tax Amount',
            poValue: `$${record.poTaxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            invoiceValue: `$${record.invoiceTaxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            match: Math.abs(record.poTaxAmount - record.invoiceTaxAmount) < 0.01
          }
        ];

        const matchCount = fieldComparisons.filter(c => c.match).length;
        const matchScore = Math.round((matchCount / fieldComparisons.length) * 100);
        const status: RecordStatus = matchCount === fieldComparisons.length ? 'matched' : 'mismatched';

        return {
          ...record,
          status,
          processedDate: new Date().toISOString().split('T')[0],
          matchScore,
          fieldComparisons,
          actionStatus: 'Processing' as 'Processing' | 'Approved' | 'Rejected'
        };
      });
      
      setProcessedData(processed);
      setIsProcessing(false);
      setProcessingProgress(0);
      setWorkflowStage('output');
    }, 2500);
  };

  const confirmAction = async (action: 'approve' | 'reject') => {
    if (!selectedDetail) return;
    
    // Generate email summary
    const mismatches = selectedDetail.fieldComparisons?.filter(fc => !fc.match) || [];
    const matchedFields = selectedDetail.fieldComparisons?.filter(fc => fc.match) || [];
    
    const emailContent = `
=== EMAIL NOTIFICATION ===
To: ${selectedDetail.vendorName}
Subject: Invoice ${action === 'approve' ? 'APPROVED' : 'REJECTED'} - ${selectedDetail.invoiceId}

Dear ${selectedDetail.vendorName},

Your invoice ${selectedDetail.invoiceId} for PO ${selectedDetail.poNumber} has been ${action === 'approve' ? 'APPROVED' : 'REJECTED'}.

VALIDATION SUMMARY:
- Match Score: ${selectedDetail.matchScore}%
- Status: ${selectedDetail.status === 'matched' ? 'Fully Matched' : 'Discrepancies Found'}
- Total Fields Validated: ${selectedDetail.fieldComparisons?.length}
- Fields Matched: ${matchedFields.length}
- Fields Mismatched: ${mismatches.length}

${mismatches.length > 0 ? `
DISCREPANCIES FOUND:
${mismatches.map((m, i) => `
${i + 1}. ${m.field}:
   - Purchase Order Value: ${m.poValue}
   - Invoice Value: ${m.invoiceValue}
   - Issue: Values do not match
`).join('\n')}

${action === 'reject' ? 'Please review and resubmit the corrected invoice.' : 'Despite discrepancies, this invoice has been approved for processing.'}
` : `
All fields have been validated successfully.
${action === 'approve' ? 'The invoice has been approved for payment processing.' : ''}
`}

MATCHED FIELDS:
${matchedFields.map((m, i) => `${i + 1}. ${m.field}: ✓ Validated`).join('\n')}

Best regards,
Invoice Processing Team
    `;
    
    console.log(emailContent);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update the record's action status
    setProcessedData(prev => prev.map(r => 
      r.id === selectedDetail.id 
        ? { ...r, actionStatus: action === 'approve' ? 'Approved' : 'Rejected' }
        : r
    ));
    
    // Show toast notification
    setToastType('success');
    setToastMessage(`Email ${action === 'approve' ? 'approval' : 'rejection'} notification sent to ${selectedDetail.vendorName}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
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

  const handleGmailConnect = async () => {
    setIsAuthenticating(true);
    try {
      // Get Gmail auth URL
      const response = await fetch('/api/gmail-auth');
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Open auth popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.authUrl,
          'Gmail Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for auth callback
        const checkPopup = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(checkPopup);
              setIsAuthenticating(false);
              
              // Check if token was stored
              const token = localStorage.getItem('gmail_access_token');
              if (token) {
                setGmailAccessToken(token);
                setConnectionStatus('connected');
                showToastMessage('Successfully connected to Gmail!', 'success');
                
                // Start fetching emails
                setTimeout(() => fetchEmails(token), 500);
              } else {
                showToastMessage('Gmail authentication cancelled', 'error');
                setConnectionStatus('disconnected');
              }
            }
          } catch (e) {
            // Ignore cross-origin errors
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error connecting to Gmail:', error);
      showToastMessage('Failed to connect to Gmail', 'error');
      setIsAuthenticating(false);
      setConnectionStatus('disconnected');
    }
  };

  const fetchEmails = async (token: string) => {
    setWorkflowStage('extraction');
    setProcessingProgress(0);
    
    const interval = setInterval(() => 
      setProcessingProgress(prev => prev >= 90 ? 90 : prev + 10), 
      200
    );
    
    try {
      const response = await fetch('/api/email-automation', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      clearInterval(interval);
      setProcessingProgress(100);
      
      if (data.success && data.emails) {
        setEmailData(data.emails);
        
        // Convert email attachments to invoice format
        const invoices: POInvoicePair[] = [];
        data.emails.forEach((email: any, emailIdx: number) => {
          email.processedAttachments?.forEach((attachment: any, attIdx: number) => {
            const invoice: POInvoicePair = {
              id: `email-${emailIdx}-${attIdx}`,
              vendorName: attachment.vendor || email.from.split('<')[0].trim() || 'Unknown Vendor',
              invoiceId: attachment.invoiceNumber || `INV-${Date.now()}-${attIdx}`,
              poNumber: `PO-${new Date().getFullYear()}-${String(emailIdx + attIdx).padStart(3, '0')}`,
              invoiceAmount: attachment.amount || 0,
              poAmount: attachment.amount || 0,
              invoiceDate: attachment.invoiceDate || new Date().toISOString().split('T')[0],
              poDate: attachment.invoiceDate || new Date().toISOString().split('T')[0],
              invoicePaymentTerms: 'Net 30',
              poPaymentTerms: 'Net 30',
              invoiceTaxAmount: (attachment.amount || 0) * 0.05,
              poTaxAmount: (attachment.amount || 0) * 0.05,
              invoiceShippingAddress: 'Extracted from email',
              poShippingAddress: 'Extracted from email',
              status: 'pending'
            };
            invoices.push(invoice);
          });
        });
        
        setExtractedData(invoices);
        showToastMessage(`Successfully extracted ${invoices.length} invoice(s) from ${data.emails.length} email(s)`, 'success');
        
        setTimeout(() => setProcessingProgress(0), 1000);
      } else {
        showToastMessage('No invoices found in emails', 'error');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      clearInterval(interval);
      showToastMessage('Failed to fetch emails', 'error');
      setProcessingProgress(0);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleWorkflowSelection = (type: WorkflowType) => {
    setWorkflowType(type);
    if (type === 'oracle') {
      // Show connection screen and automatically start connecting
      setWorkflowStage('connection');
      // Immediately start the connection process (no button needed)
      setTimeout(() => handleConnect(), 100);
    } else if (type === 'email') {
      // Email automation - Start Gmail connection
      setWorkflowStage('connection');
      setTimeout(() => handleGmailConnect(), 100);
    }
  };

  const handleDone = () => {
    // Reset workflow to initial state (home)
    setWorkflowStage('home');
    setWorkflowType(null);
    setConnectionStatus('disconnected');
    setExtractedData([]);
    setSelectedRecords(new Set());
    setProcessedData([]);
    setSelectedResults(new Set());
    setProcessingProgress(0);
    
    // Show success toast
    setToastType('success');
    setToastMessage('Workflow completed successfully! All records have been processed.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const selectedRecords = processedData.filter(r => selectedResults.has(r.id));
    
    // Generate bulk email notifications
    for (const record of selectedRecords) {
      const mismatches = record.fieldComparisons?.filter(fc => !fc.match) || [];
      const matchedFields = record.fieldComparisons?.filter(fc => fc.match) || [];
      
      const emailContent = `
=== EMAIL NOTIFICATION ===
To: ${record.vendorName}
Subject: Invoice ${action === 'approve' ? 'APPROVED' : 'REJECTED'} - ${record.invoiceId}

Dear ${record.vendorName},

Your invoice ${record.invoiceId} for PO ${record.poNumber} has been ${action === 'approve' ? 'APPROVED' : 'REJECTED'}.

VALIDATION SUMMARY:
- Match Score: ${record.matchScore}%
- Status: ${record.status === 'matched' ? 'Fully Matched' : 'Discrepancies Found'}
- Total Fields Validated: ${record.fieldComparisons?.length}
- Fields Matched: ${matchedFields.length}
- Fields Mismatched: ${mismatches.length}

${mismatches.length > 0 ? `
DISCREPANCIES FOUND:
${mismatches.map((m, i) => `
${i + 1}. ${m.field}:
   - Purchase Order Value: ${m.poValue}
   - Invoice Value: ${m.invoiceValue}
   - Issue: Values do not match
`).join('\n')}

${action === 'reject' ? 'Please review and resubmit the corrected invoice.' : 'Despite discrepancies, this invoice has been approved for processing.'}
` : `
All fields have been validated successfully.
${action === 'approve' ? 'The invoice has been approved for payment processing.' : ''}
`}

MATCHED FIELDS:
${matchedFields.map((m, i) => `${i + 1}. ${m.field}: ✓ Validated`).join('\n')}

Best regards,
Invoice Processing Team
      `;
      
      console.log(emailContent);
    }
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update the records' action status
    setProcessedData(prev => prev.map(r => 
      selectedResults.has(r.id)
        ? { ...r, actionStatus: action === 'approve' ? 'Approved' : 'Rejected' }
        : r
    ));
    
    // Show toast notification
    setToastType('success');
    setToastMessage(`Bulk ${action === 'approve' ? 'approval' : 'rejection'} emails sent to ${selectedResults.size} vendor${selectedResults.size > 1 ? 's' : ''}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Clear selection
    setSelectedResults(new Set());
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-8 right-8 z-50 animate-slideDown">
            <div className={`${
              toastType === 'success' 
                ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                : 'bg-gradient-to-r from-red-500 to-rose-500'
            } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3`}>
              {toastType === 'success' ? (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Semi-Automated Workflow</h1>
          <p className="text-slate-600 mt-1">Choose your automation workflow to get started</p>
        </div>

        {/* Home - Workflow Selection */}
        {workflowStage === 'home' && (
          <div className="max-w-5xl mx-auto mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Oracle Fusion ERP Card */}
              <div 
                onClick={() => handleWorkflowSelection('oracle')}
                className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 text-center mb-3">Oracle Fusion ERP</h3>
                <p className="text-slate-600 text-center mb-6">
                  Connect to Oracle Fusion ERP to extract and validate Purchase Orders against Invoices with AI-powered matching
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Automated data extraction from Oracle ERP</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI-powered PO & Invoice matching</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Bulk approval/rejection with email notifications</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Detailed validation reports</span>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                    Start Oracle Workflow
                  </button>
                </div>
              </div>

              {/* Email Semi-Automation Card */}
              <div 
                onClick={() => handleWorkflowSelection('email')}
                className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-emerald-500 relative overflow-hidden"
              >
                {/* Coming Soon Badge */}
                {/* <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Coming Soon
                </div> */}
                
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 text-center mb-3">Email Semi-Automation</h3>
                <p className="text-slate-600 text-center mb-6">
                  Automatically process invoices from emails with intelligent extraction and validation workflows
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Auto-fetch invoices from email</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Intelligent data extraction</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Automated vendor notifications</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Seamless ERP integration</span>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <button className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg">
                    Start Email Workflow
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Stage */}
        {workflowStage === 'connection' && (
          <div className="max-w-3xl mx-auto mt-20">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg ${
                workflowType === 'email' 
                  ? 'bg-gradient-to-br from-emerald-600 to-green-600' 
                  : 'bg-gradient-to-br from-blue-600 to-purple-600'
              }`}>
                {workflowType === 'email' ? (
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                {workflowType === 'email' ? 'Connect to Gmail' : 'Connect to Oracle Fusion ERP'}
              </h2>
              <p className="text-slate-600 mb-8">
                {workflowType === 'email' 
                  ? 'Authenticate with Gmail to fetch invoices from forwarded emails' 
                  : 'Establish secure connection to extract vendor PO and invoice data'}
              </p>
            </div>

            {connectionStatus === 'disconnected' && (
              <button 
                onClick={workflowType === 'email' ? handleGmailConnect : handleConnect} 
                className={`w-full py-4 rounded-xl text-lg font-semibold text-white transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  workflowType === 'email'
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600'
                }`}>
                {workflowType === 'email' ? 'Connect to Gmail' : 'Connect to Oracle Fusion ERP'}
              </button>
            )}

            {(connectionStatus === 'connecting' || isAuthenticating) && (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${
                    workflowType === 'email' ? 'border-emerald-600' : 'border-blue-600'
                  }`}></div>
                </div>
                <p className="text-center text-slate-900 font-medium mb-4">
                  {workflowType === 'email' ? 'Connecting to Gmail...' : 'Connecting to Oracle Fusion ERP...'}
                </p>
                {connectionStatus === 'connecting' && (
                  <>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        workflowType === 'email'
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600'
                      }`} style={{ width: `${processingProgress}%` }} />
                    </div>
                    <p className="text-center text-slate-600 mt-2 text-sm">{processingProgress}% Complete</p>
                  </>
                )}
                {isAuthenticating && (
                  <p className="text-center text-slate-600 text-sm mt-4">Please complete authentication in the popup window...</p>
                )}
              </div>
            )}

            {connectionStatus === 'connected' && !isAuthenticating && (
              <div className={`bg-white rounded-xl shadow-lg border p-8 animate-pulse ${
                workflowType === 'email' ? 'border-emerald-200' : 'border-green-200'
              }`}>
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    workflowType === 'email' ? 'bg-emerald-100' : 'bg-green-100'
                  }`}>
                    <svg className={`w-8 h-8 ${
                      workflowType === 'email' ? 'text-emerald-600' : 'text-green-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className={`text-center font-semibold text-lg ${
                  workflowType === 'email' ? 'text-emerald-600' : 'text-green-600'
                }`}>Successfully Connected!</p>
                <p className="text-center text-slate-600 mt-2">
                  {workflowType === 'email' ? 'Fetching emails...' : 'Fetching vendor data...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Extraction Stage */}
        {workflowStage === 'extraction' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Extracted PO & Invoice Pairs</h2>
                <p className="text-slate-600">Select records to process with AI matching engine</p>
              </div>
              <button onClick={processRecords} disabled={selectedRecords.size === 0}
                className="px-6 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                Process Selected ({selectedRecords.size})
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" checked={selectedRecords.size === extractedData.length && extractedData.length > 0} onChange={toggleSelectAll} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {extractedData.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" checked={selectedRecords.has(record.id)} onChange={() => toggleSelection(record.id)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{record.vendorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{record.invoiceId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{record.poNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">${record.invoiceAmount.toLocaleString()}</td>
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
              <p className="text-center text-slate-600 text-sm">{processingProgress}% Complete</p>
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

            {/* Bulk Action Buttons */}
            {selectedResults.size > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    {selectedResults.size} record{selectedResults.size > 1 ? 's' : ''} selected
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleBulkAction('reject')}
                      className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg font-medium flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reject Selected</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction('approve')}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Approve Selected</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Done Button - Shows when all records are processed */}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{record.vendorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{record.invoiceId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{record.poNumber}</td>
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

        {/* Comparison Modal - Matching Integration Page Design */}
        {showDetailModal && selectedDetail && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-6 text-white border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Document Validation Report</h3>
                    <p className="text-slate-300 mt-1 font-medium">Invoice {selectedDetail.invoiceId} • Purchase Order {selectedDetail.poNumber}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Score Badge */}
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

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                <div className="space-y-4">
                  {selectedDetail.fieldComparisons?.map((comparison, idx) => (
                    <div 
                      key={idx}
                      className={`rounded-2xl p-6 transition-all shadow-md hover:shadow-lg ${
                        comparison.match 
                          ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200' 
                          : 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200'
                      }`}
                    >
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
                        {/* Purchase Order Value */}
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

                        {/* Invoice Value */}
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

                      {/* Mismatch Warning */}
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

              {/* Modal Footer */}
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
