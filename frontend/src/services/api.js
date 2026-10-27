import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const systemService = {
  getHealth: () => api.get('/health'),
};

export const machineService = {
  getAll: () => api.get('/machines'),
  getById: (id) => api.get(`/machines/${id}`),
  updateStatus: (id, status) => api.put(`/machines/${id}/status`, { status }),
};

export const sensorService = {
  getTelemetry: (params) => api.get('/sensor-data', { params }),
  ingestReading: (data) => api.post('/sensor-data', data),
  simulateTick: (machineId) => api.post('/sensor-data/simulate-tick', { machine_id: machineId || 'M01' }),
  simulateFleetTick: () => api.post('/sensor-data/simulate-fleet-tick', {}),
};

export const eventService = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  recordToBlockchain: (eventId, payload) => api.post(`/events/${eventId}/record-blockchain`, payload || {}),
};

export const aiService = {
  predict: (payload) => api.post('/predict', payload),
  getStatus: () => api.get('/predict/status'),
};

export const blockchainService = {
  getStatus: () => api.get('/blockchain/status'),
  getEvents: () => api.get('/blockchain/events'),
  getEventEvidence: (eventId) => api.get(`/blockchain/events/${eventId}`),
  verifyEvidence: (eventId) => api.get(`/blockchain/verify/${eventId}`),
};

export const reportService = {
  getSummary: () => api.get('/reports/summary'),
};

export default api;
