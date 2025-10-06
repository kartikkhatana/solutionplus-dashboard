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

interface AnalysisResult {
  emailId: string;
  analysisResult: {
    overallScore: number;
    status: string;
    validationPoints: any;
    processedAt: string;
    processingTime: string;
  };
}

interface EmailWorkflowProps {
  onBack: () => void;
}

export default function EmailWorkflow({ onBack }: EmailWorkflowProps) {
  // Email Workflow State
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

  // Initialize workflow steps
  const initializeSteps = (): WorkflowStep[] => [
    { step: 1, title: 'Connecting to G Suite', status: 'pending', message: 'Ready to connect...', progress: 0 },
    { step: 2, title: 'Fetching Emails', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 3, title: 'Uploading Attachments to S3', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 4, title: 'Storing Metadata in MongoDB', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 5, title: 'Analyzing Data', status: 'pending', message: 'Waiting...', progress: 0 },
    { step: 6, title: 'Processing Complete - Sending Report', status: 'pending', message: 'Waiting...', progress: 0 },
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
  };

  // Email Workflow Functions
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
      await executeWorkflowSteps();
    } catch (error: any) {
      console.error('Workflow error:', error);
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

  const executeWorkflowSteps = async () => {
    let currentData: any = {};
    
    // Step 1: Connect to Gmail
    const step1Response = await fetch('/api/automated-workflow/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tokens, 
        senderEmail: 'pintu.sharma@us.inc',
        step: 1
      })
    });

    const step1Data = await step1Response.json();
    if (!step1Data.success) throw new Error(step1Data.error);
    
    setSteps(step1Data.steps);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 2: Fetch Emails
    const step2Response = await fetch('/api/automated-workflow/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tokens, 
        senderEmail: 'pintu.sharma@us.inc',
        step: 2
      })
    });

    const step2Data = await step2Response.json();
    if (!step2Data.success) throw new Error(step2Data.error);
    
    setSteps(step2Data.steps);
    currentData.emailsData = step2Data.emailsData;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 3: Upload to S3
    const step3Response = await fetch('/api/automated-workflow/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tokens, 
        senderEmail: 'pintu.sharma@us.inc',
        step: 3,
        emailsData: currentData.emailsData
      })
    });

    const step3Data = await step3Response.json();
    if (!step3Data.success) throw new Error(step3Data.error);
    
    setSteps(step3Data.steps);
    currentData.processedEmails = step3Data.processedEmails;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 4: Store in MongoDB
    const step4Response = await fetch('/api/automated-workflow/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tokens, 
        senderEmail: 'pintu.sharma@us.inc',
        step: 4,
        processedEmails: currentData.processedEmails
      })
    });

    const step4Data = await step4Response.json();
    if (!step4Data.success) throw new Error(step4Data.error);
    
    setSteps(step4Data.steps);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 5: Analyze Data
    const step5Response = await fetch('/api/automated-workflow/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tokens, 
        senderEmail: 'pintu.sharma@us.inc',
        step: 5,
        processedEmails: currentData.processedEmails
      })
    });

    const step5Data = await step5Response.json();
    if (!step5Data.success) throw new Error(step5Data.error);
    
    setSteps(step5Data.steps);
    currentData.analysisResults = step5Data.analysisResults;
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 6: Complete Workflow
    const step6Response = await fetch('/api/automated-workflow/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tokens, 
        senderEmail: 'pintu.sharma@us.inc',
        step: 6,
        analysisResults: currentData.analysisResults
      })
    });

    const step6Data = await step6Response.json();
    if (!step6Data.success) throw new Error(step6Data.error);
    
    setSteps(step6Data.steps);
    setSummary(step6Data.summary);
    setResults(step6Data.results || []);
    setShowResults(true);
  };

  // Helper functions for step visualization
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

      {/* Email Workflow Content */}
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
                  isConnected ? 'bg-green-100' : 'bg-gray-200'
                }`}
                animate={connecting ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: connecting ? Infinity : 0 }}
              >
                <svg className={`w-8 h-8 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                  className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
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
                    className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isProcessing ? 'Processing...' : 'Start Workflow'}
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
              className="mb-8 p-6 rounded-xl border border-green-200 bg-green-50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Processing Complete</h2>
                  <p className="text-sm text-gray-600">Automated workflow summary</p>
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
                <div className="p-4 rounded-lg bg-red-100 border border-red-200">
                  <p className="text-sm text-red-700 mb-1">Review Required</p>
                  <p className="text-2xl font-bold text-red-700">{summary.reviewRequiredCount}</p>
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
                    <h3 className="text-lg font-semibold text-gray-800">Analysis Results</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.emailId}
                        className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => openDetailModal(result)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Email ID: {result.emailId.substring(0, 16)}...</p>
                            <p className="text-xs text-gray-500">Processed: {new Date(result.analysisResult.processedAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              result.analysisResult.status === 'Validated' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {result.analysisResult.status}
                            </span>
                            <span className="text-lg font-bold text-gray-800">{result.analysisResult.overallScore}%</span>
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
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">28-Point Analysis Report</h3>
                      <p className="text-gray-300 text-sm">Email ID: {selectedResult.emailId}</p>
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
                      <h4 className="text-lg font-semibold text-gray-800">Overall Score</h4>
                      <span className={`px-4 py-2 rounded-lg font-bold text-lg ${
                        selectedResult.analysisResult.overallScore >= 85 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedResult.analysisResult.overallScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          selectedResult.analysisResult.overallScore >= 85 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-yellow-500 to-orange-400'
                        }`}
                        style={{ width: `${selectedResult.analysisResult.overallScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Validation Points */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Validation Points</h4>
                    {Object.entries(selectedResult.analysisResult.validationPoints).map(([key, value]: [string, any]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-lg border ${
                          value.passed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-800 font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              value.passed 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {value.passed ? 'PASS' : 'FAIL'}
                            </span>
                            <span className="text-gray-800 font-bold">{value.score}%</span>
                          </div>
                        </div>
                        {value.issue && (
                          <p className="text-red-600 text-sm mt-2">{value.issue}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-100 px-6 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Processing Time: {selectedResult.analysisResult.processingTime}
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
