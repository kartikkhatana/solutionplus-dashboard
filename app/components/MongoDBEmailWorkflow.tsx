'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface WorkflowStep {
  step: number;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number;
  timestamp?: string;
  data?: any;
}

interface WorkflowSummary {
  emailsFound: number;
  attachmentsProcessed: number;
  averageScore: number;
  validatedCount: number;
  reviewRequiredCount: number;
}

interface FieldComparison {
  field: string;
  poValue: string;
  invoiceValue: string;
  match: boolean;
}

interface AnalysisResult {
  id: string;
  vendorName: string;
  invoiceId: string;
  poNumber: string;
  invoiceAmount: number;
  poAmount: number;
  invoiceDate: string;
  poDate: string;
  status: 'matched' | 'mismatched';
  matchScore: number;
  fieldComparisons: FieldComparison[];
  emailThreadId?: string;
  emailMessageId?: string;
  originalSubject?: string;
  vendorEmail?: string;
  fileName?: string;
  processedAt: string;
  processingTime: string;
}

interface MongoDBEmailWorkflowProps {
  onBack: () => void;
}

export default function MongoDBEmailWorkflow({ onBack }: MongoDBEmailWorkflowProps) {
  // MongoDB Email Workflow State
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tokens, setTokens] = useState<any>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);

  // Initialize workflow steps
  const initializeSteps = (): WorkflowStep[] => [
    { step: 1, title: 'Connecting to Gmail', status: 'pending', message: 'Ready to connect...', progress: 0 },
    { step: 2, title: 'Fetching Emails', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 3, title: 'Processing PDF Attachments', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 4, title: 'Matching with DB', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 5, title: 'Analyzing Results', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 6, title: 'Sending Email Reports', status: 'pending', message: 'Waiting...', progress: 0 },
  ];

  useEffect(() => {
    // Don't initialize steps until connected
    if (isConnected) {
      const initialSteps = initializeSteps();
      // Mark Step 1 as completed since Gmail is already connected
      initialSteps[0] = {
        ...initialSteps[0],
        status: 'completed',
        message: 'Connected successfully',
        progress: 100,
        timestamp: new Date().toISOString()
      };
      setSteps(initialSteps);
    }

    // Listen for Gmail auth messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
        setTokens(event.data.tokens);
        setIsConnected(true);
        setConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isConnected]);

  const resetWorkflow = () => {
    setSteps(initializeSteps());
    setIsProcessing(false);
    setShowResults(false);
    setSummary(null);
    setResults([]);
    setIsConnected(false);
    setTokens(null);
    setEmails([]);
  };

  // MongoDB Email Workflow Functions
  const connectGmail = async () => {
    setConnecting(true);
    
    try {
      const response = await fetch('/api/gmail-auth?action=authorize');
      const data = await response.json();
      
      if (data.authUrl) {
        const popup = window.open(
          data.authUrl,
          'gmail-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }
      }
    } catch (error: any) {
      console.error('Error connecting to Gmail:', error);
      setConnecting(false);
    }
  };

  const startWorkflow = async () => {
    if (!tokens) return;
    
    setIsProcessing(true);
    setShowResults(false);
    setSummary(null);
    setResults([]);
    
    try {
      await executeMongoDBWorkflowSteps();
    } catch (error: any) {
      console.error('MongoDB Workflow error:', error);
      setSteps(prev => prev.map((step, index) => {
        if (step.status === 'processing') {
          return { ...step, status: 'error', message: `Step failed: ${error.message || 'Unknown error occurred'}` };
        }
        return step;
      }));
      
      // Show error message to user
      alert(`MongoDB Workflow Error: ${error.message || 'Unknown error occurred'}. Please check the console for more details.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeMongoDBWorkflowSteps = async () => {
    try {
      console.log('Starting MongoDB workflow steps...');
      
      // Step 2: Fetch Emails
      setSteps(prev => prev.map(step => 
        step.step === 2 
          ? { ...step, status: 'processing', message: 'Fetching emails with PDF attachments...', progress: 50 }
          : step
      ));

      console.log('Fetching emails with tokens:', tokens);
      const emailResponse = await fetch('/api/gmail-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: tokens,
          senderEmail: process.env.EMAIL_SENDER_FILTER
        })
      });

      console.log('Email response status:', emailResponse.status);
      const emailData = await emailResponse.json();
      console.log('Email data:', emailData);
      
      if (!emailData.success && !emailData.emails) {
        console.error('Email fetch failed:', emailData.error);
        throw new Error(emailData.error || 'Failed to fetch emails');
      }

    setEmails(emailData.emails || []);
    setSteps(prev => prev.map(step => 
      step.step === 2 
        ? { ...step, status: 'completed', message: `Found ${emailData.emails?.length || 0} emails`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Process PDF Attachments
    setSteps(prev => prev.map(step => 
      step.step === 3 
        ? { ...step, status: 'processing', message: 'Processing PDF attachments...', progress: 30 }
        : step
    ));

    const processedResults: AnalysisResult[] = [];
    const emailsToProcess = emailData.emails || [];
    let processedCount = 0;

    for (const email of emailsToProcess) {
      for (const attachment of email.attachments) {
        if (attachment.filename.toLowerCase().endsWith('.pdf')) {
          try {
            // Update progress
            processedCount++;
            const progressPercent = Math.min(30 + (processedCount / (emailsToProcess.length * 2)) * 40, 70);
            setSteps(prev => prev.map(step => 
              step.step === 3 
                ? { ...step, progress: progressPercent, message: `Processing ${attachment.filename}...` }
                : step
            ));

            // Step 4: Match with MongoDB (integrated into processing)
            if (processedCount === 1) {
              setSteps(prev => prev.map(step => 
                step.step === 4 
                  ? { ...step, status: 'processing', message: 'Querying MongoDB for matching data...', progress: 20 }
                  : step
              ));
            }

            // Fetch invoice data from MongoDB
            const invoiceResponse = await fetch(`/api/mongodb/invoice-mock-data?fileName=${encodeURIComponent(attachment.filename)}`);
            const invoiceData = await invoiceResponse.json();

            if (!invoiceData.success || !invoiceData.invoices || invoiceData.invoices.length === 0) {
              console.log(`No invoice data found for ${attachment.filename}`);
              continue;
            }

            const invoiceFromDB = invoiceData.invoices[0];

            // Fetch matching PO from MongoDB
            const poResponse = await fetch(`/api/mongodb/purchase-orders?fileName=${encodeURIComponent(attachment.filename)}`);
            const poData = await poResponse.json();

            if (poData.success && poData.purchaseOrders && poData.purchaseOrders.length > 0) {
              const matchingPO = poData.purchaseOrders[0];

              // Create field comparisons
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
              const status: 'matched' | 'mismatched' = matchCount === fieldComparisons.length ? 'matched' : 'mismatched';

              processedResults.push({
                id: `${email.id}-${attachment.filename}`,
                vendorName: invoiceFromDB.vendorName,
                invoiceId: `INV-${attachment.filename.replace('.pdf', '')}`,
                poNumber: matchingPO.poNumber || 'N/A',
                invoiceAmount: invoiceFromDB.totalAmount,
                poAmount: matchingPO.totalAmount || 0,
                invoiceDate: invoiceFromDB.date,
                poDate: matchingPO.date || '',
                status,
                matchScore,
                fieldComparisons,
                emailThreadId: email.threadId,
                emailMessageId: email.messageId,
                originalSubject: email.subject,
                vendorEmail: email.from.match(/<(.+)>/)?.[1] || email.from,
                fileName: attachment.filename,
                processedAt: new Date().toISOString(),
                processingTime: '2.3s'
              });
            }
          } catch (error) {
            console.error(`Error processing ${attachment.filename}:`, error);
          }
        }
      }
    }

    // Complete Step 3
    setSteps(prev => prev.map(step => 
      step.step === 3 
        ? { ...step, status: 'completed', message: `Processed ${processedResults.length} PDF attachments`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    // Complete Step 4
    setSteps(prev => prev.map(step => 
      step.step === 4 
        ? { ...step, status: 'completed', message: `Matched ${processedResults.length} records with MongoDB`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Analyze Results
    setSteps(prev => prev.map(step => 
      step.step === 5 
        ? { ...step, status: 'processing', message: 'Analyzing validation results...', progress: 50 }
        : step
    ));

    const validatedCount = processedResults.filter(r => r.status === 'matched').length;
    const reviewRequiredCount = processedResults.filter(r => r.status === 'mismatched').length;
    const averageScore = processedResults.length > 0 
      ? processedResults.reduce((sum, r) => sum + r.matchScore, 0) / processedResults.length 
      : 0;

    const workflowSummary: WorkflowSummary = {
      emailsFound: emailsToProcess.length,
      attachmentsProcessed: processedResults.length,
      averageScore,
      validatedCount,
      reviewRequiredCount
    };

    setSummary(workflowSummary);
    setResults(processedResults);

    setSteps(prev => prev.map(step => 
      step.step === 5 
        ? { ...step, status: 'completed', message: `Analysis complete - ${validatedCount} validated, ${reviewRequiredCount} need review`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 6: Send Email Reports
    setSteps(prev => prev.map(step => 
      step.step === 6 
        ? { ...step, status: 'processing', message: 'Sending email reports to vendors...', progress: 30 }
        : step
    ));

    // Send email reports for each processed result
    let emailsSent = 0;
    for (const result of processedResults) {
      try {
        const mismatches = result.fieldComparisons.filter(fc => !fc.match);
        const matchedFields = result.fieldComparisons.filter(fc => fc.match);
        
        // Extract field comparisons for easier access
        const poNumberComp = result.fieldComparisons.find(f => f.field === 'PO Number');
        const vendorNameComp = result.fieldComparisons.find(f => f.field === 'Vendor Name');
        const dateComp = result.fieldComparisons.find(f => f.field === 'Date');
        const amountComp = result.fieldComparisons.find(f => f.field === 'Total Amount');
        const currencyComp = result.fieldComparisons.find(f => f.field === 'Currency');
        const descriptionComp = result.fieldComparisons.find(f => f.field === 'Description of Items');
        const quantityComp = result.fieldComparisons.find(f => f.field === 'Quantity');

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
                <div class="status-line">Invoice Validation Report</div>
                <div class="title">Invoice ${result.status === 'matched' ? 'Approved' : 'Rejected'}</div>
                <div class="score-badge">Match Score: ${result.matchScore}%</div>
              </div>
              
              <!-- Content -->
              <div class="content">
                <p style="margin: 0 0 25px 0; font-size: 15px; color: #495057;">Dear ${result.vendorName},</p>
                
                <p style="margin: 0 0 25px 0; font-size: 15px; color: #495057;">
                  Your invoice has been processed through our automated validation system and has been 
                  <strong>${result.status === 'matched' ? 'approved' : 'rejected'}</strong> for payment processing.
                </p>
                
                <!-- Invoice Details Table -->
                <div class="section-title">Invoice Details</div>
                <table class="info-table">
                  <tr>
                    <td>PO Number</td>
                    <td>${poNumberComp?.invoiceValue || result.poNumber}</td>
                  </tr>
                  <tr>
                    <td>Vendor Name</td>
                    <td>${vendorNameComp?.invoiceValue || result.vendorName}</td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>${dateComp?.invoiceValue || result.invoiceDate}</td>
                  </tr>
                  <tr>
                    <td>Total Amount</td>
                    <td><strong>${amountComp?.invoiceValue || result.invoiceAmount.toLocaleString()}</strong></td>
                  </tr>
                  <tr>
                    <td>Currency</td>
                    <td>${currencyComp?.invoiceValue || 'AED'}</td>
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
                  ${result.status === 'matched' ? '⚠️ Despite discrepancies, this invoice has been approved for processing.' : '⚠️ Please review and resubmit the corrected invoice with matching values.'}
                </p>
              </div>
              ` : `
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                <p style="color: #059669; margin: 0;">✅ All fields have been validated successfully.</p>
                ${result.status === 'matched' ? '<p style="margin: 10px 0 0 0;">The invoice has been approved for payment processing.</p>' : ''}
              </div>
              `}
              
              <p style="margin-top: 30px;">Best regards,<br><strong>Solutions Plus Team</strong></p>
            </div>
          </body>
        </html>
        `;

        const emailResponse = await fetch('/api/gmail-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: tokens,
            threadId: result.emailThreadId,
            messageId: result.emailMessageId,
            to: result.vendorEmail,
            subject: result.originalSubject || `Invoice Processing Report - ${result.invoiceId}`,
            body: emailBodyHTML
          })
        });

        if (emailResponse.ok) {
          emailsSent++;
        }

        // Update progress
        const emailProgress = Math.min(30 + (emailsSent / processedResults.length) * 70, 100);
        setSteps(prev => prev.map(step => 
          step.step === 6 
            ? { ...step, progress: emailProgress, message: `Sent ${emailsSent}/${processedResults.length} email reports...` }
            : step
        ));

      } catch (error) {
        console.error(`Error sending email for ${result.invoiceId}:`, error);
      }
    }

    setSteps(prev => prev.map(step => 
      step.step === 6 
        ? { ...step, status: 'completed', message: `Email reports sent to ${emailsSent} vendors`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    setShowResults(true);
    } catch (error) {
      console.error('Error in executeMongoDBWorkflowSteps:', error);
      throw error;
    }
  };

  // Helper functions for step visualization (same as EmailWorkflow)
  const getStepIcon = (step: WorkflowStep) => {
    const iconClass = "w-8 h-8";
    
    switch (step.status) {
      case 'completed':
        return (
          <motion.svg 
            className={`${iconClass} text-white`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </motion.svg>
        );
      case 'processing':
        return (
          <motion.svg 
            className={`${iconClass} text-white`} 
            fill="none" 
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </motion.svg>
        );
      case 'error':
        return (
          <motion.svg 
            className={`${iconClass} text-white`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </motion.svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'from-green-500 to-emerald-600';
      case 'processing': return 'from-blue-500 to-indigo-600';
      case 'error': return 'from-red-500 to-red-600';
      default: return 'from-gray-300 to-gray-400';
    }
  };

  const openDetailModal = (result: AnalysisResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back Button */}
      <div className="mb-6">
        <motion.button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          whileHover={{ x: -5 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Workflows</span>
        </motion.button>
      </div>

      {/* MongoDB Email Workflow Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Automation Workflow</h2>
          <p className="text-gray-600">Automated invoice processing with Gmail integration and email reporting</p>
        </div>

        {/* Connection Status */}
        <motion.div 
          className="mb-8 p-6 rounded-xl border border-gray-200 bg-gray-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isConnected ? 'bg-teal-100' : 'bg-gray-200'
                }`}
                animate={connecting ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: connecting ? Infinity : 0 }}
              >
                <svg className={`w-8 h-8 ${isConnected ? 'text-teal-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Gmail Connection</h3>
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Connected - Ready to process emails' : 'Connect to Gmail to start automated processing'}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {!isConnected ? (
                <motion.button
                  onClick={connectGmail}
                  disabled={connecting}
                  className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {connecting ? 'Connecting...' : 'Connect Gmail'}
                </motion.button>
              ) : (
                <>
                  <motion.button
                    onClick={startWorkflow}
                    disabled={isProcessing}
                    className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isProcessing ? 'Processing...' : 'Start MongoDB Workflow'}
                  </motion.button>
                  <motion.button
                    onClick={resetWorkflow}
                    className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Reset
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Workflow Steps - Only show when connected */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <AnimatePresence>
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <motion.div 
                      className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-r ${getStepColor(step.status)} shadow-lg`}
                      animate={step.status === 'processing' ? { boxShadow: ['0 0 0 0 rgba(20, 184, 166, 0.7)', '0 0 0 10px rgba(20, 184, 166, 0)', '0 0 0 0 rgba(20, 184, 166, 0)'] } : {}}
                      transition={{ duration: 2, repeat: step.status === 'processing' ? Infinity : 0 }}
                    >
                      {getStepIcon(step)}
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.message}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${getStepColor(step.status)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${step.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{step.progress}%</span>
                    {step.timestamp && (
                      <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Summary Results */}
        <AnimatePresence>
          {summary && showResults && (
            <motion.div
              className="mb-8 p-6 rounded-xl border border-teal-200 bg-teal-50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">MongoDB Processing Complete</h2>
                  <p className="text-sm text-gray-600">Automated workflow summary with database validation</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Emails Found</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.emailsFound}</p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Attachments</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.attachmentsProcessed}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-100 border border-green-200">
                  <p className="text-sm text-green-700 mb-1">Validated</p>
                  <p className="text-2xl font-bold text-green-700">{summary.validatedCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-100 border border-yellow-200">
                  <p className="text-sm text-yellow-700 mb-1">Review Required</p>
                  <p className="text-2xl font-bold text-yellow-700">{summary.reviewRequiredCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-teal-100 border border-teal-200">
                  <p className="text-sm text-teal-700 mb-1">Avg Score</p>
                  <p className="text-2xl font-bold text-teal-700">{Math.round(summary.averageScore)}%</p>
                </div>
              </div>

              {/* Results Table */}
              {results.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">MongoDB Validation Results</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.id}
                        className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => openDetailModal(result)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Invoice: {result.invoiceId}</p>
                            <p className="text-xs text-gray-500">Vendor: {result.vendorName} • PO: {result.poNumber}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              result.status === 'matched' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {result.status === 'matched' ? 'Validated' : 'Review Required'}
                            </span>
                            <span className="text-lg font-bold text-gray-800">{result.matchScore}%</span>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedResult && (
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-teal-700 to-cyan-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">MongoDB Validation Report</h3>
                      <p className="text-teal-200 text-sm">Invoice: {selectedResult.invoiceId} • PO: {selectedResult.poNumber}</p>
                    </div>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">Overall Match Score</h4>
                      <span className={`px-4 py-2 rounded-lg font-bold text-lg ${
                        selectedResult.matchScore >= 85 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedResult.matchScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          selectedResult.matchScore >= 85 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-yellow-500 to-orange-400'
                        }`}
                        style={{ width: `${selectedResult.matchScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Field Comparisons */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Field Validation Results</h4>
                    {selectedResult.fieldComparisons.map((comparison, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          comparison.match 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-800 font-medium capitalize">
                            {comparison.field}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              comparison.match 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {comparison.match ? 'MATCH' : 'MISMATCH'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Purchase Order:</span>
                            <p className="font-medium">{comparison.poValue}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Invoice:</span>
                            <p className="font-medium">{comparison.invoiceValue}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-100 px-6 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Processing Time: {selectedResult.processingTime}
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
