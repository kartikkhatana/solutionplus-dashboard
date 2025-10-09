'use client';
import { useMemo } from 'react';

interface JsonViewerProps {
  data: any;
}

export default function JsonViewer({ data }: JsonViewerProps) {
  const formattedJson = useMemo(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const lines = formattedJson.split('\n');

  const syntaxHighlight = (line: string) => {
    // Replace keys (text before colon in quotes) with colored version
    let highlighted = line.replace(
      /"([^"]+)":/g,
      '<span class="text-blue-600 font-semibold">"$1"</span>:'
    );

    // Replace string values (text in quotes after colon) with green
    highlighted = highlighted.replace(
      /:\s*"([^"]*)"/g,
      ': <span class="text-green-600">"$1"</span>'
    );

    // Replace numbers with green
    highlighted = highlighted.replace(
      /:\s*(\d+\.?\d*)/g,
      ': <span class="text-green-600">$1</span>'
    );

    // Replace booleans with orange
    highlighted = highlighted.replace(
      /:\s*(true|false)/g,
      ': <span class="text-orange-600">$1</span>'
    );

    // Replace null with gray
    highlighted = highlighted.replace(
      /:\s*null/g,
      ': <span class="text-gray-500 italic">null</span>'
    );

    return highlighted;
  };

  return (
    <div className="flex bg-slate-50 rounded-lg border border-slate-200 overflow-hidden font-mono text-sm">
      {/* Line Numbers */}
      <div className="bg-slate-100 px-4 py-3 text-slate-500 select-none border-r border-slate-200">
        {lines.map((_, index) => (
          <div key={index} className="leading-6 text-right">
            {index + 1}
          </div>
        ))}
      </div>

      {/* JSON Content */}
      <div className="flex-1 px-4 py-3 overflow-x-auto">
        {lines.map((line, index) => (
          <div
            key={index}
            className="leading-6"
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }}
          />
        ))}
      </div>
    </div>
  );
}
