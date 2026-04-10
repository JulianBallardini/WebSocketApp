export const environment = {
  production: true,
  apiUrl: (window as any).__env?.API_URL || 'https://backend-chatwebsocketapp.onrender.com/api',
  wsUrl: (window as any).__env?.WS_URL || 'https://backend-chatwebsocketapp.onrender.com/chat-websocket'
};