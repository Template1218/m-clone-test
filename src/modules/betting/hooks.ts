import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { mapBackendCatalog, mapBackendFixtures } from './mappers';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const { data } = await api.get('/betting/catalog');
      return mapBackendCatalog(data.sports || []);
    },
    staleTime: 60000 * 5, // 5 minutes
  });
}

export function useFixtures(filters: any = {}) {
  return useQuery({
    queryKey: ['fixtures', filters],
    queryFn: async () => {
      const { data } = await api.get('/betting/fixtures', { params: filters });
      return mapBackendFixtures(data.fixtures || []);
    },
    refetchInterval: 30000,
  });
}

export function useFixturesInfinite(filters: any = {}) {
  const pageSize = 10;
  return useInfiniteQuery({
    queryKey: ['fixtures', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get('/betting/fixtures', {
        params: {
          ...filters,
          offset: pageParam,
          limit: pageSize
        }
      });
      const fixtures = mapBackendFixtures(data.fixtures || []);
      return {
        fixtures,
        count: data.count,
        // Keep scanning offsets even if backend returns < pageSize due to dedupe.
        // Stop only when the backend returns 0 rows for the requested offset.
        nextOffset: fixtures.length > 0 ? pageParam + pageSize : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 10000
  });
}

export function useFixtureDetails(fixtureId?: string) {
  return useQuery({
    queryKey: ['fixture-details', fixtureId],
    queryFn: async () => {
      const { data } = await api.get(`/betting/fixtures/${fixtureId}/details`);
      return data;
    },
    enabled: !!fixtureId,
    staleTime: 5000,
  });
}

export function useRefreshVisibleOdds() {
  return useMutation({
    mutationFn: async (fixtureIds: string[]) => {
      const { data } = await api.post('/betting/fixtures/refresh-visible-odds', { fixtureIds });
      return data;
    }
  });
}
