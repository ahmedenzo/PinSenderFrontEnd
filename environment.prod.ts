export const environment = {
  production: true,
  apiUrl: 'https://${window.location.hostname}/api', // Use the current hostname dynamically
  brokerURL: 'wss://${window.location.hostname}/ws', // Use the current hostname dynamically for WebSocket
  enableLogging: false,
};
