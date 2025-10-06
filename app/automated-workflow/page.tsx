'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

interface ProcessingStep {
  id: number;
  message: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp?: string;
}

interface ProcessingSummary {
  totalEmails: number;
  totalAttachments: number;
  successfulProcessing: number;
  failedProcessing: number;
  successRate: number;
  processedInvoices: Array<{
    filename: string;
    invoiceNumber: string;
    amount: number;
    status: 'success' | 'failed';
  }>;
}

const ALL_DUMMY_EMAILS = [
  { filename: 'Invoice_12345.pdf', invoiceNumber: 'INV-12345', amount: 5425.50 },
  { filename: 'Monthly_Statement_Oct2025.xlsx', invoiceNumber: 'TS-OCT-2025', amount: 3749.94 },
  { filename: 'PO_9876_Invoice.pdf', invoiceNumber: 'PO-9876', amount: 12750.00 },
  { filename: 'PO_9876_Details.docx', invoiceNumber: 'PO-9876-DOC', amount: 0 },
  { filename: 'Consulting_Invoice_Q4.pdf', invoiceNumber: 'CONS-2025-Q4-001', amount: 18500.00 },
  { filename: 'Supplier_Invoice_2025.pdf', invoiceNumber: 'SUP-2025-456', amount: 8750.00 },
  { filename: 'Q4_Expenses.xlsx', invoiceNumber: 'EXP-Q4-2025', amount: 15200.00 },
  { filename: 'Maintenance_Bill.pdf', invoiceNumber: 'MAINT-789', amount: 2340.00 },
  { filename: 'Software_License.xlsx', invoiceNumber: 'LIC-2025-123', amount: 4500.00 },
  { filename: 'Office_Supplies.pdf', invoiceNumber: 'OFF-SUP-321', amount: 1850.00 },
];

