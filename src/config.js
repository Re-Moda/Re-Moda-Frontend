// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://re-moda-backend.onrender.com'  // Your Render backend URL
  : 'http://localhost:3000';

export default API_BASE_URL; 