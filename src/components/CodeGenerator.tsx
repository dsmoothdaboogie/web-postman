import React, { useState } from 'react';
import type { RequestConfig } from '../types';
import { CodeGenService } from '../services/codeGenService';

interface CodeGeneratorProps {
  requestConfig: RequestConfig;
  onClose: () => void;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ requestConfig, onClose }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  
  const generateCode = () => {
    switch (selectedLanguage) {
      case 'curl':
        return CodeGenService.generateCurl(requestConfig);
      case 'javascript':
        return CodeGenService.generateJavaScript(requestConfig);
      case 'python':
        return CodeGenService.generatePython(requestConfig);
      default:
        return '';
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateCode());
      alert('Code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const languages = [
    { id: 'curl', label: 'cURL', icon: '🌐' },
    { id: 'javascript', label: 'JavaScript', icon: '🟨' },
    { id: 'python', label: 'Python', icon: '🐍' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-10 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Generate Code</h2>
        </div>
        
        <div className="p-10">
          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Language
            </label>
            <div className="flex space-x-2">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedLanguage === lang.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{lang.icon}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Code */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Generated Code
              </label>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <pre>{generateCode()}</pre>
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeGenerator;
