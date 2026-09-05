// API Configuration for SHIFA
// In production, set VITE_API_BASE_URL environment variable

const config = {
  // API Gateway base URL - set via VITE_API_BASE_URL env var or use default
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://tni75kpuo5.execute-api.af-south-1.amazonaws.com',
  
  // Request timeout in milliseconds
  timeout: 15000,
  
  // Default headers
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

export default config;
