'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import WorkflowCard from '../components/WorkflowCard';
import EmailWorkflow from '../components/EmailWorkflow';
import OracleWorkflow from '../components/OracleWorkflow';
import MongoDBEmailWorkflow from '../components/MongoDBEmailWorkflow';

type WorkflowType = 'oracle' | 'email' | 'mongodb' | null;

export default function AutomatedWorkflow() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>(null);

  // Workflow Selection Handlers
  const handleOracleWorkflow = () => {
    setSelectedWorkflow('oracle');
  };

  const handleEmailWorkflow = () => {
    setSelectedWorkflow('email');
  };

  const handleMongoDBWorkflow = () => {
    setSelectedWorkflow('mongodb');
  };

  const backToSelection = () => {
    setSelectedWorkflow(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Automated Workflows</h1>
          <p className="text-gray-600">Choose your preferred workflow for intelligent invoice processing</p>
        </div>

        {/* Workflow Selection or Active Workflow */}
        <AnimatePresence mode="wait">
          {selectedWorkflow === null && (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Workflow Selection Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {/* Oracle Fusion ERP Card */}
                <WorkflowCard
                  icon={
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="Oracle Fusion ERP"
                  description="Connect to Oracle Fusion ERP to extract and validate Purchase Orders against Invoices with AI-powered matching"
                  features={[
                    "Automated data extraction from Oracle ERP",
                    "AI-powered PO & Invoice matching",
                    "Bulk approval/rejection with email notifications",
                    "Detailed validation reports"
                  ]}
                  buttonText="Start Oracle Workflow"
                  buttonColor="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  onStart={handleOracleWorkflow}
                />

                {/* Email Automation with MongoDB Card */}
                <WorkflowCard
                  icon={
                    <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  }
                  title="Email-Automation"
                  description="Automatically process invoices from emails with intelligent extraction and validation workflows"
                  features={[
                     "Auto-fetch invoices from email",
                    "Intelligent data extraction",
                    "Automated vendor notifications",
                    "Seamless ERP integration"
                    
                  ]}
                  buttonText="Start Email Workflow"
                  buttonColor="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                  onStart={handleMongoDBWorkflow}
                />


                {/* Email Automation Card */}
                <WorkflowCard
                  icon={
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  title="Email Automation with MongoDB"
                  description="Process invoices from emails using MongoDB data with automated validation and vendor notification workflows"
                  features={[
                   "Auto-fetch invoices from email",
                    "Match against MongoDB database",
                    "Automated vendor notifications",
                    "Batch processing capabilities",
                  ]}
                  buttonText="Start Email with MongoDB Workflow"
                  buttonColor="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  onStart={handleEmailWorkflow}
                />
              </div>
            </motion.div>
          )}

          {selectedWorkflow === 'email' && (
            <EmailWorkflow key="email-workflow" onBack={backToSelection} />
          )}

          {selectedWorkflow === 'oracle' && (
            <OracleWorkflow key="oracle-workflow" onBack={backToSelection} />
          )}

          {selectedWorkflow === 'mongodb' && (
            <MongoDBEmailWorkflow key="mongodb-workflow" onBack={backToSelection} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
