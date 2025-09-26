import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostmanService } from '../services/postmanService';

interface PostmanImportExportProps {
  onClose: () => void;
}

const PostmanImportExport: React.FC<PostmanImportExportProps> = ({ onClose }) => {
  const { collections, requests, createCollection, createRequest } = useApp();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      const postmanJson = JSON.parse(text);
      
      const { collection, requests: importedRequests } = await PostmanService.importCollection(postmanJson);
      
      // Create the collection
      await createCollection(collection.name, collection.description);
      
      // Create all requests
      for (const request of importedRequests) {
        await createRequest(request.name, request.method, request.url, collection.id);
      }

      setImportSuccess(`Successfully imported "${collection.name}" with ${importedRequests.length} requests!`);
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import collection');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      const postmanJson = PostmanService.exportToPostman(collections, requests);
      
      // Create and download the file
      const blob = new Blob([postmanJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'webpostman-collections.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setTimeout(() => setIsExporting(false), 1000);
    } catch (error) {
      console.error('Export error:', error);
      setImportError('Failed to export collections');
      setIsExporting(false);
    }
  };

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
        <div className="p-20">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 -m-20 p-20 mb-20">
          <h2 className="text-xl font-bold text-slate-800">
            Import/Export Collections
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Import Postman collections or export your collections to Postman format
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Import Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Import from Postman</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Select Postman Collection File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                />
              </div>
              
              {isImporting && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  <span className="text-sm">Importing collection...</span>
                </div>
              )}

              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{importError}</p>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{importSuccess}</p>
                </div>
              )}
            </div>
          </div>

          {/* Export Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Export to Postman</h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Export your collections in Postman format. This will create a JSON file that you can import into Postman.
              </p>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">Export Collections</p>
                  <p className="text-sm text-slate-500">
                    {collections.length} collection{collections.length !== 1 ? 's' : ''} with {requests.length} request{requests.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  disabled={isExporting || collections.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-modern"
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>

              {collections.length === 0 && (
                <p className="text-sm text-slate-500 italic">
                  No collections to export. Create some collections first.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 -m-20 p-20 mt-20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
          >
            Close
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PostmanImportExport;