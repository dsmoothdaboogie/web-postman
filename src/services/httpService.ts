import type { RequestConfig, ResponseData } from '../types';

export class HttpService {
  static async sendRequest(config: RequestConfig): Promise<ResponseData> {
    const startTime = Date.now();
    
    try {
      // Check if proxy is enabled
      const enableProxy = localStorage.getItem('webpostman-enable-proxy') === 'true';
      const proxyUrl = localStorage.getItem('webpostman-proxy-url');
      
      // Build URL with query parameters
      let url = new URL(config.url);
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      
      // Use proxy if enabled
      if (enableProxy && proxyUrl) {
        const proxy = new URL(proxyUrl);
        proxy.searchParams.set('url', url.toString());
        url = proxy;
      }

      // Prepare headers
      const headers = new Headers(config.headers);
      
      // Add authentication headers
      if (config.auth) {
        switch (config.auth.type) {
          case 'bearer':
            if (config.auth.token) {
              headers.set('Authorization', `Bearer ${config.auth.token}`);
            }
            break;
          case 'basic':
            if (config.auth.username && config.auth.password) {
              const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
              headers.set('Authorization', `Basic ${credentials}`);
            }
            break;
          case 'api-key':
            if (config.auth.key && config.auth.value) {
              headers.set(config.auth.key, config.auth.value);
            }
            break;
        }
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method: config.method,
        headers,
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body) {
        if (config.bodyType === 'raw') {
          requestOptions.body = config.body;
        } else if (config.bodyType === 'x-www-form-urlencoded') {
          const formData = new URLSearchParams();
          try {
            const parsed = JSON.parse(config.body);
            Object.entries(parsed).forEach(([key, value]) => {
              formData.append(key, String(value));
            });
          } catch {
            // If not JSON, treat as form data
            const lines = config.body.split('\n');
            lines.forEach(line => {
              const [key, value] = line.split('=');
              if (key && value) {
                formData.append(key.trim(), value.trim());
              }
            });
          }
          requestOptions.body = formData.toString();
          headers.set('Content-Type', 'application/x-www-form-urlencoded');
        } else if (config.bodyType === 'form-data') {
          const formData = new FormData();
          try {
            const parsed = JSON.parse(config.body);
            Object.entries(parsed).forEach(([key, value]) => {
              formData.append(key, String(value));
            });
          } catch {
            // If not JSON, treat as form data
            const lines = config.body.split('\n');
            lines.forEach(line => {
              const [key, value] = line.split('=');
              if (key && value) {
                formData.append(key.trim(), value.trim());
              }
            });
          }
          requestOptions.body = formData;
        }
      }

      // Make the request
      const response = await fetch(url.toString(), requestOptions);
      const responseTime = Date.now() - startTime;
      
      // Get response body
      const body = await response.text();
      const responseSize = new Blob([body]).size;
      
      // Convert headers to object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body,
        responseTime,
        responseSize
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: error instanceof Error ? error.message : 'Unknown error occurred',
        responseTime,
        responseSize: 0
      };
    }
  }

  static interpolateVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      return variables[variableName] || match;
    });
  }
}
