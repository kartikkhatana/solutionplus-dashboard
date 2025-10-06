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
  recordsFound: number;
  recordsProcessed: number;
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
  actionStatus: 'Processing' | 'Approved' | 'Rejected';
  processedAt: string;
  processingTime: string;
}

interface OracleWorkflowProps {
  onBack: () => void;
}

export default function OracleWorkflow({ onBack }: OracleWorkflowProps) {
  // Oracle Workflow State
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock data from semi-automated workflow
  const MOCK_DATA = [
    { id: '1', vendorName: 'Sea Shell LLC', invoiceId: 'INV-2024-001', poNumber: 'PO-2024-156', invoiceAmount: 15750, poAmount: 15750, invoiceDate: '2024-01-15', poDate: '2024-01-15', invoicePaymentTerms: 'Net 30', poPaymentTerms: 'Net 30', invoiceTaxAmount: 1575, poTaxAmount: 1575, invoiceShippingAddress: 'Dubai Marina, UAE', poShippingAddress: 'Dubai Marina, UAE' },
    { id: '2', vendorName: 'Etisalat', invoiceId: 'INV-2024-002', poNumber: 'PO-2024-157', invoiceAmount: 8450, poAmount: 8450, invoiceDate: '2024-01-18', poDate: '2024-01-18', invoicePaymentTerms: 'Net 30', poPaymentTerms: 'Net 45', invoiceTaxAmount: 845, poTaxAmount: 845, invoiceShippingAddress: 'Sheikh Zayed Road, Dubai', poShippingAddress: 'Sheikh Zayed Road, Dubai' },
    { id: '3', vendorName: 'ADNOC', invoiceId: 'INV-2024-003', poNumber: 'PO-2024-158', invoiceAmount: 23200, poAmount: 23200, invoiceDate: '2024-01-20', poDate: '2024-01-20', invoicePaymentTerms: 'Net 60', poPaymentTerms: 'Net 60', invoiceTaxAmount: 2320, poTaxAmount: 2320, invoiceShippingAddress: 'Corniche Road, Abu Dhabi', poShippingAddress: 'Corniche Road, Abu Dhabi' },
    { id: '4', vendorName: 'MDC Business', invoiceId: 'INV-2024-004', poNumber: 'PO-2024-159', invoiceAmount: 12990, poAmount: 12890, invoiceDate: '2024-01-25', poDate: '2024-01-22', invoicePaymentTerms: 'Net 45', poPaymentTerms: 'Net 30', invoiceTaxAmount: 1299, poTaxAmount: 1289, invoiceShippingAddress: 'Muroor Road, Abu Dhabi', poShippingAddress: 'Muroor Road, Abu Dhabi, UAE' },
  ];

  // Initialize workflow steps
  const initializeSteps = (): WorkflowStep[] => [
    { step: 1, title: 'Connecting to Oracle Fusion ERP', status: 'pending', message: 'Ready to connect...', progress: 0 },
    { step: 2, title: 'Extracting PO & Invoice Data', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 3, title: 'Processing Data Pairs', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 4, title: 'AI-Powered Matching Analysis', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 5, title: 'Generating Validation Results', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 6, title: 'Sending Email Notifications', status: 'pending', message: 'Waiting...', progress: 0 },
  ];

  useEffect(() => {
    // Don't initialize steps until connected
    if (isConnected) {
      const initialSteps = initializeSteps();
      // Mark Step 1 as completed since Oracle ERP is already connected
      initialSteps[0] = {
        ...initialSteps[0],
        status: 'completed',
        message: 'Connected successfully',
        progress: 100,
        timestamp: new Date().toISOString()
      };
      setSteps(initialSteps);
    }
  }, [isConnected]);

  const resetWorkflow = () => {
    setSteps(initializeSteps());
    setIsProcessing(false);
    setShowResults(false);
    setSummary(null);
    setResults([]);
    setIsConnected(false);
  };

  // Oracle Workflow Functions
  const connectOracle = async () => {
    setConnecting(true);
    
    // Simulate Oracle ERP connection
    setTimeout(() => {
      setIsConnected(true);
      setConnecting(false);
    }, 2000);
  };

  const startWorkflow = async () => {
    setIsProcessing(true);
    setShowResults(false);
    setSummary(null);
    setResults([]);
    
    try {
      await executeOracleWorkflowSteps();
    } catch (error: any) {
      console.error('Oracle Workflow error:', error);
      setSteps(prev => prev.map((step, index) => {
        if (step.status === 'processing') {
          return { ...step, status: 'error', message: `Step failed: ${error.message}` };
        }
        return step;
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const executeOracleWorkflowSteps = async () => {
    // Step 2: Extract PO & Invoice Data
    setSteps(prev => prev.map(step => 
      step.step === 2 
        ? { ...step, status: 'processing', message: 'Extracting vendor PO and invoice data...', progress: 50 }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1500));

    setSteps(prev => prev.map(step => 
      step.step === 2 
        ? { ...step, status: 'completed', message: `Extracted ${MOCK_DATA.length} PO-Invoice pairs`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Process Data Pairs
    setSteps(prev => prev.map(step => 
      step.step === 3 
        ? { ...step, status: 'processing', message: 'Processing data pairs for validation...', progress: 30 }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1500));

    setSteps(prev => prev.map(step => 
      step.step === 3 
        ? { ...step, status: 'completed', message: `Processed ${MOCK_DATA.length} data pairs`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: AI-Powered Matching Analysis
    setSteps(prev => prev.map(step => 
      step.step === 4 
        ? { ...step, status: 'processing', message: 'Running AI matching algorithms...', progress: 40 }
        : step
    ));

    // Process records with field comparisons (same logic as semi-automated)
    const processedResults: AnalysisResult[] = MOCK_DATA.map(record => {
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
      const status: 'matched' | 'mismatched' = matchCount === fieldComparisons.length ? 'matched' : 'mismatched';

      return {
        id: record.id,
        vendorName: record.vendorName,
        invoiceId: record.invoiceId,
        poNumber: record.poNumber,
        invoiceAmount: record.invoiceAmount,
        poAmount: record.poAmount,
        invoiceDate: record.invoiceDate,
        poDate: record.poDate,
        status,
        matchScore,
        fieldComparisons,
        actionStatus: status === 'matched' ? 'Approved' : 'Rejected' as 'Processing' | 'Approved' | 'Rejected',
        processedAt: new Date().toISOString(),
        processingTime: '2.3s'
      };
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    setSteps(prev => prev.map(step => 
      step.step === 4 
        ? { ...step, status: 'completed', message: `AI analysis complete - ${processedResults.filter(r => r.status === 'matched').length} matched, ${processedResults.filter(r => r.status === 'mismatched').length} need review`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Generate Validation Results
    setSteps(prev => prev.map(step => 
      step.step === 5 
        ? { ...step, status: 'processing', message: 'Generating validation reports...', progress: 60 }
        : step
    ));

    const validatedCount = processedResults.filter(r => r.status === 'matched').length;
    const reviewRequiredCount = processedResults.filter(r => r.status === 'mismatched').length;
    const averageScore = processedResults.length > 0 
      ? processedResults.reduce((sum, r) => sum + r.matchScore, 0) / processedResults.length 
      : 0;

    const workflowSummary: WorkflowSummary = {
      recordsFound: MOCK_DATA.length,
      recordsProcessed: processedResults.length,
      averageScore,
      validatedCount,
      reviewRequiredCount
    };

    setSummary(workflowSummary);
    setResults(processedResults);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setSteps(prev => prev.map(step => 
      step.step === 5 
        ? { ...step, status: 'completed', message: `Generated ${processedResults.length} validation reports`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 6: Send Email Notifications
    setSteps(prev => prev.map(step => 
      step.step === 6 
        ? { ...step, status: 'processing', message: 'Sending automated email notifications...', progress: 30 }
        : step
    ));

    // Simulate sending emails for each result
    let emailsSent = 0;
    for (const result of processedResults) {
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 300));
      emailsSent++;
      
      const emailProgress = Math.min(30 + (emailsSent / processedResults.length) * 70, 100);
      setSteps(prev => prev.map(step => 
        step.step === 6 
          ? { ...step, progress: emailProgress, message: `Sent ${emailsSent}/${processedResults.length} email notifications...` }
          : step
      ));
    }

    setSteps(prev => prev.map(step => 
      step.step === 6 
        ? { ...step, status: 'completed', message: `Email notifications sent to ${emailsSent} vendors`, progress: 100, timestamp: new Date().toISOString() }
        : step
    ));

    setShowResults(true);
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

      {/* Oracle Workflow Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oracle Fusion ERP Workflow</h2>
          <p className="text-gray-600">AI-powered Purchase Order and Invoice matching with Oracle ERP integration</p>
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
                  isConnected ? 'bg-blue-100' : 'bg-gray-200'
                }`}
                animate={connecting ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: connecting ? Infinity : 0 }}
              >
                <svg className={`w-8 h-8 ${isConnected ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Oracle Fusion ERP Connection</h3>
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Connected - Ready to process PO and Invoice data' : 'Connect to Oracle ERP to start automated processing'}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {!isConnected ? (
                <motion.button
                  onClick={connectOracle}
                  disabled={connecting}
                  className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {connecting ? 'Connecting...' : 'Connect Oracle ERP'}
                </motion.button>
              ) : (
                <>
                  <motion.button
                    onClick={startWorkflow}
                    disabled={isProcessing}
                    className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isProcessing ? 'Processing...' : 'Start Oracle Workflow'}
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
                      animate={step.status === 'processing' ? { boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.7)', '0 0 0 10px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)'] } : {}}
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
              className="mb-8 p-6 rounded-xl border border-blue-200 bg-blue-50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Oracle Processing Complete</h2>
                  <p className="text-sm text-gray-600">Automated workflow summary with ERP validation</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Records Found</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.recordsFound}</p>
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Processed</p>
                  <p className="text-2xl font-bold text-gray-800">{summary.recordsProcessed}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-100 border border-green-200">
                  <p className="text-sm text-green-700 mb-1">Validated</p>
                  <p className="text-2xl font-bold text-green-700">{summary.validatedCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-100 border border-yellow-200">
                  <p className="text-sm text-yellow-700 mb-1">Review Required</p>
                  <p className="text-2xl font-bold text-yellow-700">{summary.reviewRequiredCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-100 border border-blue-200">
                  <p className="text-sm text-blue-700 mb-1">Avg Score</p>
                  <p className="text-2xl font-bold text-blue-700">{Math.round(summary.averageScore)}%</p>
                </div>
              </div>

              {/* Results Table */}
              {results.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Oracle ERP Validation Results</h3>
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
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              result.actionStatus === 'Approved' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.actionStatus}
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
                <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Oracle ERP Validation Report</h3>
                      <p className="text-blue-200 text-sm">Invoice: {selectedResult.invoiceId} • PO: {selectedResult.poNumber}</p>
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
