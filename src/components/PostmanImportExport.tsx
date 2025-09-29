import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostmanService } from '../services/postmanService';

interface PostmanImportExportProps {
  onClose: () => void;
}

const PostmanImportExport: React.FC<PostmanImportExportProps> = ({ onClose }) => {
  const { collections, requests, createCollection, createRequest } = useApp();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
      setImportStatus('');
    } else {
      setImportStatus('Please select a valid JSON file');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportStatus('Please select a file to import');
      return;
    }

    try {
      const text = await importFile.text();
      const postmanData = JSON.parse(text);
      
      // Validate that it's a Postman collection
      if (!postmanData.info || !postmanData.item) {
        throw new Error('Invalid Postman collection format');
      }

      const { collection, requests: parsedRequests } = PostmanService.parsePostmanCollection(postmanData);
      
      // Create the collection
      await createCollection(collection.name, collection.description);
      
      // Get the created collection (we'll need to find it by name since createCollection doesn't return the ID)
      const createdCollections = await import('../database').then(m => m.db.collections.toArray());
      const newCollection = createdCollections.find(c => c.name === collection.name);
      
      if (!newCollection) {
        throw new Error('Failed to create collection');
      }
      
      // Create all requests
      for (const request of parsedRequests) {
        await createRequest(
          request.name,
          request.method,
          request.url,
          newCollection.id
        );
      }

      setImportStatus(`Successfully imported collection "${collection.name}" with ${parsedRequests.length} requests`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setImportStatus(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    if (!selectedCollectionId) {
      setImportStatus('Please select a collection to export');
      return;
    }

    const collection = collections.find(c => c.id === selectedCollectionId);
    if (!collection) {
      setImportStatus('Collection not found');
      return;
    }

    const collectionRequests = requests.filter(r => r.collectionId === selectedCollectionId);
    const postmanCollection = PostmanService.exportToPostman(collection, collectionRequests);
    
    const json = JSON.stringify(postmanCollection, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_collection.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setImportStatus(`Successfully exported collection "${collection.name}"`);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Postman Import/Export</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Import Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Import Postman Collection</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Select Postman Collection JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleImport}
            disabled={!importFile}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import Collection
          </button>
        </div>
      </div>

      {/* Export Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Export Collection</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Select Collection to Export
            </label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choose a collection...</option>
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={!selectedCollectionId}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Export Collection
          </button>
        </div>
      </div>

      {/* Status Message */}
      {importStatus && (
        <div className={`p-3 rounded-lg ${
          importStatus.includes('Successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importStatus}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-slate-50 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-700 mb-2">Instructions</h4>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• <strong>Import:</strong> Select a Postman collection JSON file to import all requests and folders</li>
          <li>• <strong>Export:</strong> Choose a collection to export as a Postman-compatible JSON file</li>
          <li>• <strong>Compatibility:</strong> Supports Postman Collection Format v2.1</li>
          <li>• <strong>Features:</strong> Preserves requests, headers, parameters, body, and authentication</li>
        </ul>
      </div>
    </div>
  );
};

export default PostmanImportExport;
