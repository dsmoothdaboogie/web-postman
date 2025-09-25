import type { Collection, Request } from '../database';

export class PostmanService {
  /**
   * Import a Postman collection JSON and convert it to our app's format
   */
  static async importCollection(postmanJson: any): Promise<{ collection: Collection; requests: Request[] }> {
    try {
      // Validate the collection structure
      if (!postmanJson || !postmanJson.info) {
        throw new Error('Invalid Postman collection format');
      }

      // Create our collection
      const collection: Collection = {
        id: Date.now().toString(),
        name: postmanJson.info.name || 'Imported Collection',
        description: typeof postmanJson.info.description === 'string' 
          ? postmanJson.info.description 
          : postmanJson.info.description?.content || '',
        parentId: '',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const requests: Request[] = [];
      
      // Process all items in the collection
      if (postmanJson.item && Array.isArray(postmanJson.item)) {
        postmanJson.item.forEach((item: any) => {
          if (item.request) {
            const request = this.convertPostmanRequestToAppRequest(item, collection.id);
            requests.push(request);
          }
        });
      }

      return { collection, requests };
    } catch (error) {
      console.error('Error importing Postman collection:', error);
      throw new Error('Failed to import Postman collection. Please check the file format.');
    }
  }

  /**
   * Convert a Postman request to our app's request format
   */
  private static convertPostmanRequestToAppRequest(item: any, collectionId: string): Request {
    const postmanRequest = item.request!;
    
    // Extract headers
    const headers: Record<string, string> = {};
    if (postmanRequest.headers) {
      postmanRequest.headers.each((header: any) => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
    }

    // Extract query parameters
    const params: Record<string, string> = {};
    if (postmanRequest.url && postmanRequest.url.query) {
      postmanRequest.url.query.each((param: any) => {
        if (param.key && param.value) {
          params[param.key] = param.value;
        }
      });
    }

    // Extract body
    let body = '';
    let bodyType: 'raw' | 'form-data' | 'x-www-form-urlencoded' = 'raw';
    
    if (postmanRequest.body) {
      if (postmanRequest.body.mode === 'raw') {
        body = postmanRequest.body.raw || '';
        bodyType = 'raw';
      } else if (postmanRequest.body.mode === 'formdata') {
        body = JSON.stringify(postmanRequest.body.formdata || []);
        bodyType = 'form-data';
      } else if (postmanRequest.body.mode === 'urlencoded') {
        body = JSON.stringify(postmanRequest.body.urlencoded || []);
        bodyType = 'x-www-form-urlencoded';
      }
    }

    // Extract authentication
    let auth;
    if (postmanRequest.auth) {
      if (postmanRequest.auth.type === 'bearer') {
        auth = {
          type: 'bearer' as const,
          token: (postmanRequest.auth as any).bearer?.[0]?.value || ''
        };
      } else if (postmanRequest.auth.type === 'basic') {
        auth = {
          type: 'basic' as const,
          username: (postmanRequest.auth as any).basic?.[0]?.value || '',
          password: (postmanRequest.auth as any).basic?.[1]?.value || ''
        };
      } else if (postmanRequest.auth.type === 'apikey') {
        auth = {
          type: 'api-key' as const,
          key: (postmanRequest.auth as any).apikey?.[0]?.value || '',
          value: (postmanRequest.auth as any).apikey?.[1]?.value || ''
        };
      }
    }

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: item.name || 'Unnamed Request',
      method: (postmanRequest.method || 'GET').toUpperCase() as any,
      url: postmanRequest.url?.toString() || '',
      headers,
      params,
      body,
      bodyType,
      auth,
      collectionId,
      folderId: '',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Export our app's collections to Postman format
   */
  static exportToPostman(collections: Collection[], requests: Request[]): string {
    const postmanCollections: any[] = [];

    collections.forEach(collection => {
      const collectionRequests = requests.filter(req => req.collectionId === collection.id);
      
      const postmanCollection = {
        info: {
          name: collection.name,
          description: {
            content: collection.description || '',
            type: 'text/plain'
          },
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: collectionRequests.map(request => this.convertAppRequestToPostmanItem(request))
      };

      postmanCollections.push(postmanCollection);
    });

    // If multiple collections, return as array, otherwise return single collection
    if (postmanCollections.length === 1) {
      return JSON.stringify(postmanCollections[0], null, 2);
    } else {
      return JSON.stringify(postmanCollections, null, 2);
    }
  }

  /**
   * Convert our app's request to Postman item format
   */
  private static convertAppRequestToPostmanItem(request: Request): any {
    const postmanRequest: any = {
      name: request.name,
      request: {
        method: request.method,
        header: Object.entries(request.headers).map(([key, value]) => ({
          key,
          value,
          type: 'text'
        })),
        url: {
          raw: request.url,
          protocol: this.extractProtocol(request.url),
          host: this.extractHost(request.url),
          path: this.extractPath(request.url),
          query: Object.entries(request.params).map(([key, value]) => ({
            key,
            value
          }))
        }
      }
    };

    // Add body if present
    if (request.body) {
      if (request.bodyType === 'raw') {
        postmanRequest.request.body = {
          mode: 'raw',
          raw: request.body
        };
      } else if (request.bodyType === 'form-data') {
        try {
          const formData = JSON.parse(request.body);
          postmanRequest.request.body = {
            mode: 'formdata',
            formdata: formData
          };
        } catch (e) {
          postmanRequest.request.body = {
            mode: 'raw',
            raw: request.body
          };
        }
      } else if (request.bodyType === 'x-www-form-urlencoded') {
        try {
          const urlEncoded = JSON.parse(request.body);
          postmanRequest.request.body = {
            mode: 'urlencoded',
            urlencoded: urlEncoded
          };
        } catch (e) {
          postmanRequest.request.body = {
            mode: 'raw',
            raw: request.body
          };
        }
      }
    }

    // Add authentication if present
    if (request.auth) {
      if (request.auth.type === 'bearer') {
        postmanRequest.request.auth = {
          type: 'bearer',
          bearer: [{ key: 'token', value: request.auth.token || '', type: 'string' }]
        };
      } else if (request.auth.type === 'basic') {
        postmanRequest.request.auth = {
          type: 'basic',
          basic: [
            { key: 'username', value: request.auth.username || '', type: 'string' },
            { key: 'password', value: request.auth.password || '', type: 'string' }
          ]
        };
      } else if (request.auth.type === 'api-key') {
        postmanRequest.request.auth = {
          type: 'apikey',
          apikey: [
            { key: 'key', value: request.auth.key || '', type: 'string' },
            { key: 'value', value: request.auth.value || '', type: 'string' }
          ]
        };
      }
    }

    return postmanRequest;
  }

  /**
   * Extract protocol from URL
   */
  private static extractProtocol(url: string): string {
    try {
      return new URL(url).protocol.replace(':', '');
    } catch {
      return 'https';
    }
  }

  /**
   * Extract host from URL
   */
  private static extractHost(url: string): string[] {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.split('.');
    } catch {
      return ['example', 'com'];
    }
  }

  /**
   * Extract path from URL
   */
  private static extractPath(url: string): string[] {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').filter(segment => segment);
    } catch {
      return [];
    }
  }
}