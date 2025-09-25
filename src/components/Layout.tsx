import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { HttpService } from '../services/httpService';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import RequestBuilder from './RequestBuilder';
import ResponseViewer from './ResponseViewer';
import WebSocketClient from './WebSocketClient';
import SSEClient from './SSEClient';
import ResizablePanel from './ResizablePanel';

const LayoutContent: React.FC = () => {
  const { tabs, activeTabId, createTab, closeTab, selectTab, addToHistory, activeEnvironment, initialRequestData, clearInitialRequestData } = useApp();
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [getCurrentRequestConfig, setGetCurrentRequestConfig] = useState<((config: any) => void) | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('webpostman-sidebar-width');
    return saved ? parseInt(saved, 10) : 288;
  });
  const [responseWidth, setResponseWidth] = useState(() => {
    const saved = localStorage.getItem('webpostman-response-width');
    return saved ? parseInt(saved, 10) : 400;
  });

  const handleImportComplete = () => {
    // Reload the app context to refresh data
    window.location.reload();
  };

  const handleSidebarWidthChange = (width: number) => {
    setSidebarWidth(width);
    localStorage.setItem('webpostman-sidebar-width', width.toString());
  };

  const handleResponseWidthChange = (width: number) => {
    setResponseWidth(width);
    localStorage.setItem('webpostman-response-width', width.toString());
  };

  // Clear initial request data after it's been used
  useEffect(() => {
    if (initialRequestData) {
      // Clear the initial data after a short delay to ensure it's been used
      const timer = setTimeout(() => {
        clearInitialRequestData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialRequestData, clearInitialRequestData]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleNewTab = () => {
    createTab();
  };

  const handleNewWebSocketTab = () => {
    createTab();
    // TODO: Set tab type to websocket
  };

  const handleNewSSETab = () => {
    createTab();
    // TODO: Set tab type to sse
  };

  const handleTabClose = (tabId: string) => {
    closeTab(tabId);
  };

  const handleTabSelect = (tabId: string) => {
    selectTab(tabId);
  };

  const handleSendRequest = async (requestConfig: any) => {
    setIsLoading(true);
    try {
      // Interpolate variables if active environment exists
      let processedConfig = { ...requestConfig };
      if (activeEnvironment) {
        processedConfig.url = HttpService.interpolateVariables(requestConfig.url, activeEnvironment.variables);
        processedConfig.body = requestConfig.body ? HttpService.interpolateVariables(requestConfig.body, activeEnvironment.variables) : undefined;
        
        // Interpolate headers
        const processedHeaders: Record<string, string> = {};
        Object.entries(requestConfig.headers).forEach(([key, value]) => {
          processedHeaders[key] = HttpService.interpolateVariables(value as string, activeEnvironment.variables);
        });
        processedConfig.headers = processedHeaders;
      }

      const response = await HttpService.sendRequest(processedConfig);
      setResponse(response);
      
      // Add to history
      await addToHistory({
        name: requestConfig.url,
        method: requestConfig.method,
        url: requestConfig.url,
        headers: requestConfig.headers,
        params: requestConfig.params,
        body: requestConfig.body,
        bodyType: requestConfig.bodyType,
        auth: requestConfig.auth,
        status: response.status,
        statusText: response.statusText,
        responseTime: response.responseTime,
        responseSize: response.responseSize
      });
    } catch (error) {
      console.error('Request failed:', error);
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: error instanceof Error ? error.message : 'Unknown error',
        responseTime: 0,
        responseSize: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Resizable Sidebar */}
      <ResizablePanel
        initialWidth={sidebarWidth}
        minWidth={200}
        maxWidth={500}
        onWidthChange={handleSidebarWidthChange}
        className="flex-shrink-0"
        resizeHandle="right"
      >
        <Sidebar />
      </ResizablePanel>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white shadow-modern min-w-0">
        {/* TopBar */}
        <div className="flex-shrink-0">
          <TopBar
            tabs={tabs}
            activeTabId={activeTabId || ''}
            onNewTab={handleNewTab}
            onNewWebSocketTab={handleNewWebSocketTab}
            onNewSSETab={handleNewSSETab}
            onTabClose={handleTabClose}
            onTabSelect={handleTabSelect}
            onGenerateCode={setGetCurrentRequestConfig}
            onImportComplete={handleImportComplete}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex border-t border-slate-200 min-h-0">
          {/* Request Builder */}
          <div className="flex-1 bg-white min-h-0">
            {activeTab && (
              <>
                {activeTab.type === 'request' && (
                  <RequestBuilder
                    tab={activeTab}
                    onSendRequest={handleSendRequest}
                    isLoading={isLoading}
                    onGetRequestConfig={getCurrentRequestConfig}
                    initialData={initialRequestData}
                  />
                )}
                {activeTab.type === 'websocket' && (
                  <WebSocketClient onClose={() => closeTab(activeTab.id)} />
                )}
                {activeTab.type === 'sse' && (
                  <SSEClient onClose={() => closeTab(activeTab.id)} />
                )}
              </>
            )}
          </div>

          {/* Resizable Response Panel */}
          {activeTab?.type === 'request' && (
            <ResizablePanel
              initialWidth={responseWidth}
              minWidth={300}
              maxWidth={800}
              onWidthChange={handleResponseWidthChange}
              className="flex-shrink-0"
              resizeHandle="left"
            >
              <div className="h-full border-l border-slate-200 bg-slate-50/50">
                <ResponseViewer response={response} />
              </div>
            </ResizablePanel>
          )}
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  return (
    <AppProvider>
      <LayoutContent />
    </AppProvider>
  );
};

export default Layout;
