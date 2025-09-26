import React, { useState } from 'react';
import { ExportImportService } from '../services/exportImportService';
import PostmanImportExport from './PostmanImportExport';

interface ExportImportDialogProps {
  onClose: () => void;
  onImportComplete: () => void;
}

const ExportImportDialog: React.FC<ExportImportDialogProps> = ({ onClose, onImportComplete }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'curl' | 'postman'>('export');
  const [isLoading, setIsLoading] = useState(false);
  const [curlText, setCurlText] = useState('');

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await ExportImportService.exportToFile();
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      await ExportImportService.importFromFile();
      alert('Data imported successfully!');
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurlImport = async () => {
    if (!curlText.trim()) {
      alert('Please enter cURL commands');
      return;
    }

    setIsLoading(true);
    try {
      const requests = ExportImportService.generateCurlImport(curlText);
      if (requests.length === 0) {
        alert('No valid cURL commands found');
        return;
      }

      // Import requests to database
      const { db } = await import('../database');
      await db.requests.bulkAdd(requests);
      
      alert(`${requests.length} requests imported successfully!`);
      onImportComplete();
      onClose();
    } catch (error) {
      console.error('cURL import failed:', error);
      alert('cURL import failed. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'export', label: 'Export', icon: '📤' },
    { id: 'import', label: 'Import', icon: '📥' },
    { id: 'curl', label: 'cURL', icon: '🌐' },
    { id: 'postman', label: 'Postman', icon: '🚀' }
  ];

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Softer grey background
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
          maxWidth: '48rem',
          width: '100%',
          margin: '0 4rem'
        }}
      >
        <div className="p-20 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Export / Import</h2>
          <p className="text-sm text-slate-500 mt-1">
            Export your data or import from files
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-20">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-4">📤</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Export Data</h3>
                <p className="text-gray-600 mb-6">
                  Export all your collections, requests, and environments to a JSON file.
                </p>
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Exporting...' : 'Export Data'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-4">📥</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Import Data</h3>
                <p className="text-gray-600 mb-6">
                  Import collections, requests, and environments from a JSON file.
                  <br />
                  <strong className="text-red-600">Warning: This will replace all existing data!</strong>
                </p>
                <button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Importing...' : 'Import Data'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'curl' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Import cURL Commands</h3>
                <p className="text-gray-600">
                  Paste cURL commands to import them as requests.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  cURL Commands
                </label>
                <textarea
                  value={curlText}
                  onChange={(e) => setCurlText(e.target.value)}
                  placeholder="Paste your cURL commands here..."
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleCurlImport}
                  disabled={isLoading || !curlText.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Importing...' : 'Import cURL'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'postman' && (
            <PostmanImportExport
              onClose={() => {
                onImportComplete();
                onClose();
              }}
            />
          )}
        </div>

        {activeTab !== 'postman' && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportImportDialog;
