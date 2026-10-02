import axios from 'axios';

const TOKEN_KEY = 'educonnect.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

/** Extracts a human readable message from an axios error. */
export const errorMessage = (err) => err?.response?.data?.message ?? err?.message ?? 'Something went wrong';

/** Absolute URL for files served by the API (uploads). */
export const fileUrl = (url) => (url?.startsWith('/uploads/') ? `${API_BASE}${url}` : url);
