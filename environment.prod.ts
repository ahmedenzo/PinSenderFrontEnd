export const environment = {
  production: true,
  apiUrl: 'http://172.17.5.191:8443', // Nginx proxy for backend API
  brokerURL: 'ws://172.17.5.191:8443/ws', // Nginx proxy for WebSocket
  enableLogging: false, // Add this flag
};
