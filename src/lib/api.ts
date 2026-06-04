import axios from 'axios';

const rawBase = (import.meta as any)?.env?.VITE_API_BASE_URL ? String((import.meta as any).env.VITE_API_BASE_URL) : "";
const base = rawBase.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
const apiBaseURL = base ? `${base}/api` : "/api";

export const api = axios.create({
  baseURL: apiBaseURL,
});

// Coalesce duplicate GETs fired during the same render/navigation.
// This prevents double network requests when components mount twice (e.g. dev tooling, responsive layouts).
const inFlightGets = new Map<string, Promise<any>>();
function stableStringify(value: any) {
  const seen = new WeakSet();
  const normalize = (v: any): any => {
    if (v === null || v === undefined) return v;
    if (typeof v !== "object") return v;
    if (seen.has(v)) return "[Circular]";
    seen.add(v);
    if (Array.isArray(v)) return v.map(normalize);
    const out: any = {};
    for (const k of Object.keys(v).sort()) out[k] = normalize(v[k]);
    return out;
  };
  try {
    return JSON.stringify(normalize(value));
  } catch {
    return String(value);
  }
}
function getDedupKey(config: any) {
  const method = String(config?.method || "get").toLowerCase();
  const url = String(config?.url || "");
  const params = config?.params || null;
  return `${method}:${url}?${stableStringify(params)}`;
}

// Serialize only non-GET requests to avoid flooding the backend with mutations,
// but keep GETs concurrent (pagination/infinite scroll should not be "one by one").
// NOTE: Do NOT implement this via `config.adapter` inside a request interceptor:
// aborted/cancelled requests can skip the adapter and permanently deadlock the queue.
let tail: Promise<unknown> = Promise.resolve();
const baseRequest = api.request.bind(api);
(api as any).request = async function queuedMutations(config: any) {
  const method = String(config?.method || "get").toLowerCase();
  if (method === "get") {
    const key = getDedupKey(config);
    const existing = inFlightGets.get(key);
    if (existing) return existing;
    const p = (async () => {
      try {
        return await baseRequest(config);
      } finally {
        inFlightGets.delete(key);
      }
    })();
    inFlightGets.set(key, p);
    return p;
  }

  const prev = tail;
  let release!: (value?: unknown) => void;
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
