import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import EnvironmentEditor from './EnvironmentEditor';
import type { Environment, Request } from '../database';

const Sidebar: React.FC = () => {
  const {
    collections,
    requests,
    environments,
    history,
    createCollection,
    createRequest,
    deleteCollection,
    deleteRequest,
    clearHistory,
    createTab
  } = useApp();
  const [activeSection, setActiveSection] = useState<'collections' | 'history' | 'environments'>('collections');
  const [showEnvironmentEditor, setShowEnvironmentEditor] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | undefined>(undefined);

  const sections = [
    { id: 'collections', label: 'Collections', icon: '📁', tooltip: 'Manage API collections and requests' },
    { id: 'history', label: 'History', icon: '🕒', tooltip: 'View and re-run previous requests' },
    { id: 'environments', label: 'Environments', icon: '🌍', tooltip: 'Manage environment variables' }
  ];

  const handleCreateCollection = () => {
    const name = prompt('Collection name:');
    if (name) {
      createCollection(name);
    }
  };

  const handleCreateRequestInCollection = async (collectionId: string) => {
    const name = prompt('Request name:');
    if (name) {
      const method = prompt('HTTP Method (GET, POST, etc.):', 'GET') || 'GET';
      const url = prompt('Request URL:') || '';
      if (url) {
        await createRequest(name, method, url, collectionId);
      }
    }
  };

  const handleDeleteCollection = async (collectionId: string, collectionName: string) => {
    if (confirm(`Are you sure you want to delete the collection "${collectionName}"? This will also delete all requests in this collection.`)) {
      await deleteCollection(collectionId);
    }
  };

  const handleDeleteRequest = async (requestId: string, requestName: string) => {
    if (confirm(`Are you sure you want to delete the request "${requestName}"?`)) {
      await deleteRequest(requestId);
    }
  };

  const handleCreateEnvironment = () => {
    setEditingEnvironment(undefined);
    setShowEnvironmentEditor(true);
  };

  const handleEditEnvironment = (environment: Environment) => {
    setEditingEnvironment(environment);
    setShowEnvironmentEditor(true);
  };

  const handleCloseEnvironmentEditor = () => {
    setShowEnvironmentEditor(false);
    setEditingEnvironment(undefined);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      clearHistory();
    }
  };

  const handleReRunRequest = (entry: any) => {
    console.log('Re-running request from history:', entry);
    
    // Create a new tab with the history entry data
    const initialData: Partial<Request> = {
      name: entry.name,
      method: entry.method as any,
      url: entry.url,
      headers: entry.headers || {},
      params: entry.params || {},
      body: entry.body || '',
      bodyType: (entry.bodyType as any) || 'raw',
      auth: entry.auth ? {
        type: entry.auth.type as any,
        token: entry.auth.token,
        username: entry.auth.username,
        password: entry.auth.password,
        key: entry.auth.key,
        value: entry.auth.value
      } : undefined
    };
    
    console.log('Initial data for new tab:', initialData);
    createTab(undefined, initialData);
  };

  return (
    <div className="h-full bg-slate-50 border-r border-slate-200 flex flex-col shadow-modern">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div>
          <h1 className="text-xl font-bold text-slate-800">WebPostman</h1>
          <p className="text-xs text-slate-500 font-medium">API Testing Tool</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-slate-200 bg-white">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all duration-200 ${
              activeSection === section.id
                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title={section.tooltip || section.label}
          >
            <span className="mr-2 text-base">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full">
          {activeSection === 'collections' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Collections</h3>
                <button 
                  onClick={handleCreateCollection}
                  className="px-3 py-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm font-semibold rounded-lg transition-all duration-200"
                  title="Create new collection"
                >
                  + New
                </button>
              </div>
                     <div className="space-y-2">
                       {collections.length === 0 ? (
                         <div className="text-center py-12">
                           <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                             <span className="text-2xl">📁</span>
                           </div>
                           <p className="text-slate-600 text-sm font-medium">No collections yet</p>
                           <p className="text-slate-400 text-xs mt-1">Create your first collection</p>
                         </div>
                       ) : (
                         collections.map(collection => {
                           const collectionRequests = requests.filter(req => req.collectionId === collection.id);
                           return (
                             <div key={collection.id} className="space-y-1">
                               {/* Collection Header */}
                               <div className="flex items-center justify-between p-3 hover:bg-slate-100 rounded-xl cursor-pointer group transition-all duration-200">
                                 <div className="flex items-center space-x-3">
                                   <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                                     <span className="text-slate-600 text-sm">📁</span>
                                   </div>
                                   <div className="flex flex-col">
                                     <span className="text-sm text-slate-700 font-semibold sidebar-item-text">{collection.name}</span>
                                     <span className="text-xs text-slate-500">{collectionRequests.length} requests</span>
                                   </div>
                                 </div>
                                 <div className="flex items-center space-x-1">
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleCreateRequestInCollection(collection.id);
                                     }}
                                     className="text-slate-400 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-orange-50"
                                     title="Add request to collection"
                                   >
                                     +
                                   </button>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleDeleteCollection(collection.id, collection.name);
                                     }}
                                     className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-red-50"
                                     title="Delete collection"
                                   >
                                     ×
                                   </button>
                                 </div>
                               </div>
                               
                               {/* Collection Requests */}
                               {collectionRequests.length > 0 && (
                                 <div className="ml-6 space-y-1">
                                   {collectionRequests.map(request => (
                                     <div 
                                       key={request.id} 
                                       className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer group transition-all duration-200"
                                       onClick={() => {
                                         const initialData: Partial<Request> = {
                                           name: request.name,
                                           method: request.method as any,
                                           url: request.url,
                                           headers: request.headers,
                                           params: request.params,
                                           body: request.body || '',
                                           bodyType: request.bodyType as any,
                                           auth: request.auth
                                         };
                                         createTab(undefined, initialData);
                                       }}
                                     >
                                       <div className="flex items-center space-x-2">
                                         <span className={`px-2 py-1 text-xs rounded font-semibold ${
                                           request.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                                           request.method === 'POST' ? 'bg-green-100 text-green-800' :
                                           request.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                                           request.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                           'bg-slate-100 text-slate-800'
                                         }`}>
                                           {request.method}
                                         </span>
                                         <span className="text-sm text-slate-600 sidebar-item-text">{request.name}</span>
                                       </div>
                                       <button 
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           handleDeleteRequest(request.id, request.name);
                                         }}
                                         className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-red-50"
                                         title="Delete request"
                                       >
                                         ×
                                       </button>
                                     </div>
                                   ))}
                                 </div>
                               )}
                             </div>
                           );
                         })
                       )}
                     </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">History</h3>
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm font-semibold rounded-lg transition-all duration-200"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🕒</span>
                    </div>
                    <p className="text-slate-600 text-sm font-medium">No requests yet</p>
                    <p className="text-slate-400 text-xs mt-1">Your request history will appear here</p>
                  </div>
                ) : (
                  history.map(entry => (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-3 hover:bg-slate-100 rounded-xl cursor-pointer group transition-all duration-200"
                      onClick={() => handleReRunRequest(entry)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className={`px-2 py-1 text-xs rounded font-semibold ${
                          entry.status && entry.status >= 200 && entry.status < 300
                            ? 'bg-green-100 text-green-800'
                            : entry.status && entry.status >= 400
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {entry.method}
                        </span>
                        <span className="text-sm text-slate-700 font-semibold sidebar-item-text">{entry.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === 'environments' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Environments</h3>
                <button
                  onClick={handleCreateEnvironment}
                  className="px-3 py-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm font-semibold rounded-lg transition-all duration-200"
                >
                  + New
                </button>
              </div>
              <div className="space-y-2">
                {environments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🌍</span>
                    </div>
                    <p className="text-slate-600 text-sm font-medium">No environments yet</p>
                    <p className="text-slate-400 text-xs mt-1">Create your first environment</p>
                  </div>
                ) : (
                  environments.map(env => (
                    <div key={env.id} className="flex items-center justify-between p-3 hover:bg-slate-100 rounded-xl cursor-pointer group transition-all duration-200">
                      <div
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                        onClick={() => handleEditEnvironment(env)}
                      >
                        <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                          <span className="text-slate-600 text-sm">🌍</span>
                        </div>
                        <span className="text-sm text-slate-700 font-semibold sidebar-item-text">{env.name}</span>
                        {env.isActive && (
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-slate-200">
                        ⋯
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showEnvironmentEditor && (
        <EnvironmentEditor
          environment={editingEnvironment}
          onClose={handleCloseEnvironmentEditor}
        />
      )}
    </div>
  );
};

export default Sidebar;
