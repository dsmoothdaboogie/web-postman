import React, { useState, useRef, useEffect } from 'react';

interface SSEClientProps {
  onClose: () => void;
}

const SSEClient: React.FC<SSEClientProps> = ({ onClose }) => {
  const [url, setUrl] = useState('http://localhost:8080/events');
  const [events, setEvents] = useState<Array<{ id: string, type: string, data: string, timestamp: Date }>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    setEvents(prev => [...prev, { id: 'system', type: 'system', data: 'Connecting...', timestamp: new Date() }]);

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setEvents(prev => [...prev, { id: 'system', type: 'system', data: 'Connected successfully', timestamp: new Date() }]);
      };

      eventSource.onmessage = (event) => {
        setEvents(prev => [...prev, {
          id: event.lastEventId || Date.now().toString(),
          type: 'message',
          data: event.data,
          timestamp: new Date()
        }]);
      };

      eventSource.onerror = () => {
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setEvents(prev => [...prev, { id: 'system', type: 'system', data: 'Connection error occurred', timestamp: new Date() }]);
      };

      // Handle custom event types
      eventSource.addEventListener('custom', (event: MessageEvent) => {
        setEvents(prev => [...prev, {
          id: event.lastEventId || Date.now().toString(),
          type: 'custom',
          data: event.data,
          timestamp: new Date()
        }]);
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        setEvents(prev => [...prev, {
          id: event.lastEventId || Date.now().toString(),
          type: 'error',
          data: event.data,
          timestamp: new Date()
        }]);
      });

    } catch (error) {
      setConnectionStatus('disconnected');
      setEvents(prev => [...prev, { id: 'system', type: 'system', data: `Connection failed: ${error}`, timestamp: new Date() }]);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const clearEvents = () => {
    setEvents([]);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'message': return 'text-blue-700 bg-blue-50 border-blue-500';
      case 'custom': return 'text-purple-700 bg-purple-50 border-purple-500';
      case 'error': return 'text-red-700 bg-red-50 border-red-500';
      case 'system': return 'text-gray-700 bg-gray-50 border-gray-500';
      default: return 'text-gray-700 bg-gray-50 border-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Server-Sent Events Client</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="SSE URL"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isConnected}
          />
          <button
            onClick={isConnected ? disconnect : connect}
            className={`px-4 py-2 rounded-md font-medium ${
              isConnected
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        <div className="mt-2 flex items-center space-x-4">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            Status: {connectionStatus.toUpperCase()}
          </span>
          <button
            onClick={clearEvents}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Events
          </button>
        </div>
      </div>

      {/* Events Display */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📡</div>
              <p>No events yet. Connect to an SSE endpoint to start receiving events.</p>
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                className={`p-3 rounded-md border-l-4 ${getEventTypeColor(event.type)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">
                    {event.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                  {event.data}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SSEClient;
