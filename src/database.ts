import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // for folders
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Request {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body?: string;
  bodyType: 'raw' | 'form-data' | 'x-www-form-urlencoded';
  auth?: {
    type: 'none' | 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
  };
  collectionId?: string;
  folderId?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryEntry {
  id: string;
  requestId?: string;
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: string;
  bodyType?: string;
  auth?: {
    type: string;
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
  };
  status?: number;
  statusText?: string;
  responseTime?: number;
  responseSize?: number;
  timestamp: Date;
}

export interface Response {
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  responseSize: number;
  timestamp: Date;
}

export class WebPostmanDB extends Dexie {
  collections!: Table<Collection>;
  requests!: Table<Request>;
  environments!: Table<Environment>;
  history!: Table<HistoryEntry>;
  responses!: Table<Response>;

  constructor() {
    super('WebPostmanDB');
    this.version(1).stores({
      collections: 'id, name, parentId, order, createdAt',
      requests: 'id, name, method, collectionId, folderId, order, createdAt',
      environments: 'id, name, isActive, createdAt',
      history: 'id, requestId, method, url, status, timestamp',
      responses: 'id, requestId, timestamp'
    });
  }
}

export const db = new WebPostmanDB();
