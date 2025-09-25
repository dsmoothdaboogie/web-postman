import type { RequestConfig } from '../types';

export class CodeGenService {
  static generateCurl(config: RequestConfig): string {
    let curl = `curl -X ${config.method}`;
    
    // Add headers
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`;
    });
    
    // Add authentication
    if (config.auth) {
      switch (config.auth.type) {
        case 'bearer':
          if (config.auth.token) {
            curl += ` \\\n  -H "Authorization: Bearer ${config.auth.token}"`;
          }
          break;
        case 'basic':
          if (config.auth.username && config.auth.password) {
            curl += ` \\\n  -u "${config.auth.username}:${config.auth.password}"`;
          }
          break;
        case 'api-key':
          if (config.auth.key && config.auth.value) {
            curl += ` \\\n  -H "${config.auth.key}: ${config.auth.value}"`;
          }
          break;
      }
    }
    
    // Add body
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      if (config.bodyType === 'raw') {
        curl += ` \\\n  -d '${config.body}'`;
      } else if (config.bodyType === 'x-www-form-urlencoded') {
        curl += ` \\\n  -d '${config.body}'`;
      } else if (config.bodyType === 'form-data') {
        // For form-data, we need to handle it differently
        try {
          const parsed = JSON.parse(config.body);
          Object.entries(parsed).forEach(([key, value]) => {
            curl += ` \\\n  -F "${key}=${value}"`;
          });
        } catch {
          // If not JSON, treat as form data
          const lines = config.body.split('\n');
          lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
              curl += ` \\\n  -F "${key.trim()}=${value.trim()}"`;
            }
          });
        }
      }
    }
    
    // Add URL
    const url = new URL(config.url);
    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    curl += ` \\\n  "${url.toString()}"`;
    
    return curl;
  }

  static generateJavaScript(config: RequestConfig): string {
    let js = `fetch('${config.url}'`;
    
    // Add query parameters
    const url = new URL(config.url);
    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    js = `fetch('${url.toString()}'`;
    
    // Prepare options
    const options: any = {
      method: config.method
    };
    
    // Add headers
    if (Object.keys(config.headers).length > 0) {
      options.headers = config.headers;
    }
    
    // Add authentication
    if (config.auth) {
      if (!options.headers) options.headers = {};
      
      switch (config.auth.type) {
        case 'bearer':
          if (config.auth.token) {
            options.headers['Authorization'] = `Bearer ${config.auth.token}`;
          }
          break;
        case 'basic':
          if (config.auth.username && config.auth.password) {
            const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
            options.headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'api-key':
          if (config.auth.key && config.auth.value) {
            options.headers[config.auth.key] = config.auth.value;
          }
          break;
      }
    }
    
    // Add body
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      if (config.bodyType === 'raw') {
        options.body = config.body;
      } else if (config.bodyType === 'x-www-form-urlencoded') {
        options.body = config.body;
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (config.bodyType === 'form-data') {
        const formData = new FormData();
        try {
          const parsed = JSON.parse(config.body);
          Object.entries(parsed).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        } catch {
          const lines = config.body.split('\n');
          lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
              formData.append(key.trim(), value.trim());
            }
          });
        }
        options.body = formData;
      }
    }
    
    js += `, ${JSON.stringify(options, null, 2)})`;
    js += `\n  .then(response => response.json())`;
    js += `\n  .then(data => console.log(data))`;
    js += `\n  .catch(error => console.error('Error:', error));`;
    
    return js;
  }

  static generatePython(config: RequestConfig): string {
    let python = `import requests\n\n`;
    
    // Prepare URL
    const url = new URL(config.url);
    Object.entries(config.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    python += `url = "${url.toString()}"\n`;
    
    // Prepare headers
    const headers = { ...config.headers };
    
    // Add authentication
    if (config.auth) {
      switch (config.auth.type) {
        case 'bearer':
          if (config.auth.token) {
            headers['Authorization'] = `Bearer ${config.auth.token}`;
          }
          break;
        case 'basic':
          if (config.auth.username && config.auth.password) {
            headers['Authorization'] = `Basic ${btoa(`${config.auth.username}:${config.auth.password}`)}`;
          }
          break;
        case 'api-key':
          if (config.auth.key && config.auth.value) {
            headers[config.auth.key] = config.auth.value;
          }
          break;
      }
    }
    
    if (Object.keys(headers).length > 0) {
      python += `headers = ${JSON.stringify(headers, null, 2)}\n`;
    }
    
    // Add body
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      if (config.bodyType === 'raw') {
        python += `data = ${JSON.stringify(config.body)}\n`;
      } else if (config.bodyType === 'x-www-form-urlencoded') {
        python += `data = "${config.body}"\n`;
      } else if (config.bodyType === 'form-data') {
        python += `files = {}\n`;
        try {
          const parsed = JSON.parse(config.body);
          Object.entries(parsed).forEach(([key, value]) => {
            python += `files['${key}'] = '${value}'\n`;
          });
        } catch {
          const lines = config.body.split('\n');
          lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
              python += `files['${key.trim()}'] = '${value.trim()}'\n`;
            }
          });
        }
      }
    }
    
    // Generate request
    python += `\nresponse = requests.${config.method.toLowerCase()}(url`;
    if (Object.keys(headers).length > 0) {
      python += `, headers=headers`;
    }
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      if (config.bodyType === 'form-data') {
        python += `, files=files`;
      } else {
        python += `, data=data`;
      }
    }
    python += `)\n`;
    
    python += `print(response.status_code)\n`;
    python += `print(response.text)\n`;
    
    return python;
  }
}
