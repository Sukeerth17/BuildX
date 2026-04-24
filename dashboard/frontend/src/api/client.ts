import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('compliance_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username: string, password: string) => {
  const res = await client.post('/api/v1/auth/login', { username, password });
  return res.data;
};

export const getFindings = async (filters?: any) => {
  const res = await client.get('/api/v1/findings', { params: filters });
  return res.data;
};

export const getSummary = async () => {
  const res = await client.get('/api/v1/findings/summary');
  return res.data;
};

export const getTrend = async () => {
  const res = await client.get('/api/v1/findings/trend');
  return res.data;
};

export const getFrameworks = async () => {
  const res = await client.get('/api/v1/frameworks');
  return res.data;
};

export const getSnapshots = async () => {
  const res = await client.get('/api/v1/frameworks/snapshots');
  return res.data;
};

export const updateFindingStatus = async (id: number, status: string) => {
  const res = await client.patch(`/api/v1/findings/${id}/status`, { status });
  return res.data;
};

export const generateAuditReport = async (startDate: string, endDate: string) => {
  const res = await client.post('/api/v1/audit/generate', { start_date: startDate, end_date: endDate }, {
    responseType: 'blob'
  });
  return res.data;
};

export const OLLAMA_CHAT_URL = 'http://localhost:8000/api/v1/ai/chat';
