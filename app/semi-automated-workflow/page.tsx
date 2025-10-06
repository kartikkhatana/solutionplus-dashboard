'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'requires-input';
  description: string;
  automationLevel: 'automated' | 'manual';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  date: string;
  status: 'pending-review' | 'in-process' | 'approved' | 'rejected';
  steps: WorkflowStep[];
}

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-12345',
    vendor: 'ABC Supplies Ltd.',
    amount: 5425.50,
    date: '2025-10-05',
    status: 'pending-review',
    steps: [
      {
        id: 'step-1',
        name: 'Document Receipt',
        status: 'completed',
        description: 'Invoice received via email',
        automationLevel: 'automated'
      },
      {
        id: 'step-2',
        name: 'Data Extraction',
        status: 'completed',
        description: 'Extract invoice details from PDF',
        automationLevel: 'automated'
      },
      {
        id: 'step-3',
        name: 'Vendor Verification',
        status: 'requires-input',
        description: 'Verify vendor details and PO match',
        automationLevel: 'manual'
      },
      {
        id: 'step-4',
        name: 'Amount Validation',
        status: 'pending',
        description: 'Validate invoice amount against PO',
        automationLevel: 'manual'
      },
      {
        id: 'step-5',
        name: 'Approval',
        status: 'pending',
        description: 'Awaiting manager approval',
        automationLevel: 'manual'
      },
      {
        id: 'step-6',
        name: 'Payment Processing',
        status: 'pending',
        description: 'Process payment to vendor',
        automationLevel: 'automated'
      }
    ]
  },
  {
    id: 'inv-002',
    invoiceNumber: 'TS-OCT-2025',
    vendor: 'Tech Services Inc.',
    amount: 3749.94,
    date: '2025-10-04',
    status: 'in-process',
    steps: [
      {
        id: 'step-1',
        name: 'Document Receipt',
        status: 'completed',
        description: 'Invoice received via email',
        automationLevel: 'automated'
      },
      {
        id: 'step-2',
        name: 'Data Extraction',
        status: 'completed',
        description: 'Extract invoice details from Excel',
        automationLevel: 'automated'
      },
      {
        id: 'step-3',
        name: 'Vendor Verification',
        status: 'completed',
        description: 'Vendor verified successfully',
        automationLevel: 'manual'
      },
      {
        id: 'step-4',
        name: 'Amount Validation',
        status: 'in-progress',
        description: 'Validating line items',
        automationLevel: 'manual'
      },
      {
        id: 'step-5',
        name: 'Approval',
        status: 'pending',
        description: 'Awaiting manager approval',
        automationLevel: 'manual'
      },
      {
        id: 'step-6',
        name: 'Payment Processing',
        status: 'pending',
        description: 'Process payment to vendor',
        automationLevel: 'automated'
      }
    ]
  },
  {
    id: 'inv-003',
    invoiceNumber: 'PO-9876',
    vendor: 'Global Vendors Corp.',
    amount: 12750.00,
    date: '2025-10-03',
    status: 'approved',
    steps: [
      {
        id: 'step-1',
        name: 'Document Receipt',
        status: 'completed',
        description: 'Invoice received via email',
        automationLevel: 'automated'
      },
      {
        id: 'step-2',
        name: 'Data Extraction',
        status: 'completed',
        description: 'Extract invoice details from PDF',
        automationLevel: 'automated'
      },
      {
        id: 'step-3',
        name: 'Vendor Verification',
        status: 'completed',
        description: 'Vendor verified successfully',
        automationLevel: 'manual'
      },
      {
        id: 'step-4',
        name: 'Amount Validation',
        status: 'completed',
        description: 'Amount validated against PO',
        automationLevel: 'manual'
      },
      {
        id: 'step-5',
        name: 'Approval',
        status: 'completed',
        description: 'Approved by manager',
        automationLevel: 'manual'
      },
      {
        id: 'step-6',
        name: 'Payment Processing',
        status: 'in-progress',
        description: 'Processing payment',
        automationLevel: 'automated'
      }
    ]
  }
];

