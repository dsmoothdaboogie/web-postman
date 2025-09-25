import React, { useState, useEffect } from 'react';

interface SettingsDialogProps {
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const [proxyUrl, setProxyUrl] = useState('');
  const [enableProxy, setEnableProxy] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedProxyUrl = localStorage.getItem('webpostman-proxy-url') || '';
    const savedEnableProxy = localStorage.getItem('webpostman-enable-proxy') === 'true';
    
    setProxyUrl(savedProxyUrl);
    setEnableProxy(savedEnableProxy);
  }, []);

  const handleSave = () => {
    localStorage.setItem('webpostman-proxy-url', proxyUrl);
    localStorage.setItem('webpostman-enable-proxy', enableProxy.toString());
    alert('Settings saved successfully!');
    onClose();
  };

  const handleClear = () => {
    setProxyUrl('');
    setEnableProxy(false);
    localStorage.removeItem('webpostman-proxy-url');
    localStorage.removeItem('webpostman-enable-proxy');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Proxy Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Proxy Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableProxy"
                  checked={enableProxy}
                  onChange={(e) => setEnableProxy(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableProxy" className="ml-2 text-sm font-medium text-gray-700">
                  Enable Proxy
                </label>
              </div>
              
              <div>
                <label htmlFor="proxyUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Proxy URL
                </label>
                <input
                  type="url"
                  id="proxyUrl"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="https://your-proxy-server.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!enableProxy}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a proxy server URL to bypass CORS restrictions. 
                  Make sure the proxy server supports the target endpoints.
                </p>
              </div>
            </div>
          </div>

          {/* Other Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Other Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Auto-save requests
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically save requests to history
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Pretty print JSON
                  </label>
                  <p className="text-xs text-gray-500">
                    Format JSON responses automatically
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
