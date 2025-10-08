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
                  title="Oracle Fusion"
                  description="Connect to Oracle Fusion ERP to extract and validate Purchase Orders against Invoices with AI-powered matching"
                  features={[
                    "Automated data extraction from Oracle ERP",
                    "AI-powered PO & Invoice matching",
                    "Bulk approval/rejection with email notifications",
                    "Detailed validation reports"
                  ]}
                  buttonText="Initiate"
                  buttonColor="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  onStart={handleOracleWorkflow}
                />

                {/* Email Automation with MongoDB Card */}
                <WorkflowCard
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg"
aria-label="Gmail" role="img"
viewBox="0 0 512 512"><rect
width="512" height="512"
rx="15%"
fill="#ffffff"/><path d="M158 391v-142l-82-63V361q0 30 30 30" fill="#4285f4"/><path d="M 154 248l102 77l102-77v-98l-102 77l-102-77" fill="#ea4335"/><path d="M354 391v-142l82-63V361q0 30-30 30" fill="#34a853"/><path d="M76 188l82 63v-98l-30-23c-27-21-52 0-52 26" fill="#c5221f"/><path d="M436 188l-82 63v-98l30-23c27-21 52 0 52 26" fill="#fbbc04"/></svg>
                     
                  }
                  title="Email"
                  description="Automatically process invoices from emails with intelligent extraction and validation workflows"
                  features={[
                     "Auto-fetch invoices from email",
                    "Intelligent data extraction",
                    "Automated vendor notifications",
                    "Seamless ERP integration"
                    
                  ]}
                  buttonText="Initiate"
                  buttonColor="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                  onStart={handleMongoDBWorkflow}
                />


                {/* Email Automation Card */}
                <WorkflowCard
                  icon={
                    <svg width="341" height="341" viewBox="0 0 341 341" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="170.5" cy="170.5" r="170.5" fill="#081E2B"/>
<path d="M193.21 70.47C182.39 57.7 173.08 44.65 171.18 42C171.14 41.9443 171.088 41.8988 171.027 41.8675C170.966 41.8361 170.898 41.8198 170.83 41.8198C170.762 41.8198 170.694 41.8361 170.633 41.8675C170.572 41.8988 170.52 41.9443 170.48 42C168.59 44.68 159.28 57.73 148.48 70.5C55.77 188.55 163.09 268.22 163.09 268.22L163.96 268.83C164.78 281.15 166.8 298.83 166.8 298.83H174.87C174.87 298.83 176.87 281.19 177.7 268.83L178.58 268.14C178.58 268.14 285.9 188.55 193.21 70.47ZM170.84 266.47C170.84 266.47 166.03 262.37 164.73 260.31V260.09L170.55 131.53C170.563 131.459 170.601 131.394 170.656 131.347C170.712 131.301 170.782 131.275 170.855 131.275C170.928 131.275 170.998 131.301 171.054 131.347C171.109 131.394 171.147 131.459 171.16 131.53L177 260.11V260.33C175.7 262.33 170.89 266.49 170.89 266.49" fill="#00ED64"/>
</svg>

                  }
                  title="Database"
                  description="Process invoices from emails using MongoDB data with automated validation and vendor notification workflows"
                  features={[
                   "Auto-fetch invoices from email",
                    "Match against MongoDB database",
                    "Automated vendor notifications",
                    "Batch processing capabilities",
                  ]}
                  buttonText="Initiate"
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
