import React from 'react';
import toast from 'react-hot-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceResponse: any;
  poResponse: any;
  matchingResult: any;
}

export default function ExportModal({
  isOpen,
  onClose,
  invoiceResponse,
  poResponse,
  matchingResult,
}: ExportModalProps) {
  if (!isOpen) return null;

  const handlePDFExport = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const getDocumentData = (response: any) => {
        if (response?.documents && Array.isArray(response.documents) && response.documents.length > 0) {
          return response.documents[0];
        }
        return response?.extracted_data || response || {};
      };

      const invoiceDoc = getDocumentData(invoiceResponse);
      const poDoc = getDocumentData(poResponse);

      const getValue = (obj: any, path: string) => {
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            return undefined;
          }
        }
        return value;
      };

      // Dynamically extract all fields from both documents
      const extractAllFields = (obj: any, prefix = ''): { label: string; path: string }[] => {
        const fields: { label: string; path: string }[] = [];
        
        if (!obj || typeof obj !== 'object') return fields;
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const path = prefix ? `${prefix}.${key}` : key;
            
            // Skip certain system fields
            if (key === 'raw_content' || key === 'extracted_data' || key === 'is_raw_response' || key === 'raw_text') {
              continue;
            }
            
            // If it's a nested object (but not an array), recurse
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              fields.push(...extractAllFields(value, path));
            } else {
              // Convert path to readable label
              const label = path
                .split('.')
                .map(part => part.replace(/_/g, ' '))
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' > ');
              
              fields.push({ label, path });
            }
          }
        }
        
        return fields;
      };

      const invoiceFields = extractAllFields(invoiceDoc);
      const poFields = extractAllFields(poDoc);
      
      // Combine and deduplicate fields
      const allPaths = new Set([...invoiceFields.map(f => f.path), ...poFields.map(f => f.path)]);
      const fieldsToShow = Array.from(allPaths).map(path => {
        const field = invoiceFields.find(f => f.path === path) || poFields.find(f => f.path === path);
        return field!;
      }).sort((a, b) => a.path.localeCompare(b.path));

      const tableData: string[][] = fieldsToShow
        .map(({ label, path }) => {
          const invoiceValue = getValue(invoiceDoc, path);
          const poValue = getValue(poDoc, path);

          if (invoiceValue === null && poValue === null) return null;
          if (invoiceValue === undefined && poValue === undefined) return null;

          const formatValue = (val: any) => {
            if (val === null || val === undefined) return '-';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val);
          };

          const valuesMatch = JSON.stringify(invoiceValue) === JSON.stringify(poValue);
          const status = (invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null)
            ? (valuesMatch ? '✓ Match' : '✗ Mismatch')
            : '-';

          return [
            label,
            formatValue(invoiceValue),
            formatValue(poValue),
            status
          ];
        })
        .filter((row): row is string[] => row !== null);

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.text('Document Comparison Report', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

      autoTable(doc, {
        head: [['Field Name', 'Invoice Value', 'PO Value', 'Status']],
        body: tableData,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 70 },
          2: { cellWidth: 70 },
          3: { cellWidth: 30, halign: 'center' }
        },
        didParseCell: function(data: any) {
          if (data.column.index === 3 && data.section === 'body') {
            if (data.cell.text[0].includes('✓')) {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fillColor = [240, 253, 244];
            } else if (data.cell.text[0].includes('✗')) {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fillColor = [254, 242, 242];
            }
          }
        }
      });

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save('document-comparison.pdf');
      toast.success('PDF exported successfully!');
      onClose();
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleCSVExport = () => {
    const getDocumentData = (response: any) => {
      if (response?.documents && Array.isArray(response.documents) && response.documents.length > 0) {
        return response.documents[0];
      }
      return response?.extracted_data || response || {};
    };

    const invoiceDoc = getDocumentData(invoiceResponse);
    const poDoc = getDocumentData(poResponse);

    const getValue = (obj: any, path: string) => {
      const keys = path.split('.');
      let value = obj;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return undefined;
        }
      }
      return value;
    };

    // Dynamically extract all fields from both documents
    const extractAllFields = (obj: any, prefix = ''): { label: string; path: string }[] => {
      const fields: { label: string; path: string }[] = [];
      
      if (!obj || typeof obj !== 'object') return fields;
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const path = prefix ? `${prefix}.${key}` : key;
          
          // Skip certain system fields
          if (key === 'raw_content' || key === 'extracted_data' || key === 'is_raw_response' || key === 'raw_text') {
            continue;
          }
          
          // If it's a nested object (but not an array), recurse
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            fields.push(...extractAllFields(value, path));
          } else {
            // Convert path to readable label
            const label = path
              .split('.')
              .map(part => part.replace(/_/g, ' '))
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' > ');
            
            fields.push({ label, path });
          }
        }
      }
      
      return fields;
    };

    const invoiceFields = extractAllFields(invoiceDoc);
    const poFields = extractAllFields(poDoc);
    
    // Combine and deduplicate fields
    const allPaths = new Set([...invoiceFields.map(f => f.path), ...poFields.map(f => f.path)]);
    const fieldsToShow = Array.from(allPaths).map(path => {
      const field = invoiceFields.find(f => f.path === path) || poFields.find(f => f.path === path);
      return field!;
    }).sort((a, b) => a.path.localeCompare(b.path));

    let csvContent = 'Field Name,Invoice Value,PO Value,Status\n';
    
    fieldsToShow.forEach(({ label, path }) => {
      const invoiceValue = getValue(invoiceDoc, path);
      const poValue = getValue(poDoc, path);
      
      if (invoiceValue !== null && invoiceValue !== undefined || poValue !== null && poValue !== undefined) {
        const formatValue = (val: any) => {
          if (val === null || val === undefined) return '-';
          if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
          return String(val).replace(/"/g, '""');
        };
        
        const valuesMatch = JSON.stringify(invoiceValue) === JSON.stringify(poValue);
        const status = (invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null) 
          ? (valuesMatch ? 'Match' : 'Mismatch') 
          : '-';
        
        csvContent += `"${label}","${formatValue(invoiceValue)}","${formatValue(poValue)}","${status}"\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document-comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
    onClose();
  };

  const handleJSONExport = () => {
    const dataToExport = {
      invoice: invoiceResponse,
      purchaseOrder: poResponse,
      comparison: matchingResult
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document-comparison.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Export Options</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-3">
          {/* Export as PDF */}
          <button
            onClick={handlePDFExport}
            className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Export as PDF</span>
          </button>

          {/* Export as CSV */}
          <button
            onClick={handleCSVExport}
            className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Export as CSV</span>
          </button>

          {/* Export as JSON */}
          <button
            onClick={handleJSONExport}
            className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="font-medium">Export as JSON</span>
          </button>

          {/* REST API (Coming Soon) */}
          <button
            disabled
            className="w-full px-4 py-3 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="font-medium">REST API (Coming Soon)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