export default function SemiAutomatedWorkflow() {
  const [invoices, setInvoices] = useState<Invoice[]>(SAMPLE_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'in-progress':
        return 'text-blue-400 bg-blue-500/20';
      case 'requires-input':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'pending':
        return 'text-gray-400 bg-gray-500/20';
      case 'approved':
        return 'text-green-400 bg-green-500/20';
      case 'pending-review':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const handleStepAction = (invoiceId: string, stepId: string) => {
    setActiveStep(stepId);
    // Simulate processing
    setTimeout(() => {
<<<<<<< Updated upstream
      setInvoices(prev => prev.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            steps: inv.steps.map(step => {
              if (step.id === stepId && step.status === 'requires-input') {
                return { ...step, status: 'completed' as const };
              }
              return step;
            })
          };
=======
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
    
    // Get field comparison values
    const poNumberComp = selectedDetail.fieldComparisons?.find(fc => fc.field === 'PO Number');
    const vendorNameComp = selectedDetail.fieldComparisons?.find(fc => fc.field === 'Vendor Name');
    const dateComp = selectedDetail.fieldComparisons?.find(fc => fc.field === 'Date');
    const amountComp = selectedDetail.fieldComparisons?.find(fc => fc.field === 'Total Amount');
    const currencyComp = selectedDetail.fieldComparisons?.find(fc => fc.field === 'Currency');
    const descriptionComp = selectedDetail.fieldComparisons?.find(fc => fc.field === 'Description of Items');
    const quantityComp = selectedDetail.fieldComparisons?.find(fc => fc.field === 'Quantity');
    
    // Create HTML email body
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
          .discrepancy-box { background: #f8f9fa; border-left: 3px solid #6c757d; padding: 15px; margin: 15px 0; }
          .discrepancy-item { margin-bottom: 12px; }
          .discrepancy-item:last-child { margin-bottom: 0; }
          .field-name { font-weight: 600; color: #2c3e50; margin-bottom: 4px; }
          .field-detail { font-size: 14px; color: #6c757d; margin: 2px 0; }
          .footer { padding: 25px 40px; background: #f8f9fa; border-top: 1px solid #dee2e6; font-size: 13px; color: #6c757d; }
          .score-badge { display: inline-block; padding: 6px 14px; background: #e9ecef; color: #2c3e50; font-weight: 600; font-size: 14px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="status-line">Invoice Validation Report</div>
            <div class="title">Invoice ${action === 'approve' ? 'Approved' : 'Rejected'}</div>
            <div class="score-badge">Match Score: ${selectedDetail.matchScore || 0}%</div>
          </div>
          
          <!-- Content -->
          <div class="content">
            <p style="margin: 0 0 25px 0; font-size: 15px; color: #495057;">Dear ${selectedDetail.vendorName},</p>
            
            <p style="margin: 0 0 25px 0; font-size: 15px; color: #495057;">
              Your invoice has been processed through our automated validation system and has been 
              <strong>${action === 'approve' ? 'approved' : 'rejected'}</strong> for payment processing.
            </p>
            
            <!-- Invoice Details Table -->
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
          <!-- Mismatched Fields Section -->
          <div class="section-title" style="color: #dc2626; border-color: #dc2626;">Fields That Did Not Match</div>
          <table class="info-table" style="margin-bottom: 25px;">
            <thead>
              <tr style="background: #fef2f2;">
                <th style="padding: 12px 0; font-weight: 600; color: #6c757d; width: 180px; border-bottom: 2px solid #e9ecef;">Field Name</th>
                <th style="padding: 12px 0; font-weight: 600; color: #6c757d; border-bottom: 2px solid #e9ecef;">Purchase Order</th>
                <th style="padding: 12px 0; font-weight: 600; color: #6c757d; border-bottom: 2px solid #e9ecef;">Invoice</th>
              </tr>
            </thead>
            <tbody>
              ${mismatches.map(m => `
              <tr style="background: #fff5f5;">
                <td style="padding: 12px 0; border-bottom: 1px solid #fee2e2; font-weight: 600; color: #dc2626;">${m.field}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #fee2e2; color: #2c3e50;">${m.poValue}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #fee2e2; color: #2c3e50;">${m.invoiceValue}</td>
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
    
    // Send email via Gmail API if tokens available (for email and mongodb workflows)
    if ((workflowType === 'email' || workflowType === 'mongodb') && gmailTokens) {
      try {
        console.log('=== SENDING EMAIL REPLY ===');
        console.log('Thread ID:', (selectedDetail as any).emailThreadId);
        console.log('Message ID:', (selectedDetail as any).emailMessageId);
        console.log('Original Subject:', (selectedDetail as any).originalSubject);
        console.log('Vendor Email:', (selectedDetail as any).vendorEmail);
        console.log('Action:', action);
        
        const emailPayload = {
          tokens: gmailTokens,
          threadId: (selectedDetail as any).emailThreadId,
          messageId: (selectedDetail as any).emailMessageId,
          to: (selectedDetail as any).vendorEmail || selectedDetail.vendorName,
          subject: (selectedDetail as any).originalSubject || `Invoice ${action === 'approve' ? 'APPROVED' : 'REJECTED'} - ${selectedDetail.invoiceId}`,
          body: emailBodyHTML
        };
        
        console.log('Email payload being sent:', {
          ...emailPayload,
          tokens: '[REDACTED]',
          body: '[HTML BODY]'
        });
        
        const response = await fetch('/api/gmail-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
        
        const result = await response.json();
        console.log('Gmail API response:', result);
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to send email');
        }
        
        console.log('✅ Email sent successfully as reply to:', (selectedDetail as any).vendorEmail);
        console.log('Reply sent in thread:', result.threadId);
      } catch (error) {
        console.error('Error sending email:', error);
        setToastType('error');
        setToastMessage(`Failed to send email: ${(error as Error).message}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
    } else {
      // For Oracle workflow, just log to console
      console.log('Email notification (console output for Oracle workflow):');
      console.log(emailBodyHTML);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
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

  // Gmail handlers
  const handleGmailAuth = async () => {
    setIsAuthenticating(true);
    setConnectionStatus('connecting');
    setProcessingProgress(0);
    
    try {
      const response = await fetch('/api/gmail-auth?action=authorize');
      const { authUrl } = await response.json();
      
      // Open auth popup
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Track if auth succeeded
      let authSucceeded = false;
      
      // Listen for message from OAuth callback
      const messageHandler = (event: MessageEvent) => {
        console.log('Received message:', event.data);
        
        // Verify the message origin matches our app
        if (event.origin !== window.location.origin) {
          console.log('Message origin mismatch:', event.origin, 'expected:', window.location.origin);
          return;
        }
        
        if (event.data.type === 'GMAIL_AUTH_SUCCESS' && event.data.tokens) {
          console.log('OAuth success! Tokens received:', event.data.tokens);
          authSucceeded = true;
          
          // Store tokens
          setGmailTokens(event.data.tokens);
          
          // Update UI
          setConnectionStatus('connected');
          setProcessingProgress(100);
          setToastType('success');
          setToastMessage('Successfully authenticated with Gmail!');
          setShowToast(true);
          
          // Clean up listener
          window.removeEventListener('message', messageHandler);
          if (checkClosed) clearInterval(checkClosed);
          
          // Fetch emails directly with the tokens from the message
          setTimeout(() => {
            setShowToast(false);
            console.log('About to fetch emails with tokens');
            fetchGmailEmails(event.data.tokens);
          }, 2000);
        } else if (event.data.type === 'GMAIL_AUTH_FAILED') {
          console.error('OAuth failed:', event.data.error);
          authSucceeded = false;
          
          // Clean up listener
          window.removeEventListener('message', messageHandler);
          if (checkClosed) clearInterval(checkClosed);
          
          // Reset states and show error
          setIsAuthenticating(false);
          setConnectionStatus('disconnected');
          setProcessingProgress(0);
          setWorkflowStage('home');
          setWorkflowType(null);
          
          // Show error toast
          setToastType('error');
          setToastMessage(`Gmail authorization failed: ${event.data.error || 'Unknown error'}`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Also check if window closes without success (user cancelled)
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          
          // Only show error if auth didn't succeed
          if (!authSucceeded) {
            // Reset all states
            setIsAuthenticating(false);
            setConnectionStatus('disconnected');
            setProcessingProgress(0);
            setWorkflowStage('home');
            setWorkflowType(null);
            
            // Show error toast
            setToastType('error');
            setToastMessage('Gmail authorization cancelled. Please try again.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
          }
        }
      }, 500);
      
    } catch (error) {
      setToastType('error');
      setToastMessage('Failed to authenticate with Gmail');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsAuthenticating(false);
      setConnectionStatus('disconnected');
    }
  };

  const fetchGmailEmails = async (tokensParam?: any) => {
    try {
      // Use passed tokens or state tokens
      const tokens = tokensParam || gmailTokens;
      
      if (!tokens) {
        setToastType('error');
        setToastMessage('No authentication tokens available');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      console.log('Fetching emails with tokens:', tokens);

      // Fetch real emails from Gmail API
      const response = await fetch('/api/gmail-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: tokens,
          senderEmail: process.env.EMAIL_SENDER_FILTER // Empty to fetch all emails with attachments, or specify like 'xyz@gmail.com'
        })
      });

      console.log('Email fetch response status:', response.status);
      const data = await response.json();
      console.log('Email fetch response data:', data);

      if (!response.ok) {
        console.error('Email fetch failed:', data);
        throw new Error(data.error || 'Failed to fetch emails');
      }

      if (data.emails && data.emails.length > 0) {
        console.log(`Successfully fetched ${data.emails.length} emails`);
        setEmails(data.emails);
        setWorkflowStage('extraction');
        setToastType('success');
        setToastMessage(`Found ${data.emails.length} emails with attachments`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        console.log('No emails found');
        setToastType('error');
        setToastMessage(data.message || 'No emails found with PDF attachments');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setWorkflowStage('home');
        setWorkflowType(null);
      }
      
      setIsAuthenticating(false);
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      setToastType('error');
      setToastMessage(error.message || 'Failed to fetch emails');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsAuthenticating(false);
      setWorkflowStage('home');
      setWorkflowType(null);
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
      
      // Process each selected email
      for (const email of selectedEmailsList) {
        // Process each PDF attachment in the email
        for (const attachment of email.attachments) {
          if (attachment.filename.toLowerCase().endsWith('.pdf')) {
            try {
              setProcessingProgress(Math.min(progress, 30));
              
              // Fetch invoice data from MongoDB Invoice_mock_data collection
              const invoiceResponse = await fetch(`/api/mongodb/invoice-mock-data?fileName=${encodeURIComponent(attachment.filename)}`);
              const invoiceData = await invoiceResponse.json();
              
              if (!invoiceData.success || !invoiceData.invoices || invoiceData.invoices.length === 0) {
                console.error(`No invoice mock data found for ${attachment.filename}`);
                continue; // Skip this attachment if no invoice data found
              }
              
              const invoiceFromDB = invoiceData.invoices[0];
              
              setProcessingProgress(Math.min(progress + 20, 60));
              
              // Fetch matching PO from MongoDB based on fileName
              const poResponse = await fetch(`/api/mongodb/purchase-orders?fileName=${encodeURIComponent(attachment.filename)}`);
              const poData = await poResponse.json();
              
              if (poData.success && poData.purchaseOrders && poData.purchaseOrders.length > 0) {
                const matchingPO = poData.purchaseOrders[0];
                
                setProcessingProgress(Math.min(progress + 30, 80));
                
                // Create field comparisons between invoice and PO
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
                  // Store email info for reply functionality
                  emailThreadId: email.threadId,
                  emailMessageId: email.messageId,
                  originalSubject: email.subject,
                  vendorEmail: email.from.match(/<(.+)>/)?.[1] || email.from,
                  fileName: attachment.filename
                } as any);
              }
              
              progress += (80 / (selectedEmailsList.length * email.attachments.length));
            } catch (error) {
              console.error(`Error processing ${attachment.filename}:`, error);
            }
          }
>>>>>>> Stashed changes
        }
        return inv;
      }));
      setActiveStep(null);
    }, 1500);
  };

<<<<<<< Updated upstream
  const stats = {
    total: invoices.length,
    pendingReview: invoices.filter(i => i.status === 'pending-review').length,
    inProcess: invoices.filter(i => i.status === 'in-process').length,
    approved: invoices.filter(i => i.status === 'approved').length,
=======
  const toggleEmailSelection = (id: string) => {
    const newSelection = new Set(selectedEmails);
    newSelection.has(id) ? newSelection.delete(id) : newSelection.add(id);
    setSelectedEmails(newSelection);
  };

  const toggleSelectAllEmails = () => {
    setSelectedEmails(selectedEmails.size === emails.length ? new Set() : new Set(emails.map(e => e.id)));
  };


  const handleWorkflowSelection = (type: WorkflowType) => {
    setWorkflowType(type);
    if (type === 'oracle') {
      // Show connection screen and automatically start connecting
      setWorkflowStage('connection');
      // Immediately start the connection process (no button needed)
      setTimeout(() => handleConnect(), 100);
    } else if (type === 'email') {
      // Start Gmail workflow
      setWorkflowStage('connection');
      setTimeout(() => handleGmailAuth(), 100);
    } else if (type === 'mongodb') {
      // Start MongoDB + Gmail workflow
      setWorkflowStage('connection');
      setTimeout(() => handleGmailAuth(), 100);
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

Best regards,
Solutions Plus Processing Team
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
>>>>>>> Stashed changes
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)' }}>
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Semi Automated Workflow</h1>
          <p className="text-gray-400">Monitor and manage invoice workflows with automated and manual steps</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Invoices</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pendingReview}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-500/20">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">In Process</p>
                <p className="text-3xl font-bold text-blue-400">{stats.inProcess}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500/20">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-500/20">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="grid gap-6">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-6 rounded-xl transition-all cursor-pointer"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: selectedInvoice?.id === invoice.id ? '1px solid rgba(107, 70, 193, 0.6)' : '1px solid rgba(107, 70, 193, 0.3)' 
              }}
              onClick={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
            >
              {/* Invoice Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{invoice.invoiceNumber}</h3>
                  <p className="text-gray-400 text-sm">Vendor: {invoice.vendor}</p>
                  <p className="text-gray-400 text-sm">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white mb-2">${invoice.amount.toLocaleString()}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Workflow Steps */}
              {selectedInvoice?.id === invoice.id && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-4">Workflow Steps</h4>
                  <div className="space-y-3">
                    {invoice.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h5 className="font-medium text-white">{step.name}</h5>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                step.automationLevel === 'automated' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {step.automationLevel}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                            {step.status.replace('-', ' ')}
                          </span>
                          {step.status === 'requires-input' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStepAction(invoice.id, step.id);
                              }}
                              disabled={activeStep === step.id}
                              className="px-4 py-2 rounded-lg text-xs font-medium text-white transition-all"
                              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                              {activeStep === step.id ? 'Processing...' : 'Take Action'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
          <h3 className="text-lg font-semibold text-white mb-3">About Semi Automated Workflow</h3>
          <div className="space-y-2 text-gray-300">
            <p>Semi automated workflows combine the efficiency of automation with human oversight and decision-making:</p>
            <ul className="space-y-1 ml-6 mt-2">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span><strong className="text-blue-400">Automated Steps:</strong> Document receipt, data extraction, payment processing</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-400 mr-2">•</span>
                <span><strong className="text-orange-400">Manual Steps:</strong> Vendor verification, amount validation, approvals</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Steps requiring input are highlighted and can be completed with one click</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                <span>Real-time status tracking for each invoice and workflow step</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
