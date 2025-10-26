import axios from 'axios';

// Set the base URL based on the environment
const baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' // Use relative path (e.g., 'https://myapp.com/api/...')
    : 'http://localhost:5000/api'; // Use full path for local development

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;