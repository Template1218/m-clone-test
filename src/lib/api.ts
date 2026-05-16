import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3006/api',
});

// Serialize HTTP requests to avoid flooding the backend (concurrency = 1).
// NOTE: Do NOT implement this via `config.adapter` inside a request interceptor:
// aborted/cancelled requests can skip the adapter and permanently deadlock the queue.
let tail: Promise<unknown> = Promise.resolve();
const baseRequest = api.request.bind(api);
(api as any).request = async function queuedRequest(config: any) {
  const prev = tail;
  let release!: () => void;
  tail = new Promise((resolve) => {
    release = resolve;
  });

  await prev;
  try {
    return await baseRequest(config);
  } finally {
    release();
  }
};

// Automatically add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