// Function to get random emails
const getRandomEmails = () => {
  const count = Math.floor(Math.random() * 5) + 3; // Random number between 3-7
  const shuffled = [...ALL_DUMMY_EMAILS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export default function AutomatedWorkflow() {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [connecting, setConnecting] = useState(false);

  const startProcessing = async () => {
    setIsProcessing(true);
    setProcessingSteps([]);
    setSummary(null);
    setCurrentStep(0);

    // Get random emails
    const DUMMY_EMAILS = getRandomEmails();
    
    // Random number of attachments (5 or 10)
    const attachmentCount = Math.random() > 0.5 ? 5 : 10;

    // Step 1: Fetching latest email
    await addStep(1, 'Fetching latest email from solutionsplus@us.inc...', 'processing');
    await delay(1500);
    await updateStep(1, 'Fetching latest email from solutionsplus@us.inc...', 'completed');

    // Step 2: Processing attachments
    await addStep(2, `Processing ${attachmentCount} attachments...`, 'processing');
    const processedInvoices = [];
    
    for (let i = 0; i < Math.min(attachmentCount, DUMMY_EMAILS.length); i++) {
      const email = DUMMY_EMAILS[i];
      await delay(1500);
      
      const isSuccess = Math.random() > 0.1; // 90% success rate
      
      processedInvoices.push({
        filename: email.filename,
        invoiceNumber: email.invoiceNumber,
        amount: email.amount,
        status: isSuccess ? 'success' as const : 'failed' as const
      });
    }
    
    await updateStep(2, `Successfully processed ${attachmentCount} attachments`, 'completed');

    // Step 3: Replying to email
    await addStep(3, 'Sending reply to the sender...', 'processing');
    await delay(1500);
    await updateStep(3, 'Replied to the email successfully', 'completed');

    // Calculate summary
    const successful = processedInvoices.filter(p => p.status === 'success').length;
    const failed = processedInvoices.filter(p => p.status === 'failed').length;
    const successRate = processedInvoices.length > 0 ? (successful / processedInvoices.length) * 100 : 0;

    setSummary({
      totalEmails: 1, // Single email processed
      totalAttachments: attachmentCount,
      successfulProcessing: successful,
      failedProcessing: failed,
      successRate: Math.round(successRate),
      processedInvoices
    });

    setIsProcessing(false);
  };

  const addStep = async (id: number, message: string, status: ProcessingStep['status']) => {
    setProcessingSteps(prev => [...prev, {
      id,
      message,
      status,
      timestamp: new Date().toLocaleTimeString()
    }]);
    setCurrentStep(id);
  };

  const updateStep = async (id: number, message: string, status: ProcessingStep['status']) => {
    setProcessingSteps(prev => prev.map(step =>
      step.id === id ? { ...step, message, status, timestamp: new Date().toLocaleTimeString() } : step
    ));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const connectGmail = async () => {
    setConnecting(true);
    await delay(1500);
    setIsConnected(true);
    setConnecting(false);
    
    // Auto-start processing after connection
    setTimeout(() => {
      startProcessing();
    }, 500);
  };

  const disconnectGmail = () => {
    setIsConnected(false);
    setIsProcessing(false);
    setProcessingSteps([]);
    setSummary(null);
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0E27 0%, #1a1f3a 100%)' }}>
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Simulation Mode Banner */}
        <div className="mb-6 p-4 rounded-lg border-2 border-blue-500/50 bg-blue-500/10">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-blue-400 font-semibold">Demo Mode Active</h3>
              <p className="text-blue-300 text-sm">This is a simulation with dummy data. No actual Gmail connection required.</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Automated Workflow</h1>
          <p className="text-gray-400">Fully automated invoice processing from forwarded emails</p>
        </div>

        {/* Connection Status */}
        <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                <svg className={`w-6 h-6 ${isConnected ? 'text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Gmail Connection</h3>
                <p className="text-sm text-gray-400">
                  {isConnected ? 'Connected - Processing will start automatically' : 'Connect to start automated processing'}
                </p>
              </div>
            </div>
            
            {!isConnected ? (
              <button
                onClick={connectGmail}
                disabled={connecting}
                className="px-6 py-2.5 rounded-lg font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                {connecting ? 'Connecting...' : 'Connect & Start'}
              </button>
            ) : (
              <button
                onClick={disconnectGmail}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Processing Steps */}
        {isConnected && processingSteps.length > 0 && (
          <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(107, 70, 193, 0.3)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Processing Status</h2>
              {isProcessing && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-400">Processing...</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {processingSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-start space-x-3 p-4 rounded-lg transition-all"
                  style={{ 
                    background: step.status === 'processing' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: step.status === 'processing' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
                  }}
                >
                  <div className="mt-0.5">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-green-400' :
                      step.status === 'error' ? 'text-red-400' :
                      step.status === 'processing' ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {step.message}
                    </p>
                    {step.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">{step.timestamp}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Report */}
        {summary && !isProcessing && (
          <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Processing Complete</h2>
                <p className="text-sm text-gray-400">Workflow automation summary</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <p className="text-sm text-gray-400 mb-1">Total Emails</p>
                <p className="text-2xl font-bold text-white">{summary.totalEmails}</p>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <p className="text-sm text-gray-400 mb-1">Attachments</p>
                <p className="text-2xl font-bold text-white">{summary.totalAttachments}</p>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <p className="text-sm text-green-400 mb-1">Successful</p>
                <p className="text-2xl font-bold text-green-400">{summary.successfulProcessing}</p>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <p className="text-sm text-red-400 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-400">{summary.failedProcessing}</p>
              </div>
            </div>

            {/* Success Rate */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Success Rate</span>
                <span className="text-sm font-bold text-green-400">{summary.successRate}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${summary.successRate}%` }}
                ></div>
              </div>
            </div>

            {/* Processed Invoices Table */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Processed Invoices</h3>
              <div className="space-y-2">
                {summary.processedInvoices.map((invoice, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {invoice.status.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{invoice.filename}</p>
                        <p className="text-xs text-gray-400">Invoice: {invoice.invoiceNumber}</p>
                      </div>
                    </div>
                    {invoice.amount > 0 && (
                      <p className="text-sm font-bold text-white">${invoice.amount.toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
