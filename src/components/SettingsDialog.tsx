import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SettingsDialogProps {
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const [proxyUrl, setProxyUrl] = useState('');
  const [enableProxy, setEnableProxy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load settings from localStorage
    const savedProxyUrl = localStorage.getItem('webpostman-proxy-url') || '';
    const savedEnableProxy = localStorage.getItem('webpostman-enable-proxy') === 'true';
    
    setProxyUrl(savedProxyUrl);
    setEnableProxy(savedEnableProxy);
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '32rem',
          width: '100%',
          margin: '0 4rem'
        }}
      >
        <div className="p-20 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Settings & Preferences</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure your application settings and preferences
          </p>
        </div>
        
        <div className="p-20 space-y-8 overflow-y-auto max-h-[60vh]">
          {/* Proxy Settings */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Proxy Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableProxy"
                  checked={enableProxy}
                  onChange={(e) => setEnableProxy(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="enableProxy" className="ml-2 text-sm font-medium text-slate-700">
                  Enable Proxy
                </label>
              </div>
              
              <div>
                <label htmlFor="proxyUrl" className="block text-sm font-medium text-slate-700 mb-2">
                  Proxy URL
                </label>
                <input
                  type="url"
                  id="proxyUrl"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="https://your-proxy-server.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  disabled={!enableProxy}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Enter a proxy server URL to bypass CORS restrictions. 
                  Make sure the proxy server supports the target endpoints.
                </p>
              </div>
            </div>
          </div>

          {/* Other Settings */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Other Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Auto-save requests
                  </label>
                  <p className="text-xs text-slate-500">
                    Automatically save requests to history
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Pretty print JSON
                  </label>
                  <p className="text-xs text-slate-500">
                    Format JSON responses automatically
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-20 border-t border-slate-200 bg-slate-50 flex justify-between">
          <button
            onClick={handleClear}
            className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 font-semibold"
          >
            Reset
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-modern"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsDialog;
