export const environment = {
  production: true,
  apiUrl: 'https://172.17.2.61/api', // Use the WAF's IP address with HTTPS
  brokerURL: 'wss://172.17.2.61/ws', // Use the WAF's IP address with WSS for WebSocket
  enableLogging: false,
};
