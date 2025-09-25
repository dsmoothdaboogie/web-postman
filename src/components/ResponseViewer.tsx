import React, { useState } from 'react';
import type { ResponseData } from '../types';

interface ResponseViewerProps {
  response: ResponseData | null;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({ response }) => {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'cookies'>('body');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!response) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📡</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Response</h3>
          <p className="text-gray-500">Send a request to see the response here</p>
        </div>
      </div>
    );
  }

  const formatBody = (body: string) => {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response?.body || '');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = response?.body || '';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50 min-w-0" style={{ height: '100%', maxHeight: '100%' }}>
      {/* Response Status */}
      <div className="p-6 border-b border-slate-200 bg-white shadow-modern flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className={`text-xl font-bold ${getStatusColor(response.status)}`}>
              {response.status} {response.statusText}
            </span>
            <span className="text-sm text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-lg">
              {response.responseTime}ms
            </span>
            <span className="text-sm text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-lg">
              {formatSize(response.responseSize)}
            </span>
          </div>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              copySuccess
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200'
            }`}
            title="Copy response body to clipboard"
          >
            {copySuccess ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
        {[
          { id: 'body', label: 'Body' },
          { id: 'headers', label: 'Headers' },
          { id: 'cookies', label: 'Cookies' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ height: 'calc(100% - 120px)', maxHeight: 'calc(100% - 120px)' }}>
        {activeTab === 'body' && (
          <div className="p-6 h-full">
            <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm overflow-auto h-full relative">
              <button
                onClick={copyToClipboard}
                className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-semibold transition-all duration-200 ${
                  copySuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Copy JSON to clipboard"
              >
                {copySuccess ? '✓ Copied' : '📋 Copy'}
              </button>
              <pre className="whitespace-pre-wrap pr-16">{formatBody(response.body)}</pre>
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="p-4 h-full">
            <div className="space-y-2 h-full overflow-y-auto">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex items-start space-x-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-700 min-w-0 flex-shrink-0">
                    {key}:
                  </div>
                  <div className="text-gray-600 break-all">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="p-4">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🍪</div>
              <p>No cookies in this response</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;
