import React, { useState, useEffect } from 'react';
import type { Tab, RequestConfig, HttpMethod, BodyType, AuthType } from '../types';
import type { Request } from '../database';

interface RequestBuilderProps {
  tab: Tab;
  onSendRequest: (config: RequestConfig) => void;
  isLoading: boolean;
  onGetRequestConfig?: ((getter: (config: any) => void) => void) | null;
  initialData?: Partial<Request> | null;
}

const RequestBuilder: React.FC<RequestBuilderProps> = ({
  onSendRequest,
  isLoading,
  onGetRequestConfig,
  initialData
}) => {
  const [method, setMethod] = useState<HttpMethod>(initialData?.method as HttpMethod || 'GET');
  const [url, setUrl] = useState(initialData?.url || '');
  const [headers, setHeaders] = useState<Record<string, string>>(initialData?.headers || {});
  const [params, setParams] = useState<Record<string, string>>(initialData?.params || {});
  const [body, setBody] = useState(initialData?.body || '');
  const [bodyType, setBodyType] = useState<BodyType>(initialData?.bodyType as BodyType || 'raw');
  const [auth, setAuth] = useState<AuthType>(initialData?.auth?.type as AuthType || 'none');
  const [authConfig, setAuthConfig] = useState({
    token: initialData?.auth?.token || '',
    username: initialData?.auth?.username || '',
    password: initialData?.auth?.password || '',
    key: initialData?.auth?.key || '',
    value: initialData?.auth?.value || ''
  });

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  // Update form fields when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('RequestBuilder received initial data:', initialData);
      setMethod(initialData.method as HttpMethod || 'GET');
      setUrl(initialData.url || '');
      setHeaders(initialData.headers || {});
      setParams(initialData.params || {});
      setBody(initialData.body || '');
      setBodyType(initialData.bodyType as BodyType || 'raw');
      setAuth(initialData.auth?.type as AuthType || 'none');
      setAuthConfig({
        token: initialData.auth?.token || '',
        username: initialData.auth?.username || '',
        password: initialData.auth?.password || '',
        key: initialData.auth?.key || '',
        value: initialData.auth?.value || ''
      });
      console.log('RequestBuilder form fields updated with initial data');
    }
  }, [initialData]);

  // Register the getter function
  useEffect(() => {
    if (onGetRequestConfig) {
      onGetRequestConfig(() => {
        return {
          method,
          url,
          headers,
          params,
          body: body || undefined,
          bodyType,
          auth: auth !== 'none' ? {
            type: auth,
            ...authConfig
          } : undefined
        };
      });
    }
  }, [method, url, headers, params, body, bodyType, auth, authConfig, onGetRequestConfig]);

  const handleSend = () => {
    const config: RequestConfig = {
      method,
      url,
      headers,
      params,
      body: body || undefined,
      bodyType,
      auth: auth !== 'none' ? {
        type: auth,
        ...authConfig
      } : undefined
    };
    onSendRequest(config);
  };

  const addHeader = () => {
    const key = prompt('Header name:');
    const value = prompt('Header value:');
    if (key && value) {
      setHeaders(prev => ({ ...prev, [key]: value }));
    }
  };

  const addParam = () => {
    const key = prompt('Parameter name:');
    const value = prompt('Parameter value:');
    if (key && value) {
      setParams(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Request Line */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center space-x-4">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className={`px-4 py-3 border border-slate-300 rounded-xl text-sm font-bold method-${method.toLowerCase()} bg-white shadow-modern focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200`}
          >
            {methods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-modern transition-all duration-200"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !url}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all duration-200 shadow-modern-lg"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        {['Params', 'Headers', 'Body', 'Auth'].map(tabName => (
          <button
            key={tabName}
            className="px-6 py-4 text-sm font-semibold text-slate-600 hover:text-slate-800 border-b-2 border-transparent hover:border-orange-300 hover:bg-slate-50 transition-all duration-200"
          >
            {tabName}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto min-h-0">
        {/* Params */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Query Parameters</h3>
            <button
              onClick={addParam}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(params).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={key}
                  readOnly
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={value}
                  readOnly
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button className="text-red-600 hover:text-red-800">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Headers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Headers</h3>
            <button
              onClick={addHeader}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(headers).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={key}
                  readOnly
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={value}
                  readOnly
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button className="text-red-600 hover:text-red-800">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Body</h3>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value as BodyType)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="raw">raw</option>
              <option value="form-data">form-data</option>
              <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
            </select>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter request body"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
          />
        </div>

        {/* Auth */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Authorization</h3>
          <select
            value={auth}
            onChange={(e) => setAuth(e.target.value as AuthType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="none">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="api-key">API Key</option>
          </select>
          
          {auth === 'bearer' && (
            <input
              type="text"
              value={authConfig.token}
              onChange={(e) => setAuthConfig(prev => ({ ...prev, token: e.target.value }))}
              placeholder="Enter token"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          )}
          
          {auth === 'basic' && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={authConfig.username}
                onChange={(e) => setAuthConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="password"
                value={authConfig.password}
                onChange={(e) => setAuthConfig(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
          
          {auth === 'api-key' && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={authConfig.key}
                onChange={(e) => setAuthConfig(prev => ({ ...prev, key: e.target.value }))}
                placeholder="Key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                value={authConfig.value}
                onChange={(e) => setAuthConfig(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestBuilder;
