import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { RequestConfig } from '../types';
import { CodeGenService } from '../services/codeGenService';

interface CodeGeneratorProps {
  requestConfig: RequestConfig;
  onClose: () => void;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ requestConfig, onClose }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (mounted) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [mounted, onClose]);
  
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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '56rem',
          width: '100%',
          margin: '0 4rem'
        }}
      >
        <div className="p-20 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Generate Code Snippet</h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate code snippets for your API request in various programming languages
          </p>
        </div>
        
        <div className="p-20 space-y-8 overflow-y-auto max-h-[60vh]">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-4">
              Select Programming Language
            </label>
            <div className="flex space-x-3">
              {languages.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id as any)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selectedLanguage === lang.id
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-modern'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="mr-2">{lang.icon}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Code */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-slate-700">
                Generated Code
              </label>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-modern"
              >
                📋 Copy Code
              </button>
            </div>
            <div className="bg-slate-900 text-slate-100 rounded-xl p-6 font-mono text-sm overflow-auto max-h-96 border border-slate-700">
              <pre className="whitespace-pre-wrap">{generateCode()}</pre>
            </div>
          </div>
        </div>

        <div className="p-20 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CodeGenerator;
