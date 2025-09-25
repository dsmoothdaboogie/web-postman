import React, { useState } from 'react';
import type { Tab } from '../types';
import CodeGenerator from './CodeGenerator';
import ExportImportDialog from './ExportImportDialog';
import PostmanImportExport from './PostmanImportExport';
import SettingsDialog from './SettingsDialog';

interface TopBarProps {
  tabs: Tab[];
  activeTabId: string;
  onNewTab: () => void;
  onNewWebSocketTab?: () => void;
  onNewSSETab?: () => void;
  onTabClose: (tabId: string) => void;
  onTabSelect: (tabId: string) => void;
  onGenerateCode?: (requestConfig: any) => void;
  onImportComplete?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  tabs,
  activeTabId,
  onNewTab,
  onNewWebSocketTab,
  onNewSSETab,
  onTabClose,
  onTabSelect,
  onGenerateCode,
  onImportComplete
}) => {
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showPostmanImportExport, setShowPostmanImportExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentRequestConfig, setCurrentRequestConfig] = useState<any>(null);
  return (
    <div className="bg-white border-b border-slate-200 flex items-center shadow-modern">
      {/* Tabs */}
      <div className="flex-1 flex items-center overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center px-6 py-4 border-r border-slate-200 cursor-pointer group transition-all duration-200 ${
              tab.id === activeTabId
                ? 'bg-orange-50 border-b-2 border-orange-500 text-orange-700 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
            onClick={() => onTabSelect(tab.id)}
          >
            <span className="text-sm font-semibold mr-3">
              {tab.name}
            </span>
            {tab.isDirty && (
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            )}
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="ml-3 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-slate-200"
              >
                ×
              </button>
            )}
          </div>
        ))}
        
        {/* New Tab Buttons */}
        <div className="flex border-l border-slate-200">
          <button
            onClick={onNewTab}
            className="px-5 py-4 text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 font-semibold"
            title="New HTTP Request"
          >
            <span className="text-lg">+</span>
          </button>
          {onNewWebSocketTab && (
            <button
              onClick={onNewWebSocketTab}
              className="px-5 py-4 text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200"
              title="New WebSocket"
            >
              🔌
            </button>
          )}
          {onNewSSETab && (
            <button
              onClick={onNewSSETab}
              className="px-5 py-4 text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200"
              title="New SSE"
            >
              📡
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 px-6 border-l border-slate-200">
        <button 
          onClick={() => {
            if (onGenerateCode) {
              onGenerateCode((config: any) => {
                setCurrentRequestConfig(config);
                setShowCodeGenerator(true);
              });
            }
          }}
          className="p-3 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 shadow-modern"
          title="Generate Code"
        >
          💻
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 shadow-modern"
          title="Settings"
        >
          ⚙️
        </button>
        <button 
          onClick={() => setShowPostmanImportExport(true)}
          className="p-3 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 shadow-modern"
          title="Postman Import/Export"
        >
          📥
        </button>
        <button 
          onClick={() => setShowExportImport(true)}
          className="p-3 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 shadow-modern"
          title="Export/Import"
        >
          📤
        </button>
      </div>
      
      {showCodeGenerator && currentRequestConfig && (
        <CodeGenerator
          requestConfig={currentRequestConfig}
          onClose={() => {
            setShowCodeGenerator(false);
            setCurrentRequestConfig(null);
          }}
        />
      )}
      
      {showExportImport && (
        <ExportImportDialog
          onClose={() => setShowExportImport(false)}
          onImportComplete={() => {
            setShowExportImport(false);
            if (onImportComplete) {
              onImportComplete();
            }
          }}
        />
      )}
      
      {showPostmanImportExport && (
        <PostmanImportExport
          onClose={() => setShowPostmanImportExport(false)}
        />
      )}
      
      {showSettings && (
        <SettingsDialog
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default TopBar;
