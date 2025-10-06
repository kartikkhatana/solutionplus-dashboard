'use client';

import { motion } from 'framer-motion';

interface OracleWorkflowProps {
  onBack: () => void;
}

export default function OracleWorkflow({ onBack }: OracleWorkflowProps) {
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

        {/* Coming Soon Section */}
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Oracle Icon */}
          <motion.div 
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-inner"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </motion.div>

          {/* Coming Soon Badge */}
          <motion.div
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-700 font-semibold">Coming Soon</span>
          </motion.div>

          <h3 className="text-3xl font-bold text-gray-800 mb-4">Oracle ERP Integration</h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We're building a powerful Oracle Fusion ERP integration that will revolutionize your invoice processing workflow with AI-powered matching and validation.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            <motion.div
              className="p-6 rounded-xl border border-gray-200 bg-gray-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Direct ERP Connection</h4>
              <p className="text-gray-600 text-sm">Seamless integration with Oracle Fusion ERP for real-time data extraction and validation.</p>
            </motion.div>

            <motion.div
              className="p-6 rounded-xl border border-gray-200 bg-gray-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">AI-Powered Matching</h4>
              <p className="text-gray-600 text-sm">Advanced algorithms to match Purchase Orders with Invoices automatically with high accuracy.</p>
            </motion.div>

            <motion.div
              className="p-6 rounded-xl border border-gray-200 bg-gray-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Bulk Processing</h4>
              <p className="text-gray-600 text-sm">Process hundreds of invoices simultaneously with bulk approval and rejection capabilities.</p>
            </motion.div>

            <motion.div
              className="p-6 rounded-xl border border-gray-200 bg-gray-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Advanced Analytics</h4>
              <p className="text-gray-600 text-sm">Comprehensive reporting and analytics with detailed validation metrics and insights.</p>
            </motion.div>
          </div>

          {/* Timeline */}
          <motion.div
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h4 className="text-xl font-semibold text-gray-800 mb-4">Development Roadmap</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 text-sm font-bold">1</div>
                <h5 className="font-semibold text-gray-800 mb-2">ERP Integration</h5>
                <p className="text-sm text-gray-600">Establish secure connection with Oracle Fusion ERP systems</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center mx-auto mb-3 text-sm font-bold">2</div>
                <h5 className="font-semibold text-gray-800 mb-2">AI Matching Engine</h5>
                <p className="text-sm text-gray-600">Develop and train AI models for PO-Invoice matching</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center mx-auto mb-3 text-sm font-bold">3</div>
                <h5 className="font-semibold text-gray-800 mb-2">Full Deployment</h5>
                <p className="text-sm text-gray-600">Complete testing and production deployment</p>
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            className="mt-12 p-6 rounded-xl border border-gray-200 bg-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Stay Updated</h4>
            <p className="text-gray-600 mb-4">
              Want to be notified when Oracle ERP integration is ready? Contact our team for early access and updates.
            </p>
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => alert('Thank you for your interest! Our team will contact you soon with updates on Oracle ERP integration.')}
            >
              Get Notified
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
