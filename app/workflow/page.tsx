'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import Select from 'react-select';

type WorkflowStep = 'ingestion' | 'processing' | 'output' | 'delivery';
type IngestionMethod = 'pdf' | 'email' | 'mongodb' | 'azure' | 'fusion' | 'excel' | null;

interface FieldComparison {
  field: string;
  poValue: string;
  invoiceValue: string;
  match: boolean;
}

interface ProcessedResult {
  id: number;
  invoice: string;
  po: string;
  vendor: string;
  amount: number;
  status: 'success' | 'warning';
  score: number;
  fieldComparisons: FieldComparison[];
  source: string;
}

export default function WorkflowPage() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('ingestion');
  const [selectedMethod, setSelectedMethod] = useState<IngestionMethod>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<{invoices: any[], purchaseOrders: any[]} | null>(null);
  const [pdfData, setPdfData] = useState<{invoices: any[], purchaseOrders: any[]} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProcessedResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    email: '',
    server: '',
    port: '',
    folder: ''
  });
  const [emailErrors, setEmailErrors] = useState({
    email: '',
    server: '',
    port: '',
    folder: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Database form state
  const [dbForm, setDbForm] = useState({
    connectionString: ''
  });
  const [dbErrors, setDbErrors] = useState({
    connectionString: ''
  });

  // Azure form state
  const [azureForm, setAzureForm] = useState({
    accountName: '',
    accessKey: '',
    containerName: ''
  });
  const [azureErrors, setAzureErrors] = useState({
    accountName: '',
    accessKey: '',
    containerName: ''
  });

  // Fusion form state
  const [fusionForm, setFusionForm] = useState({
    instanceUrl: '',
    username: '',
    password: '',
    apiVersion: 'v1'
  });
  const [fusionErrors, setFusionErrors] = useState({
    instanceUrl: '',
    username: '',
    password: ''
  });


  const ingestionMethods = [
    {
      id: 'excel',
      name: 'Excel Upload',
      description: 'Upload Excel sheets',
      icon: '📊',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'pdf',
      name: 'PDF Upload',
      description: 'Upload invoice and PO documents',
      icon: '📄',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'email',
      name: 'Email Integration',
      description: 'Auto-forwarded invoices',
      icon: '📧',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      description: 'Connect to database',
      icon: '🗄️',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'azure',
      name: 'Azure Storage',
      description: 'Import from cloud',
      icon: '☁️',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'fusion',
      name: 'Fusion ERM',
      description: 'ERM integration',
      icon: '⚡',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map(f => f.name);
      setUploadedFiles(fileNames);
      
      // Simulate PDF data extraction (in production, this would use OCR/AI)
      // For demo purposes, we'll generate sample data based on uploaded files
      const invoiceCount = Math.ceil(files.length / 2);
      const poCount = files.length - invoiceCount;
      
      const sampleInvoices = Array.from({ length: invoiceCount }, (_, i) => ({
        invoiceNumber: `INV-PDF-${String(i + 1).padStart(3, '0')}`,
        poNumber: `PO-PDF-${String(i + 1).padStart(3, '0')}`,
        vendorName: ['Acme Corp', 'Tech Solutions', 'Office Supplies Inc', 'Global Trading'][i % 4],
        invoiceDate: '2024-02-15',
        totalAmount: (Math.random() * 50000 + 5000).toFixed(2),
        currency: 'USD',
        paymentTerms: ['Net 30', 'Net 45', 'Net 60'][i % 3],
        shippingAddress: '123 Business St',
        taxAmount: ((Math.random() * 5000 + 500)).toFixed(2),
      }));

      const samplePOs = Array.from({ length: poCount }, (_, i) => ({
        poNumber: `PO-PDF-${String(i + 1).padStart(3, '0')}`,
        vendorName: ['Acme Corp', 'Tech Solutions', 'Office Supplies Inc', 'Global Trading'][i % 4],
        date: '2024-02-15',
        totalAmount: parseFloat(sampleInvoices[i]?.totalAmount || (Math.random() * 50000 + 5000).toFixed(2)),
        currency: 'USD',
        paymentTerms: i % 2 === 0 ? 'Net 30' : sampleInvoices[i]?.paymentTerms || 'Net 45',
        shippingAddress: '123 Business St',
        taxAmount: parseFloat(sampleInvoices[i]?.taxAmount || (Math.random() * 5000 + 500).toFixed(2)),
      }));

      setPdfData({ invoices: sampleInvoices, purchaseOrders: samplePOs });
      setToastType('success');
      setToastMessage(`Extracted ${invoiceCount} invoices and ${poCount} POs from ${files.length} PDF files`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadedFiles([file.name]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Assume first sheet is invoices, second is purchase orders
        const invoiceSheet = workbook.Sheets[workbook.SheetNames[0]];
        const poSheet = workbook.Sheets[workbook.SheetNames[1]];
        
        const invoices = XLSX.utils.sheet_to_json(invoiceSheet);
        const purchaseOrders = XLSX.utils.sheet_to_json(poSheet);
        
        setExcelData({ invoices, purchaseOrders });
        setToastType('success');
        setToastMessage(`Loaded ${invoices.length} invoices and ${purchaseOrders.length} POs from Excel`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch (error: any) {
        setToastType('error');
        setToastMessage('Failed to parse Excel file. Ensure it has two sheets: Invoices and Purchase Orders');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    };
    reader.readAsBinaryString(file);
  };

  const startProcessing = async () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    setProgress(0);

    // If PDF is selected, use uploaded PDF data
    if (selectedMethod === 'pdf' && pdfData) {
      try {
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 90));
        }, 200);

        // Process PDF data
        const { invoices, purchaseOrders } = pdfData;
        
        // Match invoices with POs
        const results: ProcessedResult[] = invoices.map((invoice: any, index: number) => {
          const matchingPO = purchaseOrders.find((po: any) => 
            po.poNumber === invoice.poNumber
          );
          
          if (!matchingPO) {
            return null;
          }

          const matchResult = matchInvoiceWithPO(invoice, matchingPO);

          return {
            id: index + 1,
            invoice: invoice.invoiceNumber,
            po: invoice.poNumber,
            vendor: invoice.vendorName,
            amount: parseFloat(invoice.totalAmount),
            status: matchResult.status,
            score: matchResult.score,
            fieldComparisons: matchResult.comparisons,
            source: 'PDF Upload'
          };
        }).filter((result): result is ProcessedResult => result !== null);

        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          setProcessedResults(results);
          setCurrentStep('output');
        }, 500);
      } catch (error: any) {
        setIsProcessing(false);
        setToastType('error');
        setToastMessage(error.message || 'Error processing PDF data');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        setCurrentStep('ingestion');
      }
    }
    // If Excel is selected, use uploaded Excel data
    else if (selectedMethod === 'excel' && excelData) {
      try {
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 90));
        }, 200);

        // Process Excel data
        const { invoices, purchaseOrders } = excelData;
        
        // Match invoices with POs
        const results: ProcessedResult[] = invoices.map((invoice: any, index: number) => {
          const matchingPO = purchaseOrders.find((po: any) => 
            po['PO Number'] === invoice['PO Number'] || po.poNumber === invoice.poNumber
          );
          
          if (!matchingPO) {
            return null;
          }

          const matchResult = matchInvoiceWithPO(invoice, matchingPO);

          return {
            id: index + 1,
            invoice: invoice['Invoice Number'] || invoice.invoiceNumber,
            po: invoice['PO Number'] || invoice.poNumber,
            vendor: invoice['Vendor Name'] || invoice.vendorName,
            amount: invoice['Total Amount'] || invoice.totalAmount,
            status: matchResult.status,
            score: matchResult.score,
            fieldComparisons: matchResult.comparisons,
            source: 'Excel Upload'
          };
        }).filter((result): result is ProcessedResult => result !== null);

        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          setProcessedResults(results);
          setCurrentStep('output');
        }, 500);
      } catch (error: any) {
        setIsProcessing(false);
        setToastType('error');
        setToastMessage(error.message || 'Error processing Excel data');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        setCurrentStep('ingestion');
      }
    }
    // If MongoDB is selected, fetch real data
    else if (selectedMethod === 'mongodb' || selectedMethod === 'azure' || selectedMethod === 'fusion') {
      try {
        // Simulate progress while fetching
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 5, 90));
        }, 200);

        const response = await fetch('/api/mongodb/invoices');
        const data = await response.json();

        clearInterval(progressInterval);

        if (data.success && data.data) {
          const { invoices, purchaseOrders } = data.data;
          
          // Match invoices with POs
          const results: ProcessedResult[] = invoices.map((invoice: any, index: number) => {
            const matchingPO = purchaseOrders.find((po: any) => po.poNumber === invoice.poNumber);
            
            if (!matchingPO) {
              return null;
            }

            const matchResult = matchInvoiceWithPO(invoice, matchingPO);

            return {
              id: index + 1,
              invoice: invoice.invoiceNumber,
              po: invoice.poNumber,
              vendor: invoice.vendorName,
              amount: invoice.totalAmount,
              status: matchResult.status,
              score: matchResult.score,
              fieldComparisons: matchResult.comparisons,
              source: selectedMethod === 'mongodb' ? 'MongoDB' : selectedMethod === 'azure' ? 'Azure Storage' : 'Fusion ERM'
            };
          }).filter(Boolean);

          setProgress(100);
          setTimeout(() => {
            setIsProcessing(false);
            setProcessedResults(results);
            setCurrentStep('output');
          }, 500);
        } else {
          throw new Error('Failed to fetch data from MongoDB');
        }
      } catch (error: any) {
        setIsProcessing(false);
        setToastType('error');
        setToastMessage(error.message || 'Error processing data');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        setCurrentStep('ingestion');
      }
    } else {
      // For other methods, use simulated data
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            // Generate mock results
            setProcessedResults([
            { 
              id: 1, 
              invoice: 'INV-2024-001', 
              po: 'PO-2024-156', 
              vendor: 'Sea Shell', 
              amount: 15750, 
              status: 'success', 
              score: 100,
              source: 'Email Integration',
              fieldComparisons: [
                { field: 'PO Number', poValue: 'PO-2024-156', invoiceValue: 'PO-2024-156', match: true },
                { field: 'Vendor Name', poValue: 'Sea Shell', invoiceValue: 'Sea Shell', match: true },
                { field: 'Invoice Date', poValue: '2024-01-15', invoiceValue: '2024-01-15', match: true },
                { field: 'Total Amount', poValue: '$15,750.00', invoiceValue: '$15,750.00', match: true },
                { field: 'Currency', poValue: 'USD', invoiceValue: 'USD', match: true },
                { field: 'Payment Terms', poValue: 'Net 30', invoiceValue: 'Net 30', match: true },
                { field: 'Shipping Address', poValue: '123 Main St, NY', invoiceValue: '123 Main St, NY', match: true },
                { field: 'Tax Amount', poValue: '$1,575.00', invoiceValue: '$1,575.00', match: true }
              ]
            },
            { 
              id: 2, 
              invoice: 'INV-2024-002', 
              po: 'PO-2024-157', 
              vendor: 'Etisalat', 
              amount: 8450, 
              status: 'warning', 
              score: 87,
              source: 'Email Integration',
              fieldComparisons: [
                { field: 'PO Number', poValue: 'PO-2024-157', invoiceValue: 'PO-2024-157', match: true },
                { field: 'Vendor Name', poValue: 'Etisalat', invoiceValue: 'Etisalat', match: true },
                { field: 'Invoice Date', poValue: '2024-01-18', invoiceValue: '2024-01-18', match: true },
                { field: 'Total Amount', poValue: '$8,450.00', invoiceValue: '$8,450.00', match: true },
                { field: 'Currency', poValue: 'USD', invoiceValue: 'USD', match: true },
                { field: 'Payment Terms', poValue: 'Net 45', invoiceValue: 'Net 30', match: false },
                { field: 'Shipping Address', poValue: '456 Oak Ave, CA', invoiceValue: '456 Oak Ave, CA', match: true },
                { field: 'Tax Amount', poValue: '$845.00', invoiceValue: '$845.00', match: true }
              ]
            },
            { 
              id: 3, 
              invoice: 'INV-2024-003', 
              po: 'PO-2024-158', 
              vendor: 'ADNOC', 
              amount: 23200, 
              status: 'success', 
              score: 100,
              source: 'Email Integration',
              fieldComparisons: [
                { field: 'PO Number', poValue: 'PO-2024-158', invoiceValue: 'PO-2024-158', match: true },
                { field: 'Vendor Name', poValue: 'ADNOC', invoiceValue: 'ADNOC', match: true },
                { field: 'Invoice Date', poValue: '2024-01-20', invoiceValue: '2024-01-20', match: true },
                { field: 'Total Amount', poValue: '$23,200.00', invoiceValue: '$23,200.00', match: true },
                { field: 'Currency', poValue: 'USD', invoiceValue: 'USD', match: true },
                { field: 'Payment Terms', poValue: 'Net 60', invoiceValue: 'Net 60', match: true },
                { field: 'Shipping Address', poValue: '789 Pine Rd, TX', invoiceValue: '789 Pine Rd, TX', match: true },
                { field: 'Tax Amount', poValue: '$2,320.00', invoiceValue: '$2,320.00', match: true }
              ]
            },
            { 
              id: 4, 
              invoice: 'INV-2024-004', 
              po: 'PO-2024-159', 
              vendor: 'MDC Business Management (ADNOC)', 
              amount: 12890, 
              status: 'warning', 
              score: 62,
              source: 'Email Integration',
              fieldComparisons: [
                { field: 'PO Number', poValue: 'PO-2024-159', invoiceValue: 'PO-2024-159', match: true },
                { field: 'Vendor Name', poValue: 'MDC Business Management (ADNOC)', invoiceValue: 'MDC Business Management', match: false },
                { field: 'Invoice Date', poValue: '2024-01-22', invoiceValue: '2024-01-25', match: false },
                { field: 'Total Amount', poValue: '$12,890.00', invoiceValue: '$12,990.00', match: false },
                { field: 'Currency', poValue: 'USD', invoiceValue: 'USD', match: true },
                { field: 'Payment Terms', poValue: 'Net 30', invoiceValue: 'Net 45', match: false },
                { field: 'Shipping Address', poValue: '321 Elm St, FL', invoiceValue: '321 Elm Street, FL', match: false },
                { field: 'Tax Amount', poValue: '$1,289.00', invoiceValue: '$1,299.00', match: false }
              ]
            },
            { 
              id: 5, 
              invoice: 'INV-2024-005', 
              po: 'PO-2024-160', 
              vendor: 'CFCE Integrated Facilities Management (ADNOC)', 
              amount: 45600, 
              status: 'success', 
              score: 100,
              source: 'Email Integration',
              fieldComparisons: [
                { field: 'PO Number', poValue: 'PO-2024-160', invoiceValue: 'PO-2024-160', match: true },
                { field: 'Vendor Name', poValue: 'CFCE Integrated Facilities Management (ADNOC)', invoiceValue: 'CFCE Integrated Facilities Management (ADNOC)', match: true },
                { field: 'Invoice Date', poValue: '2024-01-28', invoiceValue: '2024-01-28', match: true },
                { field: 'Total Amount', poValue: '$45,600.00', invoiceValue: '$45,600.00', match: true },
                { field: 'Currency', poValue: 'USD', invoiceValue: 'USD', match: true },
                { field: 'Payment Terms', poValue: 'Net 30', invoiceValue: 'Net 30', match: true },
                { field: 'Shipping Address', poValue: '555 Tech Blvd, WA', invoiceValue: '555 Tech Blvd, WA', match: true },
                { field: 'Tax Amount', poValue: '$4,560.00', invoiceValue: '$4,560.00', match: true }
              ]
            }
          ]);
          setCurrentStep('output');
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    }
  };

  const moveToDelivery = () => {
    setCurrentStep('delivery');
  };

  const resetWorkflow = () => {
    setCurrentStep('ingestion');
    setSelectedMethod(null);
    setUploadedFiles([]);
    setIsProcessing(false);
    setProgress(0);
    setProcessedResults([]);
    setSelectedResult(null);
    setShowModal(false);
    setCurrentPage(1);
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResults = processedResults.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedResults.length / itemsPerPage);

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const openComparisonModal = (result: ProcessedResult) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedResult(null);
  };

  const handleManualReview = () => {
    if (selectedResult) {
      setToastType('success');
      setToastMessage(`Manual review requested for ${selectedResult.invoice}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      closeModal();
    }
  };

  // Delivery configuration states
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [showMongoConfig, setShowMongoConfig] = useState(false);
  const [showRestApiConfig, setShowRestApiConfig] = useState(false);
  const [showErpConfig, setShowErpConfig] = useState(false);
  const [showSlackConfig, setShowSlackConfig] = useState(false);
  const [showTeamsConfig, setShowTeamsConfig] = useState(false);

  const [emailConfig, setEmailConfig] = useState({
    to: '',
    cc: '',
    subject: 'Invoice Validation Report',
    includePdf: true
  });
  const [emailConfigErrors, setEmailConfigErrors] = useState({ to: '', cc: '' });

  const [mongoConfig, setMongoConfig] = useState({
    connectionString: dbForm.connectionString || '',
    database: 'invoiceflow',
    collection: 'validationReports'
  });
  const [mongoConfigErrors, setMongoConfigErrors] = useState({ connectionString: '', database: '', collection: '' });

  const [restApiConfig, setRestApiConfig] = useState({
    url: '',
    method: 'POST',
    headers: '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_TOKEN"}'
  });
  const [restApiConfigErrors, setRestApiConfigErrors] = useState({ url: '', headers: '' });

  const [erpConfig, setErpConfig] = useState({
    system: '',
    apiUrl: '',
    apiKey: ''
  });
  const [erpConfigErrors, setErpConfigErrors] = useState({ system: '', apiUrl: '', apiKey: '' });

  const [slackConfig, setSlackConfig] = useState({
    webhookUrl: '',
    channel: '#invoice-reports'
  });
  const [slackConfigErrors, setSlackConfigErrors] = useState({ webhookUrl: '', channel: '' });

  const [teamsConfig, setTeamsConfig] = useState({
    webhookUrl: ''
  });
  const [teamsConfigErrors, setTeamsConfigErrors] = useState({ webhookUrl: '' });

  // Delivery Layer handlers
  const handleExportToERP = () => {
    setToastType('success');
    setToastMessage(`Exporting ${processedResults.length} invoices to ERP system...`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleGenerateReports = async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Create Excel export with detailed information
    const ws_data = [
      ['Invoice Number', 'PO Number', 'Vendor', 'Amount', 'Source', 'Score', 'Status', 'Issues'],
      ...processedResults.map(r => {
        const issues = r.status === 'warning' 
          ? r.fieldComparisons
              .filter(fc => !fc.match)
              .map(fc => `${fc.field}: PO="${fc.poValue}" vs Invoice="${fc.invoiceValue}"`)
              .join('; ')
          : 'None - All fields validated';
        
        return [r.invoice, r.po, r.vendor, r.amount, r.source, r.score + '%', r.status === 'success' ? 'Matched' : 'Review Required', issues];
      })
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Invoice Number
      { wch: 15 }, // PO Number
      { wch: 30 }, // Vendor
      { wch: 12 }, // Amount
      { wch: 15 }, // Source
      { wch: 8 },  // Score
      { wch: 15 }, // Status
      { wch: 60 }  // Issues
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice Validation Report');
    XLSX.writeFile(wb, `Invoice_Validation_Report_${timestamp}.xlsx`);
    
    // Create PDF export
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138); // Blue color
    doc.text('Invoice Validation Report', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    
    // Add summary statistics
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics', 14, 38);
    doc.setFontSize(10);
    doc.text(`Total Invoices: ${processedResults.length}`, 14, 45);
    doc.text(`Successfully Matched: ${processedResults.filter(r => r.status === 'success').length}`, 14, 52);
    doc.text(`Requires Review: ${processedResults.filter(r => r.status === 'warning').length}`, 14, 59);
    doc.text(`Success Rate: ${Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%`, 14, 66);
    
    // Add table with issues column
    autoTable(doc, {
      startY: 75,
      head: [['Invoice', 'PO', 'Vendor', 'Amount', 'Score', 'Status', 'Issues']],
      body: processedResults.map(r => {
        const issues = r.status === 'warning' 
          ? r.fieldComparisons
              .filter(fc => !fc.match)
              .map(fc => `${fc.field}`)
              .join(', ')
          : 'None';
        
        return [
          r.invoice,
          r.po,
          r.vendor,
          `$${r.amount.toLocaleString()}`,
          `${r.score}%`,
          r.status === 'success' ? 'Matched' : 'Review',
          issues
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 30 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 18 },
        6: { cellWidth: 50 }
      }
    });
    
    // Add detailed issues on new pages if there are warnings
    const warningResults = processedResults.filter(r => r.status === 'warning');
    if (warningResults.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('Detailed Mismatch Analysis', 14, 20);
      
      let yPos = 35;
      warningResults.forEach((result, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. Invoice ${result.invoice} - Score: ${result.score}%`, 14, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`PO: ${result.po} | Vendor: ${result.vendor}`, 14, yPos);
        yPos += 10;
        
        const mismatches = result.fieldComparisons.filter(fc => !fc.match);
        mismatches.forEach((mismatch, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(9);
          doc.setTextColor(220, 38, 38); // Red color
          doc.text(`• ${mismatch.field}:`, 18, yPos);
          yPos += 5;
          doc.setTextColor(100, 100, 100);
          doc.text(`  PO: ${mismatch.poValue}`, 20, yPos);
          yPos += 5;
          doc.text(`  Invoice: ${mismatch.invoiceValue}`, 20, yPos);
          yPos += 7;
        });
        
        yPos += 5;
      });
    }
    
    // Create zip file with both reports
    const zip = new JSZip();
    
    // Add Excel file to zip
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Add PDF file to zip
    const pdfBlob = doc.output('blob');
    
    // Add files to zip
    zip.file(`Invoice_Validation_Report_${timestamp}.xlsx`, excelBlob);
    zip.file(`Invoice_Validation_Report_${timestamp}.pdf`, pdfBlob);
    
    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `Invoice_Validation_Reports_${timestamp}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    setToastType('success');
    setToastMessage('Reports package downloaded successfully! (PDF + Excel in ZIP)');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleMongoDBShare = () => {
    // Check if MongoDB is already connected
    if (!dbForm.connectionString) {
      // Show MongoDB configuration modal
      setShowMongoConfig(true);
    } else {
      // If connected, proceed with saving
      saveToMongoDB();
    }
  };

  const saveToMongoDB = async () => {
    setToastType('success');
    setToastMessage('Saving validation report to MongoDB...');
    setShowToast(true);
    
    // Create comprehensive report document
    const report = {
      reportId: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalInvoices: processedResults.length,
        successfullyMatched: processedResults.filter(r => r.status === 'success').length,
        requiresReview: processedResults.filter(r => r.status === 'warning').length,
        successRate: Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100),
        totalValue: processedResults.reduce((sum, r) => sum + r.amount, 0)
      },
      invoices: processedResults.map(result => ({
        invoiceNumber: result.invoice,
        poNumber: result.po,
        vendor: result.vendor,
        amount: result.amount,
        source: result.source,
        matchScore: result.score,
        status: result.status,
        validationDetails: result.fieldComparisons.map(fc => ({
          field: fc.field,
          poValue: fc.poValue,
          invoiceValue: fc.invoiceValue,
          isMatch: fc.match
        })),
        issues: result.fieldComparisons
          .filter(fc => !fc.match)
          .map(fc => `${fc.field}: PO="${fc.poValue}" vs Invoice="${fc.invoiceValue}"`)
      }))
    };

    try {
      // Call API to save report to MongoDB
      const response = await fetch('/api/mongodb/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: mongoConfig.connectionString,
          database: mongoConfig.database,
          collection: mongoConfig.collection,
          report
        })
      });

      const data = await response.json();
      
      setShowToast(false);
      
      if (data.success) {
        setToastType('success');
        setToastMessage(`Successfully saved validation report with ${processedResults.length} invoices to MongoDB collection: ${mongoConfig.collection}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setShowMongoConfig(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      setShowToast(false);
      setToastType('error');
      setToastMessage(error.message || 'Failed to save report to MongoDB');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const validateRestApiConfig = () => {
    const errors = { url: '', headers: '' };
    let isValid = true;

    if (!restApiConfig.url) {
      errors.url = 'API URL is required';
      isValid = false;
    } else if (!restApiConfig.url.startsWith('http://') && !restApiConfig.url.startsWith('https://')) {
      errors.url = 'URL must start with http:// or https://';
      isValid = false;
    }

    if (restApiConfig.headers) {
      try {
        JSON.parse(restApiConfig.headers);
      } catch (e) {
        errors.headers = 'Headers must be valid JSON';
        isValid = false;
      }
    }

    setRestApiConfigErrors(errors);
    return isValid;
  };

  const handleSendToRestApi = async () => {
    if (!validateRestApiConfig()) {
      return;
    }

    // Create comprehensive report
    const report = {
      reportId: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalInvoices: processedResults.length,
        successfullyMatched: processedResults.filter(r => r.status === 'success').length,
        requiresReview: processedResults.filter(r => r.status === 'warning').length,
        successRate: Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100),
        totalValue: processedResults.reduce((sum, r) => sum + r.amount, 0)
      },
      invoices: processedResults.map(result => ({
        invoiceNumber: result.invoice,
        poNumber: result.po,
        vendor: result.vendor,
        amount: result.amount,
        source: result.source,
        matchScore: result.score,
        status: result.status,
        validationDetails: result.fieldComparisons.map(fc => ({
          field: fc.field,
          poValue: fc.poValue,
          invoiceValue: fc.invoiceValue,
          isMatch: fc.match
        })),
        issues: result.fieldComparisons
          .filter(fc => !fc.match)
          .map(fc => `${fc.field}: PO="${fc.poValue}" vs Invoice="${fc.invoiceValue}"`)
      }))
    };

    try {
      const headers = JSON.parse(restApiConfig.headers);
      
      setToastType('success');
      setToastMessage('Sending report to API endpoint...');
      setShowToast(true);

      // Simulate API call (in production, this would be a real API call)
      setTimeout(() => {
        setShowToast(false);
        setShowRestApiConfig(false);
        setToastType('success');
        setToastMessage(`Successfully sent report to ${restApiConfig.url}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }, 1500);

    } catch (error: any) {
      setToastType('error');
      setToastMessage(error.message || 'Failed to send report to API');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const validateSlackConfig = () => {
    const errors = { webhookUrl: '', channel: '' };
    let isValid = true;

    if (!slackConfig.webhookUrl) {
      errors.webhookUrl = 'Slack webhook URL is required';
      isValid = false;
    } else if (!slackConfig.webhookUrl.startsWith('https://hooks.slack.com/')) {
      errors.webhookUrl = 'Invalid Slack webhook URL format';
      isValid = false;
    }

    if (!slackConfig.channel) {
      errors.channel = 'Channel name is required';
      isValid = false;
    } else if (!slackConfig.channel.startsWith('#') && !slackConfig.channel.startsWith('@')) {
      errors.channel = 'Channel must start with # or @';
      isValid = false;
    }

    setSlackConfigErrors(errors);
    return isValid;
  };

  const handleSendToSlack = async () => {
    if (!validateSlackConfig()) {
      return;
    }

    const summary = {
      text: "📊 Invoice Validation Report",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📊 Invoice Validation Report",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Total Invoices:*\n${processedResults.length}`
            },
            {
              type: "mrkdwn",
              text: `*Successfully Matched:*\n${processedResults.filter(r => r.status === 'success').length}`
            },
            {
              type: "mrkdwn",
              text: `*Requires Review:*\n${processedResults.filter(r => r.status === 'warning').length}`
            },
            {
              type: "mrkdwn",
              text: `*Success Rate:*\n${Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Total Value:*\n$${processedResults.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}`
            },
            {
              type: "mrkdwn",
              text: `*Generated:*\n${new Date().toLocaleString()}`
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "Automated report from InvoiceFlow • Click to view full details"
            }
          ]
        }
      ]
    };

    try {
      setToastType('success');
      setToastMessage('Sending report to Slack...');
      setShowToast(true);

      // Simulate API call (in production, send to webhook)
      setTimeout(() => {
        setShowToast(false);
        setShowSlackConfig(false);
        setToastType('success');
        setToastMessage(`Successfully posted report to ${slackConfig.channel}!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }, 1500);
    } catch (error: any) {
      setToastType('error');
      setToastMessage(error.message || 'Failed to send report to Slack');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const validateTeamsConfig = () => {
    const errors = { webhookUrl: '' };
    let isValid = true;

    if (!teamsConfig.webhookUrl) {
      errors.webhookUrl = 'Teams webhook URL is required';
      isValid = false;
    } else if (!teamsConfig.webhookUrl.startsWith('https://')) {
      errors.webhookUrl = 'Webhook URL must start with https://';
      isValid = false;
    }

    setTeamsConfigErrors(errors);
    return isValid;
  };

  const handleSendToTeams = async () => {
    if (!validateTeamsConfig()) {
      return;
    }

    const card = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": "Invoice Validation Report",
      "themeColor": "6264A7",
      "title": "📊 Invoice Validation Report",
      "sections": [
        {
          "activityTitle": "Validation Summary",
          "activitySubtitle": new Date().toLocaleString(),
          "facts": [
            {
              "name": "Total Invoices:",
              "value": processedResults.length.toString()
            },
            {
              "name": "Successfully Matched:",
              "value": processedResults.filter(r => r.status === 'success').length.toString()
            },
            {
              "name": "Requires Review:",
              "value": processedResults.filter(r => r.status === 'warning').length.toString()
            },
            {
              "name": "Success Rate:",
              "value": `${Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%`
            },
            {
              "name": "Total Value:",
              "value": `$${processedResults.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}`
            }
          ]
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenUri",
          "name": "View Full Report",
          "targets": [
            {
              "os": "default",
              "uri": window.location.href
            }
          ]
        }
      ]
    };

    try {
      setToastType('success');
      setToastMessage('Sending report to Teams...');
      setShowToast(true);

      // Simulate API call (in production, send to webhook)
      setTimeout(() => {
        setShowToast(false);
        setShowTeamsConfig(false);
        setToastType('success');
        setToastMessage('Successfully posted report to Microsoft Teams!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }, 1500);
    } catch (error: any) {
      setToastType('error');
      setToastMessage(error.message || 'Failed to send report to Teams');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEmailNotifications = () => {
    setShowEmailConfig(true);
  };

  const validateEmailConfig = () => {
    const errors = { to: '', cc: '' };
    let isValid = true;

    if (!emailConfig.to) {
      errors.to = 'Recipient email is required';
      isValid = false;
    } else if (!validateEmail(emailConfig.to)) {
      errors.to = 'Please enter a valid email address';
      isValid = false;
    }

    if (emailConfig.cc && !validateEmail(emailConfig.cc)) {
      errors.cc = 'Please enter a valid CC email address';
      isValid = false;
    }

    setEmailConfigErrors(errors);
    return isValid;
  };

  const handleSendEmail = async () => {
    if (!validateEmailConfig()) {
      return;
    }

    // Generate PDF report
    const timestamp = new Date().toISOString().split('T')[0];
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text('Invoice Validation Report', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    
    // Add summary
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics', 14, 38);
    doc.setFontSize(10);
    doc.text(`Total Invoices: ${processedResults.length}`, 14, 45);
    doc.text(`Successfully Matched: ${processedResults.filter(r => r.status === 'success').length}`, 14, 52);
    doc.text(`Requires Review: ${processedResults.filter(r => r.status === 'warning').length}`, 14, 59);
    doc.text(`Success Rate: ${Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%`, 14, 66);
    
    // Add table
    autoTable(doc, {
      startY: 75,
      head: [['Invoice', 'PO', 'Vendor', 'Amount', 'Score', 'Status', 'Issues']],
      body: processedResults.map(r => {
        const issues = r.status === 'warning' 
          ? r.fieldComparisons.filter(fc => !fc.match).map(fc => fc.field).join(', ')
          : 'None';
        
        return [r.invoice, r.po, r.vendor, `$${r.amount.toLocaleString()}`, `${r.score}%`, 
                r.status === 'success' ? 'Matched' : 'Review', issues];
      }),
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 22 }, 2: { cellWidth: 30 },
        3: { halign: 'right', cellWidth: 20 }, 4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 18 }, 6: { cellWidth: 50 }
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(pdfBlob);
    });

    // Create email summary
    const summary = `
Invoice Validation Report - ${new Date().toLocaleDateString()}

SUMMARY:
• Total Invoices: ${processedResults.length}
• Successfully Matched: ${processedResults.filter(r => r.status === 'success').length}
• Requires Review: ${processedResults.filter(r => r.status === 'warning').length}
• Success Rate: ${Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%
• Total Value: $${processedResults.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}

Please find the detailed validation report attached as PDF.

---
This is an automated report from InvoiceFlow
    `.trim();

    // In a real application, this would call an API to send the email
    // For now, we'll simulate it with a mailto link
    const mailtoLink = `mailto:${emailConfig.to}?${emailConfig.cc ? `cc=${emailConfig.cc}&` : ''}subject=${encodeURIComponent(emailConfig.subject)}&body=${encodeURIComponent(summary)}`;
    
    // Show success message
    setShowEmailConfig(false);
    setToastType('success');
    setToastMessage(`Email with PDF report sent to ${emailConfig.to}!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Note: In production, you would send the email via backend API
    // window.open(mailtoLink); // This would open the default email client
  };

  const handleConfigureWebhook = () => {
    setToastType('success');
    setToastMessage('REST API Webhook configuration opened');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDatabaseSync = () => {
    setToastType('success');
    setToastMessage('Database sync configuration opened');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleScheduleDelivery = () => {
    setToastType('success');
    setToastMessage('Delivery scheduled for next business day');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmitAndDeliver = () => {
    // Save to localStorage with timestamp and truly unique IDs
    const savedWorkflows = localStorage.getItem('processedWorkflows');
    const existingWorkflows = savedWorkflows ? JSON.parse(savedWorkflows) : [];
    
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Generate truly unique IDs using timestamp to avoid collisions
    const baseId = Date.now();
    const workflowsWithDate = processedResults.map((result, index) => {
      // Create a new object without the old id, then add the new unique id
      const { id, ...resultWithoutId } = result;
      return {
        ...resultWithoutId,
        id: baseId + index,
        processedDate: timestamp
      };
    });
    
    localStorage.setItem('processedWorkflows', JSON.stringify([...workflowsWithDate, ...existingWorkflows]));
    
    setToastType('success');
    setToastMessage(`Successfully submitted ${processedResults.length} validated invoices!`);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      resetWorkflow();
    }, 3000);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmailForm = () => {
    const errors = {
      email: '',
      server: '',
      port: '',
      folder: ''
    };
    let isValid = true;

    if (!emailForm.email) {
      errors.email = 'Please enter your email address';
      isValid = false;
    } else if (!validateEmail(emailForm.email)) {
      errors.email = 'Please enter a valid email address (e.g., invoices@company.com)';
      isValid = false;
    }

    if (!emailForm.server) {
      errors.server = 'Please enter your email server address (e.g., imap.gmail.com)';
      isValid = false;
    }

    if (!emailForm.port) {
      errors.port = 'Please enter the IMAP port number (usually 993 for SSL)';
      isValid = false;
    } else if (isNaN(Number(emailForm.port)) || Number(emailForm.port) < 1 || Number(emailForm.port) > 65535) {
      errors.port = 'Port must be a valid number between 1 and 65535';
      isValid = false;
    }

    if (!emailForm.folder) {
      errors.folder = 'Please enter the folder name (e.g., INBOX)';
      isValid = false;
    }

    setEmailErrors(errors);
    return isValid;
  };

  const handleTestEmailConnection = () => {
    if (!validateEmailForm()) {
      setToastType('error');
      setToastMessage('Please fix validation errors');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    // Simulate API call
    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionStatus('success');
      setToastType('success');
      setToastMessage('Email connection successful! Opening inbox...');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setConnectionStatus('idle');
        // Open email selection modal
        setShowEmailModal(true);
      }, 1500);
    }, 2000);
  };

  // Simulated email inbox data
  const emailInbox = [
    {
      id: 'email-1',
      from: 'invoices@seashell.ae',
      subject: '[Auto-Forwarded] Invoice INV-2024-001 - Sea Shell',
      date: '2024-02-20 10:30 AM',
      hasAttachment: true,
      isAutoForwarded: true,
      matchesCriteria: true,
      preview: 'Invoice for maintenance services - Amount: AED 15,750.00'
    },
    {
      id: 'email-2',
      from: 'billing@etisalat.ae',
      subject: '[Auto-Forwarded] Monthly Invoice - Etisalat Services',
      date: '2024-02-20 09:15 AM',
      hasAttachment: true,
      isAutoForwarded: true,
      matchesCriteria: true,
      preview: 'Telecommunications invoice - Amount: AED 8,450.00'
    },
    {
      id: 'email-3',
      from: 'accounts@adnoc.ae',
      subject: '[Auto-Forwarded] INV-2024-003 - ADNOC Supply',
      date: '2024-02-19 02:45 PM',
      hasAttachment: true,
      isAutoForwarded: true,
      matchesCriteria: true,
      preview: 'Fuel and energy supply invoice - Amount: AED 23,200.00'
    },
    {
      id: 'email-4',
      from: 'newsletter@company.com',
      subject: 'Weekly Newsletter - Company Updates',
      date: '2024-02-19 01:20 PM',
      hasAttachment: false,
      isAutoForwarded: false,
      matchesCriteria: false,
      preview: 'This week in company news...'
    },
    {
      id: 'email-5',
      from: 'support@vendor.com',
      subject: 'Re: Support Ticket #12345',
      date: '2024-02-18 04:30 PM',
      hasAttachment: false,
      isAutoForwarded: false,
      matchesCriteria: false,
      preview: 'Your support ticket has been resolved...'
    },
    {
      id: 'email-6',
      from: 'invoices@mdcadnoc.ae',
      subject: '[Auto-Forwarded] Invoice - MDC Business Management',
      date: '2024-02-18 11:00 AM',
      hasAttachment: true,
      isAutoForwarded: true,
      matchesCriteria: true,
      preview: 'Facility management services - Amount: AED 12,890.00'
    },
    {
      id: 'email-7',
      from: 'marketing@ads.com',
      subject: 'Special Offer Just For You!',
      date: '2024-02-17 03:15 PM',
      hasAttachment: false,
      isAutoForwarded: false,
      matchesCriteria: false,
      preview: 'Limited time offer...'
    }
  ];

  const handleEmailSelect = (emailId: string) => {
    const email = emailInbox.find(e => e.id === emailId);
    if (email && email.matchesCriteria) {
      setSelectedEmailId(emailId);
      setShowEmailModal(false);
      
      // Show processing toast
      setToastType('success');
      setToastMessage(`Extracting invoice data from email: ${email.subject}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
      
      // Continue to processing immediately
      setTimeout(() => {
        startProcessing();
      }, 800);
    }
  };

  const validateDbForm = () => {
    const errors = {
      connectionString: ''
    };
    let isValid = true;

    if (!dbForm.connectionString) {
      errors.connectionString = 'MongoDB connection string is required';
      isValid = false;
    } else if (dbForm.connectionString.length < 15) {
      errors.connectionString = 'Connection string appears too short. Use format: mongodb://host:port';
      isValid = false;
    } else if (!dbForm.connectionString.startsWith('mongodb://') && !dbForm.connectionString.startsWith('mongodb+srv://')) {
      errors.connectionString = 'Connection string must start with mongodb:// or mongodb+srv://';
      isValid = false;
    }

    setDbErrors(errors);
    return isValid;
  };

  const validateAzureForm = () => {
    const errors = {
      accountName: '',
      accessKey: '',
      containerName: ''
    };
    let isValid = true;

    if (!azureForm.accountName) {
      errors.accountName = 'Storage account name is required';
      isValid = false;
    }

    if (!azureForm.accessKey) {
      errors.accessKey = 'Access key is required';
      isValid = false;
    } else if (azureForm.accessKey.length < 20) {
      errors.accessKey = 'Access key appears too short';
      isValid = false;
    }

    if (!azureForm.containerName) {
      errors.containerName = 'Container name is required';
      isValid = false;
    }

    setAzureErrors(errors);
    return isValid;
  };

  const handleTestAzureConnection = () => {
    if (!validateAzureForm()) {
      setToastType('error');
      setToastMessage('Please fill in all required fields');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    // Simulate Azure connection test
    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionStatus('success');
      setToastType('success');
      setToastMessage('Azure Storage connection successful!');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setConnectionStatus('idle');
      }, 2000);
    }, 2000);
  };

  const validateFusionForm = () => {
    const errors = {
      instanceUrl: '',
      username: '',
      password: ''
    };
    let isValid = true;

    if (!fusionForm.instanceUrl) {
      errors.instanceUrl = 'Instance URL is required';
      isValid = false;
    } else if (!fusionForm.instanceUrl.startsWith('https://')) {
      errors.instanceUrl = 'Instance URL must start with https://';
      isValid = false;
    }

    if (!fusionForm.username) {
      errors.username = 'Username is required';
      isValid = false;
    }

    if (!fusionForm.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFusionErrors(errors);
    return isValid;
  };

  const handleTestFusionConnection = () => {
    if (!validateFusionForm()) {
      setToastType('error');
      setToastMessage('Please fill in all required fields');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    // Simulate Fusion connection test
    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionStatus('success');
      setToastType('success');
      setToastMessage('Fusion ERM connection successful!');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setConnectionStatus('idle');
      }, 2000);
    }, 2000);
  };

  const handleTestDbConnection = async () => {
    // Require explicit connection string for testing
    if (!dbForm.connectionString) {
      setToastType('error');
      setToastMessage('Please enter a MongoDB connection string');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }
    
    // Validate format
    if (!validateDbForm()) {
      setToastType('error');
      setToastMessage('Please check your connection string format');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const response = await fetch('/api/mongodb/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: dbForm.connectionString })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsTestingConnection(false);
        setConnectionStatus('success');
        setToastType('success');
        setToastMessage('MongoDB connection successful!');
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          setConnectionStatus('idle');
        }, 2000);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      setIsTestingConnection(false);
      setConnectionStatus('error');
      setToastType('error');
      setToastMessage(error.message || 'Failed to connect to MongoDB');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setConnectionStatus('idle');
      }, 2000);
    }
  };

  const matchInvoiceWithPO = (invoice: any, po: any) => {
    // Normalize field names (support both camelCase and Title Case from Excel)
    const getField = (obj: any, ...keys: string[]) => {
      for (const key of keys) {
        if (obj[key] !== undefined) return obj[key];
      }
      return '';
    };

    const poNum = getField(po, 'poNumber', 'PO Number');
    const invPoNum = getField(invoice, 'poNumber', 'PO Number');
    const poVendor = getField(po, 'vendorName', 'Vendor Name');
    const invVendor = getField(invoice, 'vendorName', 'Vendor Name');
    const poDate = getField(po, 'date', 'Date', 'invoiceDate', 'Invoice Date');
    const invDate = getField(invoice, 'invoiceDate', 'Invoice Date', 'date', 'Date');
    const poAmount = parseFloat(getField(po, 'totalAmount', 'Total Amount') || 0);
    const invAmount = parseFloat(getField(invoice, 'totalAmount', 'Total Amount') || 0);
    const poCurrency = getField(po, 'currency', 'Currency');
    const invCurrency = getField(invoice, 'currency', 'Currency');
    const poTerms = getField(po, 'paymentTerms', 'Payment Terms');
    const invTerms = getField(invoice, 'paymentTerms', 'Payment Terms');
    const poAddress = getField(po, 'shippingAddress', 'Shipping Address');
    const invAddress = getField(invoice, 'shippingAddress', 'Shipping Address');
    const poTax = parseFloat(getField(po, 'taxAmount', 'Tax Amount') || 0);
    const invTax = parseFloat(getField(invoice, 'taxAmount', 'Tax Amount') || 0);

    const comparisons: FieldComparison[] = [
      {
        field: 'PO Number',
        poValue: poNum,
        invoiceValue: invPoNum,
        match: poNum === invPoNum
      },
      {
        field: 'Vendor Name',
        poValue: poVendor,
        invoiceValue: invVendor,
        match: poVendor === invVendor
      },
      {
        field: 'Invoice Date',
        poValue: poDate,
        invoiceValue: invDate,
        match: poDate === invDate
      },
      {
        field: 'Total Amount',
        poValue: `$${poAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        invoiceValue: `$${invAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        match: Math.abs(poAmount - invAmount) < 0.01
      },
      {
        field: 'Currency',
        poValue: poCurrency,
        invoiceValue: invCurrency,
        match: poCurrency === invCurrency
      },
      {
        field: 'Payment Terms',
        poValue: poTerms,
        invoiceValue: invTerms,
        match: poTerms === invTerms
      },
      {
        field: 'Shipping Address',
        poValue: poAddress,
        invoiceValue: invAddress,
        match: poAddress === invAddress
      },
      {
        field: 'Tax Amount',
        poValue: `$${poTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        invoiceValue: `$${invTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        match: Math.abs(poTax - invTax) < 0.01
      }
    ];

    const matchCount = comparisons.filter(c => c.match).length;
    const score = Math.round((matchCount / comparisons.length) * 100);
    // If even 1 field fails validation, mark as warning (requires review)
    const status: 'success' | 'warning' = matchCount === comparisons.length ? 'success' : 'warning';

    return {
      comparisons,
      score,
      status
    };
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Sidebar 
        workflowCount={processedResults.length}
      />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Invoice Processing Workflow</h1>
          <p className="text-slate-600 mt-1">Complete pipeline from data ingestion to validation results</p>
        </div>

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

        {/* Progress Steps */}
        <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-slate-200 p-8 mb-8 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative">
            {/* Steps Container */}
            <div className="flex items-center justify-between mb-6">
              {/* Step 1: Data Ingestion */}
              <div className="flex flex-col items-center flex-1 group">
                <div className={`relative transition-all duration-500 ${
                  currentStep === 'ingestion' ? 'scale-110' : ''
                }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-all duration-500 ${
                    currentStep !== 'ingestion' 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50' 
                      : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/50 animate-pulse'
                  }`}>
                    {currentStep !== 'ingestion' ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  {currentStep === 'ingestion' && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 animate-ping opacity-20"></div>
                  )}
                </div>
                <div className={`mt-3 text-center transition-all duration-300 ${
                  currentStep === 'ingestion' ? 'opacity-100' : 'opacity-60'
                }`}>
                  <p className="font-bold text-slate-900 text-sm">Data Ingestion</p>
                  <p className="text-xs text-slate-600 mt-0.5">Import & Upload</p>
                </div>
              </div>

              {/* Connector 1 */}
              <div className="flex-1 flex items-center px-4 -mt-8">
                <div className="w-full relative h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                    currentStep !== 'ingestion' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-full' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 w-0'
                  }`}></div>
                </div>
              </div>

              {/* Step 2: AI Processing Engine */}
              <div className="flex flex-col items-center flex-1 group">
                <div className={`relative transition-all duration-500 ${
                  currentStep === 'processing' ? 'scale-110' : ''
                }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-all duration-500 ${
                    currentStep === 'output' || currentStep === 'delivery'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50'
                      : currentStep === 'processing' 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/50 animate-pulse' 
                        : 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30'
                  }`}>
                    {currentStep === 'output' || currentStep === 'delivery' ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>
                  {currentStep === 'processing' && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 animate-ping opacity-20"></div>
                  )}
                </div>
                <div className={`mt-3 text-center transition-all duration-300 ${
                  currentStep === 'processing' ? 'opacity-100' : 'opacity-60'
                }`}>
                  <p className="font-bold text-slate-900 text-sm">AI Processing</p>
                  <p className="text-xs text-slate-600 mt-0.5">Analysis & Match</p>
                </div>
              </div>

              {/* Connector 2 */}
              <div className="flex-1 flex items-center px-4 -mt-8">
                <div className="w-full relative h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                    currentStep === 'output' || currentStep === 'delivery'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-full' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 w-0'
                  }`}></div>
                </div>
              </div>

              {/* Step 3: Output Layer */}
              <div className="flex flex-col items-center flex-1 group">
                <div className={`relative transition-all duration-500 ${
                  currentStep === 'output' ? 'scale-110' : ''
                }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-all duration-500 ${
                    currentStep === 'delivery'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/50'
                      : currentStep === 'output' 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/50 animate-pulse' 
                        : 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30'
                  }`}>
                    {currentStep === 'delivery' ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  {currentStep === 'output' && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 animate-ping opacity-20"></div>
                  )}
                </div>
                <div className={`mt-3 text-center transition-all duration-300 ${
                  currentStep === 'output' ? 'opacity-100' : 'opacity-60'
                }`}>
                  <p className="font-bold text-slate-900 text-sm">Output Layer</p>
                  <p className="text-xs text-slate-600 mt-0.5">Review Results</p>
                </div>
              </div>

              {/* Connector 3 */}
              <div className="flex-1 flex items-center px-4 -mt-8">
                <div className="w-full relative h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                    currentStep === 'delivery'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-full' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 w-0'
                  }`}></div>
                </div>
              </div>

              {/* Step 4: Delivery Layer */}
              <div className="flex flex-col items-center flex-1 group">
                <div className={`relative transition-all duration-500 ${
                  currentStep === 'delivery' ? 'scale-110' : ''
                }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-all duration-500 ${
                    currentStep === 'delivery' 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/50 animate-pulse' 
                      : 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30'
                  }`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  {currentStep === 'delivery' && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 animate-ping opacity-20"></div>
                  )}
                </div>
                <div className={`mt-3 text-center transition-all duration-300 ${
                  currentStep === 'delivery' ? 'opacity-100' : 'opacity-60'
                }`}>
                  <p className="font-bold text-slate-900 text-sm">Delivery Layer</p>
                  <p className="text-xs text-slate-600 mt-0.5">Export & Share</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: currentStep === 'ingestion' ? '0%' : 
                         currentStep === 'processing' ? '33%' : 
                         currentStep === 'output' ? '66%' : '100%' 
                }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* INGESTION STEP */}
          {currentStep === 'ingestion' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Select Data Source</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {ingestionMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      if (method.id === 'email') {
                        setShowEmailModal(true);
                      } else {
                        setSelectedMethod(method.id as IngestionMethod);
                      }
                    }}
                    className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${method.color} flex items-center justify-center text-3xl mb-4 mx-auto`}>
                      {method.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">{method.name}</h3>
                    <p className="text-sm text-slate-600 text-center">{method.description}</p>
                    {selectedMethod === method.id && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>


              {selectedMethod === 'excel' && (
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-8">
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Excel Sheet Upload</h3>
                      <p className="text-sm text-slate-600">Upload an Excel file with invoices and purchase orders</p>
                    </div>

                    <div className="border-2 border-dashed border-emerald-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer bg-white max-w-2xl mx-auto">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelUpload}
                        className="hidden"
                        id="excel-upload"
                      />
                      <label htmlFor="excel-upload" className="cursor-pointer">
                        <div className="text-5xl mb-3">📋</div>
                        <p className="text-lg font-medium text-slate-900 mb-2">Drop Excel file here or click to browse</p>
                        <p className="text-sm text-slate-600 mb-4">Supported formats: .xlsx, .xls</p>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-left">
                          <p className="text-xs font-bold text-emerald-900 mb-1">📝 Excel Format Requirements:</p>
                          <ul className="text-xs text-emerald-800 space-y-1">
                            <li>• <strong>Sheet 1:</strong> Invoices (Invoice Number, PO Number, Vendor Name, Invoice Date, Total Amount, Currency, Payment Terms, Shipping Address, Tax Amount)</li>
                            <li>• <strong>Sheet 2:</strong> Purchase Orders (PO Number, Vendor Name, Date, Total Amount, Currency, Payment Terms, Shipping Address, Tax Amount)</li>
                          </ul>
                        </div>
                      </label>
                    </div>

                    {uploadedFiles.length > 0 && excelData && (
                      <div className="mt-6 max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg p-4 border-2 border-emerald-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">✅</span>
                              <span className="text-sm text-slate-900 font-medium">{uploadedFiles[0]}</span>
                            </div>
                            <span className="text-xs text-emerald-600 font-medium px-3 py-1 bg-emerald-50 rounded-full">Loaded</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 rounded-lg p-3 text-center">
                              <p className="text-2xl font-bold text-emerald-600">{excelData.invoices.length}</p>
                              <p className="text-xs text-slate-600 mt-1">Invoices</p>
                            </div>
                            <div className="bg-teal-50 rounded-lg p-3 text-center">
                              <p className="text-2xl font-bold text-teal-600">{excelData.purchaseOrders.length}</p>
                              <p className="text-xs text-slate-600 mt-1">Purchase Orders</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedMethod === 'pdf' && (
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-8">
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">PDF Document Upload</h3>
                      <p className="text-sm text-slate-600">Upload invoice and purchase order PDF files</p>
                    </div>

                    <div className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center hover:border-red-500 transition-colors cursor-pointer bg-white max-w-2xl mx-auto">
                      <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-5xl mb-3">📁</div>
                        <p className="text-lg font-medium text-slate-900 mb-2">Drop PDF files here or click to browse</p>
                        <p className="text-sm text-slate-600 mb-4">Upload multiple invoice and PO documents</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                          <p className="text-xs font-bold text-red-900 mb-1">📝 PDF Processing:</p>
                          <ul className="text-xs text-red-800 space-y-1">
                            <li>• <strong>AI-Powered:</strong> Automatic text extraction and data recognition</li>
                            <li>• <strong>OCR Support:</strong> Works with scanned documents</li>
                            <li>• <strong>Multi-Format:</strong> Handles various invoice and PO templates</li>
                          </ul>
                        </div>
                      </label>
                    </div>

                    {uploadedFiles.length > 0 && pdfData && (
                      <div className="mt-6 max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                          <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Files Processed ({uploadedFiles.length})
                          </h4>
                          <div className="space-y-2 mb-4">
                            {uploadedFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl">📄</span>
                                  <span className="text-xs text-slate-900 font-medium truncate">{file}</span>
                                </div>
                                <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-full">✓ Extracted</span>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                              <p className="text-2xl font-bold text-red-600">{pdfData.invoices.length}</p>
                              <p className="text-xs text-slate-600 mt-1">Invoices Found</p>
                            </div>
                            <div className="bg-rose-50 rounded-lg p-3 text-center">
                              <p className="text-2xl font-bold text-rose-600">{pdfData.purchaseOrders.length}</p>
                              <p className="text-xs text-slate-600 mt-1">Purchase Orders</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MongoDB Configuration */}
              {selectedMethod === 'mongodb' && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-8 mb-6">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🗄️</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">MongoDB Connection</h3>
                    <p className="text-sm text-slate-600">Connect to your MongoDB database</p>
                  </div>
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Connection String
                      </label>
                      <input
                        type="text"
                        placeholder="mongodb://localhost:27017"
                        value={dbForm.connectionString}
                        onChange={(e) => setDbForm({...dbForm, connectionString: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 bg-white ${
                          dbErrors.connectionString ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {dbErrors.connectionString ? (
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {dbErrors.connectionString}
                        </p>
                      ) : (
                        <p className="text-slate-500 text-xs mt-1">
                          💡 Examples: <code className="bg-slate-100 px-2 py-0.5 rounded">mongodb://localhost:27017</code> or <code className="bg-slate-100 px-2 py-0.5 rounded">mongodb+srv://user:pass@cluster.mongodb.net</code>
                        </p>
                      )}
                    </div>

                    {connectionStatus === 'success' && (
                      <div className="flex items-center space-x-2 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">Connection successful!</span>
                      </div>
                    )}

                    <button 
                      onClick={handleTestDbConnection}
                      disabled={isTestingConnection}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors font-medium shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isTestingConnection ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Testing Connection...</span>
                        </>
                      ) : (
                        <span>Connect & Test MongoDB</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Azure Storage Configuration */}
              {selectedMethod === 'azure' && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-8 mb-6">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">☁️</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Azure Storage Connection</h3>
                    <p className="text-sm text-slate-600">Connect to Azure Blob Storage</p>
                  </div>
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Storage Account Name</label>
                      <input
                        type="text"
                        placeholder="mystorageaccount"
                        value={azureForm.accountName}
                        onChange={(e) => setAzureForm({...azureForm, accountName: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white ${
                          azureErrors.accountName ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {azureErrors.accountName && (
                        <p className="text-red-600 text-xs mt-1">{azureErrors.accountName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Access Key</label>
                      <input
                        type="password"
                        placeholder="Your storage account access key"
                        value={azureForm.accessKey}
                        onChange={(e) => setAzureForm({...azureForm, accessKey: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white ${
                          azureErrors.accessKey ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {azureErrors.accessKey && (
                        <p className="text-red-600 text-xs mt-1">{azureErrors.accessKey}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Container Name</label>
                      <input
                        type="text"
                        placeholder="invoices"
                        value={azureForm.containerName}
                        onChange={(e) => setAzureForm({...azureForm, containerName: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white ${
                          azureErrors.containerName ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {azureErrors.containerName && (
                        <p className="text-red-600 text-xs mt-1">{azureErrors.containerName}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-1">
                        💡 Blob container where invoice documents are stored
                      </p>
                    </div>

                    {connectionStatus === 'success' && (
                      <div className="flex items-center space-x-2 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">Connection successful!</span>
                      </div>
                    )}

                    <button 
                      onClick={handleTestAzureConnection}
                      disabled={isTestingConnection}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-medium shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isTestingConnection ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Testing Connection...</span>
                        </>
                      ) : (
                        <span>Connect & Test Azure Storage</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Fusion ERM Configuration */}
              {selectedMethod === 'fusion' && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-8 mb-6">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">⚡</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Fusion ERM Integration</h3>
                    <p className="text-sm text-slate-600">Connect to Oracle Fusion Cloud ERP</p>
                  </div>
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Instance URL</label>
                      <input
                        type="text"
                        placeholder="https://your-instance.fa.us2.oraclecloud.com"
                        value={fusionForm.instanceUrl}
                        onChange={(e) => setFusionForm({...fusionForm, instanceUrl: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white ${
                          fusionErrors.instanceUrl ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {fusionErrors.instanceUrl && (
                        <p className="text-red-600 text-xs mt-1">{fusionErrors.instanceUrl}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                      <input
                        type="text"
                        placeholder="fusion.user@company.com"
                        value={fusionForm.username}
                        onChange={(e) => setFusionForm({...fusionForm, username: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white ${
                          fusionErrors.username ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {fusionErrors.username && (
                        <p className="text-red-600 text-xs mt-1">{fusionErrors.username}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                      <input
                        type="password"
                        placeholder="Your Fusion password"
                        value={fusionForm.password}
                        onChange={(e) => setFusionForm({...fusionForm, password: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 bg-white ${
                          fusionErrors.password ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {fusionErrors.password && (
                        <p className="text-red-600 text-xs mt-1">{fusionErrors.password}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">API Version</label>
                      <Select
                        value={{ label: fusionForm.apiVersion, value: fusionForm.apiVersion }}
                        onChange={(option) => setFusionForm({...fusionForm, apiVersion: option?.value || 'v1'})}
                        options={[
                          { label: 'v1', value: 'v1' },
                          { label: 'v2', value: 'v2' }
                        ]}
                        className="text-slate-900"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderRadius: '0.5rem',
                            padding: '0.125rem',
                            borderColor: '#cbd5e1',
                            '&:hover': { borderColor: '#a855f7' },
                            boxShadow: 'none',
                            '&:focus-within': {
                              borderColor: '#a855f7',
                              boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.1)'
                            }
                          })
                        }}
                      />
                      <p className="text-slate-500 text-xs mt-1">
                        💡 Select the REST API version for your Fusion instance
                      </p>
                    </div>

                    {connectionStatus === 'success' && (
                      <div className="flex items-center space-x-2 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">Connection successful!</span>
                      </div>
                    )}

                    <button 
                      onClick={handleTestFusionConnection}
                      disabled={isTestingConnection}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors font-medium shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isTestingConnection ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Testing Connection...</span>
                        </>
                      ) : (
                        <span>Connect & Test Fusion ERM</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={startProcessing}
                  disabled={
                    !selectedMethod || 
                    (selectedMethod === 'pdf' && !pdfData) ||
                    (selectedMethod === 'excel' && !excelData) ||
                    (selectedMethod === 'mongodb' && !dbForm.connectionString) ||
                    (selectedMethod === 'azure' && (!azureForm.accountName || !azureForm.accessKey || !azureForm.containerName)) ||
                    (selectedMethod === 'fusion' && (!fusionForm.instanceUrl || !fusionForm.username || !fusionForm.password))
                  }
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Start Processing →
                </button>
              </div>
            </div>
          )}

          {/* AI PROCESSING ENGINE STEP */}
          {currentStep === 'processing' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">AI Processing Engine</h2>
              
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="w-24 h-24 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-xl font-semibold text-slate-900 mb-2">{progress}% Complete</p>
                  <p className="text-sm text-slate-600">AI is analyzing documents and matching with purchase orders...</p>
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden mt-8">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">{uploadedFiles.length}</p>
                  <p className="text-sm text-slate-600">Files Processing</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <p className="text-2xl font-bold text-purple-600">{Math.floor(progress / 20)}</p>
                  <p className="text-sm text-slate-600">Invoices Matched</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{Math.floor(progress / 25)}%</p>
                  <p className="text-sm text-slate-600">Accuracy Rate</p>
                </div>
              </div>
            </div>
          )}

          {/* OUTPUT LAYER STEP */}
          {currentStep === 'output' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Output Layer - Review Results</h2>
                  <p className="text-slate-600 mt-1">AI processing complete. Review validation results and insights</p>
                </div>
                <button
                  onClick={resetWorkflow}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Start New Workflow
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <p className="text-sm opacity-90 mb-2">Success Rate</p>
                  <p className="text-4xl font-bold">
                    {processedResults.length > 0 
                      ? Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm opacity-90 mt-2">
                    {processedResults.filter(r => r.status === 'success').length} of {processedResults.length} matched
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <p className="text-sm opacity-90 mb-2">Total Amount</p>
                  <p className="text-4xl font-bold">
                    ${(processedResults.reduce((sum, r) => sum + r.amount, 0) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-sm opacity-90 mt-2">Validated</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <p className="text-sm opacity-90 mb-2">Avg Score</p>
                  <p className="text-4xl font-bold">
                    {processedResults.length > 0
                      ? Math.round(processedResults.reduce((sum, r) => sum + r.score, 0) / processedResults.length)
                      : 0}%
                  </p>
                  <p className="text-sm opacity-90 mt-2">Match confidence</p>
                </div>
              </div>

              {/* Results Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">PO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {currentResults.map((result) => (
                      <tr key={result.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{result.invoice}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{result.po}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                          <div className="break-words line-clamp-2" title={result.vendor}>
                            {result.vendor}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">${result.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            {result.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-bold ${result.status === 'success' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {result.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            result.status === 'success' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {result.status === 'success' ? 'Matched' : 'Review Required'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openComparisonModal(result)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {processedResults.length > itemsPerPage && (
                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      {/* Results info */}
                      <div className="text-sm text-slate-600">
                        Showing <span className="font-medium text-slate-900">{indexOfFirstItem + 1}</span> to{' '}
                        <span className="font-medium text-slate-900">
                          {Math.min(indexOfLastItem, processedResults.length)}
                        </span>{' '}
                        of <span className="font-medium text-slate-900">{processedResults.length}</span> results
                      </div>

                      {/* Pagination buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          Previous
                        </button>

                        {/* Page numbers */}
                        <div className="flex space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                            // Show first page, last page, current page, and pages around current
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => goToPage(pageNum)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                    currentPage === pageNum
                                      ? 'bg-blue-600 text-white'
                                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            } else if (
                              pageNum === currentPage - 2 ||
                              pageNum === currentPage + 2
                            ) {
                              return <span key={pageNum} className="px-2 text-slate-400">...</span>;
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={moveToDelivery}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg cursor-pointer font-semibold"
                >
                  Proceed to Delivery →
                </button>
              </div>
            </div>
          )}

          {/* DELIVERY LAYER STEP */}
          {currentStep === 'delivery' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Delivery Layer - Final Actions</h2>
                  <p className="text-slate-600 mt-1">Export, share, and submit your validated invoices</p>
                </div>
                <button
                  onClick={resetWorkflow}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Start New Workflow
                </button>
              </div>

              {/* Summary Stats */}
              <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Delivery Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{processedResults.length}</p>
                    <p className="text-xs text-slate-600 mt-1">Total Invoices</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{processedResults.filter(r => r.status === 'success').length}</p>
                    <p className="text-xs text-slate-600 mt-1">Successfully Matched</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{processedResults.filter(r => r.status === 'warning').length}</p>
                    <p className="text-xs text-slate-600 mt-1">Requires Review</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      ${(processedResults.reduce((sum, r) => sum + r.amount, 0) / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Total Value</p>
                  </div>
                </div>
              </div>

              {/* Delivery Options - Professional 2-Column Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Generate Reports */}
                <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-xl transition-all group">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Download Reports</h3>
                      <p className="text-sm text-slate-600">PDF + Excel validation reports in ZIP</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleGenerateReports}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-base rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer"
                  >
                    Download Report Package
                  </button>
                </div>

                {/* Share via Email */}
                <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 rounded-2xl p-6 hover:border-green-400 hover:shadow-xl transition-all group">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Share via Email</h3>
                      <p className="text-sm text-slate-600">Send report with PDF attachment</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleEmailNotifications}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-base rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer"
                  >
                    Send Email with Report
                  </button>
                </div>

                {/* Save to MongoDB */}
                <div className="bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 hover:border-emerald-400 hover:shadow-xl transition-all group">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0111.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296 4.877-3.582 4.292-11.375z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Save to MongoDB</h3>
                      <p className="text-sm text-slate-600">Store report in database collection</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleMongoDBShare}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-base rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer"
                  >
                    Save Report to Database
                  </button>
                </div>

                {/* Share via REST API */}
                <div className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 hover:border-indigo-400 hover:shadow-xl transition-all group">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Share via REST API</h3>
                      <p className="text-sm text-slate-600">Send to custom API endpoint</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowRestApiConfig(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-base rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg font-semibold cursor-pointer"
                  >
                    Send to API Endpoint
                  </button>
                </div>

                {/* Share to Slack */}
                <div className="bg-gradient-to-br from-white to-pink-50 border-2 border-pink-200 rounded-2xl p-6 hover:border-pink-400 hover:shadow-xl transition-all group">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{backgroundColor: '#4A154B'}}>
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Share to Slack</h3>
                      <p className="text-sm text-slate-600">Send to Slack channel</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSlackConfig(true)}
                    className="w-full px-6 py-3 text-white text-base rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg font-semibold cursor-pointer" style={{backgroundColor: '#4A154B'}}
                  >
                    Post to Slack Channel
                  </button>
                </div>

                {/* Share to Microsoft Teams */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-xl transition-all group">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{backgroundColor: '#6264A7'}}>
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.625 8.375h-7.5a.75.75 0 00-.75.75v7.5a.75.75 0 00.75.75h7.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75zm-5.625 6.75h-1.5v-4.5h1.5v4.5zm3 0h-1.5v-4.5h1.5v4.5zm-7.5-6.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM8.25 3.75v10.5m-4.5-6h9"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">Share to Teams</h3>
                      <p className="text-sm text-slate-600">Send to Teams channel</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTeamsConfig(true)}
                    className="w-full px-6 py-3 text-white text-base rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg font-semibold cursor-pointer" style={{backgroundColor: '#6264A7'}}
                  >
                    Post to Teams Channel
                  </button>
                </div>

                {/* ERP Systems - Combined Card */}
                <div className="md:col-span-2 bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 rounded-2xl p-6 relative">
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">Coming Soon</span>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      ERP System Integrations
                    </h3>
                    <p className="text-sm text-slate-600 ml-8">Connect with leading enterprise resource planning systems</p>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {/* SAP */}
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-4 text-center hover:border-blue-400 hover:shadow-md transition-all">
                      <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <div className="font-black text-2xl" style={{color: '#0066B3'}}>SAP</div>
                      </div>
                      <p className="text-xs font-bold text-slate-900">SAP ERP</p>
                      <p className="text-xs text-slate-600 mt-1">Enterprise</p>
                    </div>

                    {/* Oracle NetSuite */}
                    <div className="bg-white border-2 border-red-200 rounded-xl p-4 text-center hover:border-red-400 hover:shadow-md transition-all">
                      <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="font-black text-white text-sm">NS</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-900">NetSuite</p>
                      <p className="text-xs text-slate-600 mt-1">Cloud ERP</p>
                    </div>

                    {/* Microsoft Dynamics */}
                    <div className="bg-white border-2 border-green-200 rounded-xl p-4 text-center hover:border-green-400 hover:shadow-md transition-all">
                      <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <div className="grid grid-cols-2 gap-0.5 w-10 h-10">
                          <div className="w-full h-full bg-blue-500 rounded-sm"></div>
                          <div className="w-full h-full bg-green-500 rounded-sm"></div>
                          <div className="w-full h-full bg-yellow-500 rounded-sm"></div>
                          <div className="w-full h-full bg-red-500 rounded-sm"></div>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-900">Dynamics 365</p>
                      <p className="text-xs text-slate-600 mt-1">Microsoft</p>
                    </div>

                    {/* Workday */}
                    <div className="bg-white border-2 border-yellow-200 rounded-xl p-4 text-center hover:border-yellow-400 hover:shadow-md transition-all">
                      <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#FF6B2C'}}>
                          <span className="font-black text-white text-sm">WD</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-900">Workday</p>
                      <p className="text-xs text-slate-600 mt-1">Financial</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <div className="flex justify-start pt-4 border-t border-slate-200">
                <button 
                  onClick={() => setCurrentStep('output')}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ← Back to Output
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Email Inbox Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center">
                      <span className="text-3xl mr-3">📧</span>
                      Email Inbox - Auto-Forwarded Messages
                    </h3>
                    <p className="text-blue-100 mt-1 font-medium">Select an invoice email to process</p>
                  </div>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Stats Bar */}
                <div className="mt-4 flex items-center space-x-6 bg-white/10 backdrop-blur rounded-xl p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{emailInbox.filter(e => e.matchesCriteria).length}</p>
                    <p className="text-xs opacity-90">Valid Invoices</p>
                  </div>
                  <div className="h-8 w-px bg-white/30"></div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{emailInbox.filter(e => !e.matchesCriteria).length}</p>
                    <p className="text-xs opacity-90">Other Messages</p>
                  </div>
                  <div className="h-8 w-px bg-white/30"></div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{emailInbox.length}</p>
                    <p className="text-xs opacity-90">Total Messages</p>
                  </div>
                </div>
              </div>

              {/* Modal Body - Email List */}
              <div className="overflow-y-auto max-h-[calc(85vh-200px)] p-6 bg-gradient-to-br from-slate-50 to-white">
                <div className="space-y-3">
                  {emailInbox.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => handleEmailSelect(email.id)}
                      disabled={!email.matchesCriteria}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                        email.matchesCriteria
                          ? 'border-blue-200 bg-gradient-to-br from-white to-blue-50 hover:border-blue-400 hover:shadow-lg cursor-pointer transform hover:scale-[1.02]'
                          : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          {/* Status Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            email.matchesCriteria
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg'
                              : 'bg-slate-300 text-slate-600'
                          }`}>
                            {email.hasAttachment ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>

                          {/* Email Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className={`font-bold text-sm truncate ${
                                email.matchesCriteria ? 'text-slate-900' : 'text-slate-600'
                              }`}>
                                {email.from}
                              </p>
                              {email.isAutoForwarded && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                  AUTO-FWD
                                </span>
                              )}
                              {email.hasAttachment && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                                  📎 PDF
                                </span>
                              )}
                            </div>
                            <p className={`font-semibold mb-1 ${
                              email.matchesCriteria ? 'text-slate-900' : 'text-slate-500'
                            }`}>
                              {email.subject}
                            </p>
                            <p className={`text-xs line-clamp-1 ${
                              email.matchesCriteria ? 'text-slate-600' : 'text-slate-400'
                            }`}>
                              {email.preview}
                            </p>
                          </div>

                          {/* Date & Action */}
                          <div className="flex flex-col items-end space-y-2">
                            <p className="text-xs text-slate-500 whitespace-nowrap">{email.date}</p>
                            {email.matchesCriteria ? (
                              <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold rounded-full shadow-md">
                                ✓ Ready to Process
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-slate-300 text-slate-600 text-xs font-bold rounded-full">
                                ✗ Not Invoice
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Indicator */}
                      {email.matchesCriteria && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs text-blue-600 font-medium flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Click to extract invoice data and continue workflow
                          </p>
                        </div>
                      )}

                      {/* Disabled Message */}
                      {!email.matchesCriteria && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-500 flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {!email.isAutoForwarded 
                              ? 'Not auto-forwarded - manual emails are filtered out' 
                              : !email.hasAttachment
                                ? 'No attachment found - invoices must have PDF attachments'
                                : 'Does not match invoice criteria'}
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Info Panel */}
                <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-blue-900 text-sm mb-1">Auto-Forwarded Email Filtering</p>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        The system automatically identifies invoice emails based on:<br/>
                        • <strong>Auto-forwarded tag</strong> in the subject line<br/>
                        • <strong>PDF attachments</strong> containing invoice data<br/>
                        • <strong>Vendor email addresses</strong> matching your approved list<br/>
                        Only validated emails can be selected for processing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-5 border-t-2 border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-emerald-600">{emailInbox.filter(e => e.matchesCriteria).length}</span> invoice emails ready to process
                </p>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-md cursor-pointer"
                >
                  Close Inbox
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Modal */}
        {showModal && selectedResult && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-6 text-white border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Document Validation Report</h3>
                    <p className="text-slate-300 mt-1 font-medium">Invoice {selectedResult.invoice} • Purchase Order {selectedResult.po}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
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
                      selectedResult.status === 'success' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      Match Score: {selectedResult.score}%
                    </div>
                    <div className="bg-slate-600 px-4 py-2 rounded-xl text-sm font-medium">
                      Vendor: {selectedResult.vendor}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    {selectedResult.fieldComparisons.filter(f => f.match).length} / {selectedResult.fieldComparisons.length} fields validated
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                <div className="space-y-4">
                  {selectedResult.fieldComparisons.map((comparison, idx) => (
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
                      {selectedResult.fieldComparisons.filter(f => f.match).length}
                    </span>
                    <span className="text-slate-600 ml-1">/ {selectedResult.fieldComparisons.length} fields validated</span>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    selectedResult.status === 'success'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}>
                    {selectedResult.status === 'success' ? 'Validation Passed' : 'Review Required'}
                  </div>
                </div>
                <div className="flex space-x-3">
                  {selectedResult.status === 'warning' && (
                    <button 
                      onClick={handleManualReview}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg font-medium cursor-pointer"
                    >
                      Request Manual Review
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-md cursor-pointer"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* MongoDB Configuration Modal */}
        {showMongoConfig && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center">
                      <span className="text-3xl mr-3">🗄️</span>
                      Save Report to MongoDB
                    </h3>
                    <p className="text-emerald-100 mt-1 font-medium">Store complete validation report in database</p>
                  </div>
                  <button
                    onClick={() => setShowMongoConfig(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(85vh-200px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                {/* MongoDB Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Connection String <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="mongodb://localhost:27017 or mongodb+srv://..."
                      value={mongoConfig.connectionString}
                      onChange={(e) => setMongoConfig({...mongoConfig, connectionString: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 bg-white ${
                        mongoConfigErrors.connectionString ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {mongoConfigErrors.connectionString && (
                      <p className="text-red-600 text-xs mt-1">{mongoConfigErrors.connectionString}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Database Name</label>
                      <input
                        type="text"
                        value={mongoConfig.database}
                        onChange={(e) => setMongoConfig({...mongoConfig, database: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Collection Name</label>
                      <input
                        type="text"
                        value={mongoConfig.collection}
                        onChange={(e) => setMongoConfig({...mongoConfig, collection: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Report Preview */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Report Structure
                  </h4>

                  {/* Report Summary */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h5 className="font-bold text-slate-900 mb-3 text-sm">Document Summary</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Report ID:</span>
                        <span className="font-mono text-slate-900">RPT-{Date.now()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Invoices:</span>
                        <span className="font-bold text-slate-900">{processedResults.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Successfully Matched:</span>
                        <span className="font-bold text-green-600">{processedResults.filter(r => r.status === 'success').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Requires Review:</span>
                        <span className="font-bold text-yellow-600">{processedResults.filter(r => r.status === 'warning').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Success Rate:</span>
                        <span className="font-bold text-blue-600">
                          {Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-slate-600">Total Value:</span>
                        <span className="font-bold text-purple-600">
                          ${processedResults.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document Fields */}
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                    <h5 className="font-bold text-emerald-900 text-sm mb-2">Stored Fields</h5>
                    <div className="text-xs text-emerald-800 space-y-1">
                      <p>• <strong>Report Metadata:</strong> ID, Generated timestamp</p>
                      <p>• <strong>Summary Statistics:</strong> Totals, match rates, values</p>
                      <p>• <strong>Invoice Details:</strong> All {processedResults.length} invoices with complete data</p>
                      <p>• <strong>Validation Results:</strong> Field-by-field comparisons</p>
                      <p>• <strong>Issue Tracking:</strong> Detailed mismatch descriptions</p>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm mb-1">Ready to Save</p>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        The complete validation report will be stored as a document in your MongoDB collection with all invoice details and validation results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-5 border-t-2 border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setShowMongoConfig(false)}
                  className="px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveToMongoDB}
                  className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg font-medium cursor-pointer flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save to MongoDB</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Configuration Modal */}
        {showEmailConfig && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center">
                      <span className="text-3xl mr-3">✉️</span>
                      Share Report via Email
                    </h3>
                    <p className="text-green-100 mt-1 font-medium">Send validation report with PDF attachment</p>
                  </div>
                  <button
                    onClick={() => setShowEmailConfig(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                {/* Email Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="recipient@company.com"
                      value={emailConfig.to}
                      onChange={(e) => setEmailConfig({...emailConfig, to: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 bg-white ${
                        emailConfigErrors.to ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {emailConfigErrors.to && (
                      <p className="text-red-600 text-xs mt-1">{emailConfigErrors.to}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">CC (Optional)</label>
                    <input
                      type="email"
                      placeholder="cc@company.com"
                      value={emailConfig.cc}
                      onChange={(e) => setEmailConfig({...emailConfig, cc: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 bg-white ${
                        emailConfigErrors.cc ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {emailConfigErrors.cc && (
                      <p className="text-red-600 text-xs mt-1">{emailConfigErrors.cc}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={emailConfig.subject}
                      onChange={(e) => setEmailConfig({...emailConfig, subject: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* Email Preview */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Email Preview
                  </h4>

                  {/* Report Summary */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h5 className="font-bold text-slate-900 mb-3">Invoice Validation Report Summary</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Invoices:</span>
                        <span className="font-bold text-slate-900">{processedResults.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Successfully Matched:</span>
                        <span className="font-bold text-green-600">{processedResults.filter(r => r.status === 'success').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Requires Review:</span>
                        <span className="font-bold text-yellow-600">{processedResults.filter(r => r.status === 'warning').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Success Rate:</span>
                        <span className="font-bold text-blue-600">
                          {Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-slate-600">Total Value:</span>
                        <span className="font-bold text-purple-600">
                          ${processedResults.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attachment Info */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">Invoice_Validation_Report.pdf</p>
                      <p className="text-xs text-slate-600">Detailed validation report with field comparisons</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      Attached
                    </span>
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-green-900 text-sm mb-1">Ready to Send</p>
                      <p className="text-xs text-green-800 leading-relaxed">
                        The email will include a summary of validation results and a detailed PDF report with all invoice comparisons.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-5 border-t-2 border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setShowEmailConfig(false)}
                  className="px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium cursor-pointer flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* REST API Configuration Modal */}
        {showRestApiConfig && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center">
                      <span className="text-3xl mr-3">🔗</span>
                      Share via REST API
                    </h3>
                    <p className="text-indigo-100 mt-1 font-medium">Send complete report to external API endpoint</p>
                  </div>
                  <button
                    onClick={() => setShowRestApiConfig(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                {/* API Configuration Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      API URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://api.example.com/invoices/validate"
                      value={restApiConfig.url}
                      onChange={(e) => setRestApiConfig({...restApiConfig, url: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 bg-white ${
                        restApiConfigErrors.url ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {restApiConfigErrors.url && (
                      <p className="text-red-600 text-xs mt-1">{restApiConfigErrors.url}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">HTTP Method</label>
                    <Select
                      value={{ label: restApiConfig.method, value: restApiConfig.method }}
                      onChange={(option) => setRestApiConfig({...restApiConfig, method: option?.value || 'POST'})}
                      options={[
                        { label: 'POST', value: 'POST' },
                        { label: 'PUT', value: 'PUT' }
                      ]}
                      className="text-slate-900"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: '0.5rem',
                          padding: '0.125rem',
                          borderColor: '#cbd5e1',
                          '&:hover': { borderColor: '#6366f1' },
                          boxShadow: 'none',
                          '&:focus-within': {
                            borderColor: '#6366f1',
                            boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.1)'
                          }
                        })
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Headers (JSON Format) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_TOKEN"}'
                      value={restApiConfig.headers}
                      onChange={(e) => setRestApiConfig({...restApiConfig, headers: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 font-mono text-sm bg-white ${
                        restApiConfigErrors.headers ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {restApiConfigErrors.headers && (
                      <p className="text-red-600 text-xs mt-1">{restApiConfigErrors.headers}</p>
                    )}
                  </div>
                </div>

                {/* Report Payload Preview */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 mb-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Request Payload (JSON)
                  </h4>

                  {/* JSON Preview - Read Only */}
                  <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
{JSON.stringify({
  reportId: `RPT-${Date.now()}`,
  generatedAt: new Date().toISOString(),
  summary: {
    totalInvoices: processedResults.length,
    successfullyMatched: processedResults.filter(r => r.status === 'success').length,
    requiresReview: processedResults.filter(r => r.status === 'warning').length,
    successRate: Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100),
    totalValue: processedResults.reduce((sum, r) => sum + r.amount, 0)
  },
  invoices: [
    ...processedResults.slice(0, 2).map(result => ({
      invoiceNumber: result.invoice,
      poNumber: result.po,
      vendor: result.vendor,
      amount: result.amount,
      source: result.source,
      matchScore: result.score,
      status: result.status,
      validationDetails: result.fieldComparisons.map(fc => ({
        field: fc.field,
        poValue: fc.poValue,
        invoiceValue: fc.invoiceValue,
        isMatch: fc.match
      })),
      issues: result.fieldComparisons
        .filter(fc => !fc.match)
        .map(fc => `${fc.field}: PO="${fc.poValue}" vs Invoice="${fc.invoiceValue}"`)
    })),
    ...(processedResults.length > 2 ? [{ note: `... ${processedResults.length - 2} more invoices` }] : [])
  ] as any
}, null, 2)}
                    </pre>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    ℹ️ Showing preview with first 2 invoices. Full report with all {processedResults.length} invoices will be sent.
                  </p>
                </div>

                {/* Request Details */}
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                  <h5 className="font-bold text-indigo-900 text-sm mb-2">Request Details</h5>
                  <div className="text-xs text-indigo-800 space-y-1">
                    <p>• <strong>Method:</strong> {restApiConfig.method}</p>
                    <p>• <strong>Content-Type:</strong> application/json</p>
                    <p>• <strong>Payload Size:</strong> ~{Math.round(JSON.stringify(processedResults).length / 1024)}KB</p>
                    <p>• <strong>Total Invoices:</strong> {processedResults.length}</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-5 border-t-2 border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setShowRestApiConfig(false)}
                  className="px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToRestApi}
                  className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg font-medium cursor-pointer flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send to API</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Slack Configuration Modal */}
        {showSlackConfig && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="px-8 py-6 text-white" style={{background: 'linear-gradient(to right, #4A154B, #611f69, #4A154B)'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center">
                      <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                      </svg>
                      Share Report to Slack
                    </h3>
                    <p className="mt-1 font-medium" style={{color: '#ECB8F5'}}>Post validation summary to your Slack channel</p>
                  </div>
                  <button
                    onClick={() => setShowSlackConfig(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                {/* Slack Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Slack Webhook URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX"
                      value={slackConfig.webhookUrl}
                      onChange={(e) => setSlackConfig({...slackConfig, webhookUrl: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-slate-900 bg-white font-mono text-sm ${
                        slackConfigErrors.webhookUrl ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {slackConfigErrors.webhookUrl && (
                      <p className="text-red-600 text-xs mt-1">{slackConfigErrors.webhookUrl}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      💡 Get your webhook URL from Slack App settings → Incoming Webhooks
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Channel <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="#invoice-reports"
                      value={slackConfig.channel}
                      onChange={(e) => setSlackConfig({...slackConfig, channel: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-slate-900 bg-white ${
                        slackConfigErrors.channel ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {slackConfigErrors.channel && (
                      <p className="text-red-600 text-xs mt-1">{slackConfigErrors.channel}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      💡 Channel names start with # (e.g., #invoice-reports) or @ for direct messages
                    </p>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Slack Message Preview
                  </h4>

                  <div className="border-l-4 rounded-r-lg p-4" style={{borderColor: '#4A154B', backgroundColor: '#F8F8F8'}}>
                    <p className="font-bold text-lg mb-3">📊 Invoice Validation Report</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-600">Total Invoices:</p>
                        <p className="font-bold text-slate-900">{processedResults.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Successfully Matched:</p>
                        <p className="font-bold text-green-600">{processedResults.filter(r => r.status === 'success').length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Requires Review:</p>
                        <p className="font-bold text-yellow-600">{processedResults.filter(r => r.status === 'warning').length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Success Rate:</p>
                        <p className="font-bold text-blue-600">
                          {Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="border-t pt-3 mb-3">
                      <div className="flex justify-between">
                        <p className="text-xs text-slate-600">Total Value:</p>
                        <p className="font-bold text-purple-600">${processedResults.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-slate-600">Generated:</p>
                        <p className="text-xs text-slate-900">{new Date().toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic">Automated report from InvoiceFlow • Click to view full details</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-5 border-t-2 border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setShowSlackConfig(false)}
                  className="px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToSlack}
                  className="px-8 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg font-medium cursor-pointer flex items-center space-x-2" style={{backgroundColor: '#4A154B'}}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"/>
                  </svg>
                  <span>Send to Slack</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Teams Configuration Modal */}
        {showTeamsConfig && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="px-8 py-6 text-white" style={{background: 'linear-gradient(to right, #6264A7, #464EB8, #6264A7)'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center">
                      <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.625 8.375h-7.5a.75.75 0 00-.75.75v7.5a.75.75 0 00.75.75h7.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75zm-5.625 6.75h-1.5v-4.5h1.5v4.5zm3 0h-1.5v-4.5h1.5v4.5zm-7.5-6.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM8.25 3.75v10.5m-4.5-6h9"/>
                      </svg>
                      Share Report to Microsoft Teams
                    </h3>
                    <p className="mt-1 font-medium" style={{color: '#C7C8E8'}}>Post validation summary to your Teams channel</p>
                  </div>
                  <button
                    onClick={() => setShowTeamsConfig(false)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-8 bg-gradient-to-br from-slate-50 to-white">
                {/* Teams Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Teams Webhook URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://outlook.office.com/webhook/..."
                      value={teamsConfig.webhookUrl}
                      onChange={(e) => setTeamsConfig({...teamsConfig, webhookUrl: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white font-mono text-sm ${
                        teamsConfigErrors.webhookUrl ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {teamsConfigErrors.webhookUrl && (
                      <p className="text-red-600 text-xs mt-1">{teamsConfigErrors.webhookUrl}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      💡 Get your webhook URL from Teams channel → Connectors → Incoming Webhook
                    </p>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Teams Message Preview
                  </h4>

                  <div className="border-l-4 rounded-r-lg p-4" style={{borderColor: '#6264A7', backgroundColor: '#F8F8F8'}}>
                    <p className="font-bold text-lg mb-3">📊 Invoice Validation Report</p>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-slate-600">Total Invoices:</span>
                        <span className="text-sm font-bold text-slate-900">{processedResults.length}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-slate-600">Successfully Matched:</span>
                        <span className="text-sm font-bold text-green-600">{processedResults.filter(r => r.status === 'success').length}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-slate-600">Requires Review:</span>
                        <span className="text-sm font-bold text-yellow-600">{processedResults.filter(r => r.status === 'warning').length}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-slate-600">Success Rate:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {Math.round((processedResults.filter(r => r.status === 'success').length / processedResults.length) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-t pt-2">
                        <span className="text-sm text-slate-600">Total Value:</span>
                        <span className="text-sm font-bold text-purple-600">${processedResults.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Validation Summary • {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-8 py-5 border-t-2 border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setShowTeamsConfig(false)}
                  className="px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToTeams}
                  className="px-8 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg font-medium cursor-pointer flex items-center space-x-2" style={{backgroundColor: '#6264A7'}}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.625 8.375h-7.5a.75.75 0 00-.75.75v7.5a.75.75 0 00.75.75h7.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75z"/>
                  </svg>
                  <span>Send to Teams</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
