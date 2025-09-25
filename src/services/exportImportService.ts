import type { Collection, Request, Environment } from '../database';

export interface ExportData {
  collections: Collection[];
  requests: Request[];
  environments: Environment[];
  version: string;
  exportedAt: string;
}

export class ExportImportService {
  static async exportData(): Promise<ExportData> {
    const { db } = await import('../database');
    
    const [collections, requests, environments] = await Promise.all([
      db.collections.toArray(),
      db.requests.toArray(),
      db.environments.toArray()
    ]);

    return {
      collections,
      requests,
      environments,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
  }

  static async importData(data: ExportData): Promise<void> {
    const { db } = await import('../database');
    
    // Clear existing data
    await Promise.all([
      db.collections.clear(),
      db.requests.clear(),
      db.environments.clear()
    ]);

    // Import new data
    await Promise.all([
      db.collections.bulkAdd(data.collections),
      db.requests.bulkAdd(data.requests),
      db.environments.bulkAdd(data.environments)
    ]);
  }

  static async exportToFile(): Promise<void> {
    const data = await this.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `webpostman-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async importFromFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text) as ExportData;
          
          // Validate data structure
          if (!data.collections || !data.requests || !data.environments) {
            throw new Error('Invalid export file format');
          }

          await this.importData(data);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      input.click();
    });
  }

  static generateCurlImport(text: string): Request[] {
    const requests: Request[] = [];
    const lines = text.split('\n');
    let currentRequest: Partial<Request> | null = null;
    let requestIndex = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('curl ')) {
        // Save previous request if exists
        if (currentRequest && currentRequest.url) {
          requests.push({
            id: `imported-${requestIndex++}`,
            name: currentRequest.url,
            method: currentRequest.method || 'GET',
            url: currentRequest.url,
            headers: currentRequest.headers || {},
            params: currentRequest.params || {},
            bodyType: 'raw',
            order: requestIndex - 1,
            createdAt: new Date(),
            updatedAt: new Date()
          } as Request);
        }

        // Start new request
        currentRequest = {
          method: 'GET',
          headers: {},
          params: {}
        };

        // Extract URL
        const urlMatch = trimmedLine.match(/-X\s+(\w+)\s+['"]([^'"]+)['"]/);
        if (urlMatch) {
          currentRequest.method = urlMatch[1] as any;
          currentRequest.url = urlMatch[2];
        } else {
          const urlMatch2 = trimmedLine.match(/['"]([^'"]+)['"]/);
          if (urlMatch2) {
            currentRequest.url = urlMatch2[1];
          }
        }
      } else if (trimmedLine.startsWith('-H ')) {
        // Extract header
        const headerMatch = trimmedLine.match(/-H\s+['"]([^:]+):\s*([^'"]+)['"]/);
        if (headerMatch && currentRequest) {
          currentRequest.headers = currentRequest.headers || {};
          currentRequest.headers[headerMatch[1]] = headerMatch[2];
        }
      } else if (trimmedLine.startsWith('-d ')) {
        // Extract body
        const bodyMatch = trimmedLine.match(/-d\s+['"]([^'"]+)['"]/);
        if (bodyMatch && currentRequest) {
          currentRequest.body = bodyMatch[1];
        }
      }
    }

    // Add last request
    if (currentRequest && currentRequest.url) {
      requests.push({
        id: `imported-${requestIndex++}`,
        name: currentRequest.url,
        method: currentRequest.method || 'GET',
        url: currentRequest.url,
        headers: currentRequest.headers || {},
        params: currentRequest.params || {},
        bodyType: 'raw',
        order: requestIndex - 1,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Request);
    }

    return requests;
  }
}
