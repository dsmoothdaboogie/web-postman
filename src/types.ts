export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type BodyType = 'raw' | 'form-data' | 'x-www-form-urlencoded';

export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key';

export interface AuthConfig {
  type: AuthType;
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
}

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body?: string;
  bodyType: BodyType;
  auth?: AuthConfig;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  responseSize: number;
}

export interface Tab {
  id: string;
  name: string;
  type: 'request' | 'websocket' | 'sse';
  requestId?: string;
  isActive: boolean;
  isDirty: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  activeEnvironmentId?: string;
  tabs: Tab[];
  activeTabId?: string;
}
