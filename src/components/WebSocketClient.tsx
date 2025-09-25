import React, { useState, useRef, useEffect } from 'react';

interface WebSocketClientProps {
  onClose: () => void;
}

const WebSocketClient: React.FC<WebSocketClientProps> = ({ onClose }) => {
  const [url, setUrl] = useState('ws://localhost:8080');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'sent' | 'received' | 'system', content: string, timestamp: Date }>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus('connecting');
    setMessages(prev => [...prev, { type: 'system', content: 'Connecting...', timestamp: new Date() }]);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setMessages(prev => [...prev, { type: 'system', content: 'Connected successfully', timestamp: new Date() }]);
      };

      ws.onmessage = (event) => {
        setMessages(prev => [...prev, { type: 'received', content: event.data, timestamp: new Date() }]);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setMessages(prev => [...prev, { type: 'system', content: 'Connection closed', timestamp: new Date() }]);
      };

      ws.onerror = (error) => {
        setConnectionStatus('disconnected');
        setMessages(prev => [...prev, { type: 'system', content: `Error: ${error}`, timestamp: new Date() }]);
      };
    } catch (error) {
      setConnectionStatus('disconnected');
      setMessages(prev => [...prev, { type: 'system', content: `Connection failed: ${error}`, timestamp: new Date() }]);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const sendMessage = () => {
    if (wsRef.current && isConnected && message.trim()) {
      wsRef.current.send(message);
      setMessages(prev => [...prev, { type: 'sent', content: message, timestamp: new Date() }]);
      setMessage('');
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">WebSocket Client</h2>
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
            placeholder="WebSocket URL"
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
            onClick={clearMessages}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Messages
          </button>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🔌</div>
              <p>No messages yet. Connect to a WebSocket server to start.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  msg.type === 'sent'
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : msg.type === 'received'
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : 'bg-gray-50 border-l-4 border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${
                    msg.type === 'sent'
                      ? 'text-blue-700'
                      : msg.type === 'received'
                      ? 'text-green-700'
                      : 'text-gray-700'
                  }`}>
                    {msg.type === 'sent' ? 'SENT' : msg.type === 'received' ? 'RECEIVED' : 'SYSTEM'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketClient;
