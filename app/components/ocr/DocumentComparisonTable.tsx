import React from 'react';

interface DocumentComparisonTableProps {
  invoiceResponse: any;
  poResponse: any;
  onExport: () => void;
}

export default function DocumentComparisonTable({
  invoiceResponse,
  poResponse,
  onExport,
}: DocumentComparisonTableProps) {
  // Extract document data - handle both nested documents array and flat structure
  const getDocumentData = (response: any) => {
    if (response?.documents && Array.isArray(response.documents) && response.documents.length > 0) {
      return response.documents[0];
    }
    return response?.extracted_data || response || {};
  };

  const invoiceDoc = getDocumentData(invoiceResponse);
  const poDoc = getDocumentData(poResponse);

  // Helper to safely get nested values
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
        
        // Skip certain system fields that aren't useful for comparison
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

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Document Comparison</h3>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-white font-medium">Export</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/4">
                Field Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/3">
                Invoice Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/3">
                PO Value
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-24">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {fieldsToShow.map(({ label, path }) => {
              const invoiceValue = getValue(invoiceDoc, path);
              const poValue = getValue(poDoc, path);

              // Skip if both are null/undefined
              if (invoiceValue === null && poValue === null) return null;
              if (invoiceValue === undefined && poValue === undefined) return null;

              // Check if values match
              const valuesMatch = JSON.stringify(invoiceValue) === JSON.stringify(poValue);

              return (
                <tr
                  key={path}
                  className={`hover:bg-slate-50 transition-colors ${
                    !valuesMatch && invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null
                      ? 'bg-red-50/20'
                      : valuesMatch && invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null
                      ? 'bg-green-50/20'
                      : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">
                      {label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700 break-words">
                      {formatValue(invoiceValue)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700 break-words">
                      {formatValue(poValue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {invoiceValue !== undefined && poValue !== undefined && invoiceValue !== null && poValue !== null ? (
                      valuesMatch ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            }).filter(Boolean)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
