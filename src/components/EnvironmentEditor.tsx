import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Environment } from '../database';
import { useApp } from '../context/AppContext';

interface EnvironmentEditorProps {
  environment?: Environment;
  onClose: () => void;
}

const EnvironmentEditor: React.FC<EnvironmentEditorProps> = ({ environment, onClose }) => {
  const { createEnvironment, updateEnvironment, setActiveEnvironment } = useApp();
  const [name, setName] = useState(environment?.name || '');
  const [variables, setVariables] = useState<Record<string, string>>(environment?.variables || {});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [mounted, setMounted] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      if (environment) {
        await updateEnvironment(environment.id, { name, variables });
      } else {
        await createEnvironment(name, variables);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save environment:', error);
    }
  };

  const handleAddVariable = () => {
    if (newKey.trim() && newValue.trim()) {
      setVariables(prev => ({ ...prev, [newKey]: newValue }));
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemoveVariable = (key: string) => {
    setVariables(prev => {
      const newVars = { ...prev };
      delete newVars[key];
      return newVars;
    });
  };

  const handleSetActive = async () => {
    if (environment) {
      await setActiveEnvironment(environment.id);
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;


  return createPortal(
    <div 
      className="fixed inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center"
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
          margin: '0 1rem'
        }}
      >
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {environment ? 'Edit Environment' : 'Create Environment'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {environment ? 'Update environment variables' : 'Set up environment variables for your API requests'}
          </p>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Environment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              placeholder="Enter environment name"
            />
          </div>

          {/* Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables
            </label>
            
            {/* Add new variable */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Variable name"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Variable value"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
              <button
                onClick={handleAddVariable}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-modern"
              >
                Add
              </button>
            </div>

            {/* Variable list */}
            <div className="space-y-2">
              {Object.entries(variables).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700">{key}</span>
                  <span className="text-slate-400">=</span>
                  <span className="text-slate-600 flex-1">{value}</span>
                  <button
                    onClick={() => handleRemoveVariable(key)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between">
          <div>
            {environment && (
              <button
                onClick={handleSetActive}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-modern mr-3"
              >
                Set Active
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-modern"
            >
              {environment ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EnvironmentEditor;
