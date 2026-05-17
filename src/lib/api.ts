import axios from 'axios';

const rawBase = (import.meta as any)?.env?.VITE_API_BASE_URL ? String((import.meta as any).env.VITE_API_BASE_URL) : "";
const base = rawBase.trim().replace(/\/+$/, "");
const apiBaseURL = base ? `${base}/api` : "/api";

export const api = axios.create({
  baseURL: apiBaseURL,
});

// Serialize only non-GET requests to avoid flooding the backend with mutations,
// but keep GETs concurrent (pagination/infinite scroll should not be "one by one").
// NOTE: Do NOT implement this via `config.adapter` inside a request interceptor:
// aborted/cancelled requests can skip the adapter and permanently deadlock the queue.
let tail: Promise<unknown> = Promise.resolve();
const baseRequest = api.request.bind(api);
(api as any).request = async function queuedMutations(config: any) {
  const method = String(config?.method || "get").toLowerCase();
  if (method === "get") return baseRequest(config);

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
