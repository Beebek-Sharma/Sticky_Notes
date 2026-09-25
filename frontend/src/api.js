import axios from 'axios';

// In production, fallback to relative '/api' for zero-CORS single-service deployments,
// or use REACT_APP_API_BASE_URL when frontend and backend are deployed as separate Railway services.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:8000/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const getNotes = async () => {
  const response = await apiClient.get('/notes/');
  return response.data;
};

export const createNote = async (noteData) => {
  const response = await apiClient.post('/notes/', noteData);
  return response.data;
};

export const updateNote = async (id, noteData) => {
  const response = await apiClient.put(`/notes/${id}/`, noteData);
  return response.data;
};

export const patchNote = async (id, partialData) => {
  const response = await apiClient.patch(`/notes/${id}/`, partialData);
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await apiClient.delete(`/notes/${id}/`);
  return response.data;
};

export default apiClient;
