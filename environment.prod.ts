export const environment = {
  production: true,
  apiUrl: `${window.location.origin}/api`, 
  brokerURL: `${window.location.origin.replace('http', 'ws')}/ws`, 
  enableLogging: false,
};
