import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    const nextAccess = data?.tokens?.accessToken;
    const nextRefresh = data?.tokens?.refreshToken;
    if (nextAccess) localStorage.setItem('accessToken', nextAccess);
    if (nextRefresh) localStorage.setItem('refreshToken', nextRefresh);
    return nextAccess || null;
  } catch {
    return null;
  }
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      const access = data?.tokens?.accessToken;
      const refresh = data?.tokens?.refreshToken;
      if (access) localStorage.setItem('accessToken', access);
      if (refresh) localStorage.setItem('refreshToken', refresh);
      queryClient.setQueryData(['user'], data.user);
    }
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/auth/register', credentials, {
        headers: { "X-Country-Code": "ET" }
      });
      return data;
    },
    onSuccess: (data) => {
      const access = data?.tokens?.accessToken;
      const refresh = data?.tokens?.refreshToken;
      if (access) localStorage.setItem('accessToken', access);
      if (refresh) localStorage.setItem('refreshToken', refresh);
      queryClient.setQueryData(['user'], data.user);
    }
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      let token = localStorage.getItem('accessToken');
      if (!token) return null;
      try {
        const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        return data.user;
      } catch (err: any) {
        const status = Number(err?.response?.status || 0);
        if (status === 401) {
          const refreshed = await tryRefreshAccessToken();
          if (refreshed) {
            token = refreshed;
            try {
              const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
              return data.user;
            } catch {
              // fall through
            }
          }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}
