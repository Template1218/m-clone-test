import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { mapBackendCatalog, mapBackendFixtures } from './mappers';
import type { Match, Banner } from '../../types';
import { useEffect, useMemo, useRef, useState } from 'react';

function mapPissbetTopEventsToMatches(payload: any): Match[] {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const teams = Array.isArray(payload?.teams) ? payload.teams : [];
  const teamNameById = new Map<number, string>();
  for (const t of teams) {
    const id = Number(t?.id);
    if (!Number.isFinite(id)) continue;
    const name = String(t?.name || '').trim();
    if (name) teamNameById.set(id, name);
  }

  const findMarket = (ev: any, code: string) => (Array.isArray(ev?.markets) ? ev.markets : []).find((m: any) => String(m?.code || '').toUpperCase() === code);
  const findPrice = (m: any, code: string) => (Array.isArray(m?.prices) ? m.prices : []).find((p: any) => String(p?.code || '').toUpperCase() === code);
  const asOdd = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return events.map((ev: any) => {
    const id = String(ev?.id ?? '');
    const t1 = Number(ev?.team1?.id);
    const t2 = Number(ev?.team2?.id);
    const homeTeam = teamNameById.get(t1) || String(t1 || '') || 'Home';
    const awayTeam = teamNameById.get(t2) || String(t2 || '') || 'Away';

    const oneXtwo = findMarket(ev, '1X2');
    const dc = findMarket(ev, 'DC');
    const bts = findMarket(ev, 'BTS');

    const home = asOdd(findPrice(oneXtwo, '1')?.rate);
    const draw = asOdd(findPrice(oneXtwo, 'X')?.rate);
    const away = asOdd(findPrice(oneXtwo, '2')?.rate);

    const dc1x = asOdd(findPrice(dc, '1X')?.rate);
    const dc12 = asOdd(findPrice(dc, '12')?.rate);
    const dcx2 = asOdd(findPrice(dc, 'X2')?.rate);

    const btsYes = asOdd(findPrice(bts, 'YES')?.rate ?? findPrice(bts, 'Yes')?.rate);
    const btsNo = asOdd(findPrice(bts, 'NO')?.rate ?? findPrice(bts, 'No')?.rate);

    const startsAtUnix = Number(ev?.startDate ?? ev?.unix ?? 0);
    const startsAtMs = Number.isFinite(startsAtUnix) && startsAtUnix > 0 ? startsAtUnix * 1000 : Date.now();
    const d = new Date(startsAtMs);

    return {
      id: `pissbet:${id}`,
      externalProvider: 'pissbet_socket',
      externalEventId: ev?.id ?? null,
      sportName: 'Football',
      league: String(ev?.league?.id ?? ''),
      country: String(ev?.country?.id ?? ''),
      homeTeam,
      awayTeam,
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString(),
      isTop: Boolean(ev?.top),
      startsAt: d.toISOString(),
      pricesCount: Number(ev?.meta?.prices ?? 0) || undefined,
      odds: {
        home,
        draw,
        away,
        dc1x,
        dc12,
        dcx2,
        btsYes,
        btsNo,
      },
      markets: (Array.isArray(ev?.markets) ? ev.markets : []).map((m: any) => ({
        id: String(m?.key ?? m?.code ?? ''),
        key: String(m?.code ?? m?.key ?? ''),
        name: String(m?.code ?? m?.key ?? 'Market'),
        outcomes: (Array.isArray(m?.prices) ? m.prices : []).map((p: any) => ({
          id: String(p?.code ?? ''),
          name: String(p?.code ?? ''),
          outcomeKey: `pissbet:${id}:${String(m?.code ?? '')}:${String(p?.code ?? '')}`,
          odds: asOdd(p?.rate),
          displayOdds: asOdd(p?.rate),
          rawOdds: asOdd(p?.rate),
          status: p?.blocked ? 'suspended' : 'active',
          uiStatus: p?.blocked ? 'suspended' : 'fresh',
          isSelectable: !p?.blocked,
        })),
      })),
    } as Match;
  });
}

async function getActiveOddsProviderFromCatalog(): Promise<string> {
  const { data } = await api.get('/betting/catalog');
  const p = String(data?.provider || '').trim().toLowerCase();
  return p || 'apifootball';
}

export function useActiveOddsProvider() {
  return useQuery({
    queryKey: ['active-odds-provider'],
    queryFn: getActiveOddsProviderFromCatalog,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

function toWsBaseUrl(httpBaseUrl: string) {
  const base = String(httpBaseUrl || '').trim().replace(/\/+$/, '');
  // axios baseURL is like http://host:port/api
  const withoutApi = base.replace(/\/api$/i, '');
  if (withoutApi.startsWith('https://')) return `wss://${withoutApi.slice('https://'.length)}`;
  if (withoutApi.startsWith('http://')) return `ws://${withoutApi.slice('http://'.length)}`;
  return withoutApi;
}

export function usePissbetTopEventsStream(enabled: boolean) {
  const [raw, setRaw] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [hasData, setHasData] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingEventIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!enabled) {
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
      setConnected(false);
      setHasData(false);
      setRaw(null);
      pendingEventIdsRef.current.clear();
      return;
    }

    const wsBase = toWsBaseUrl(String((api.defaults as any)?.baseURL || ''));
    const wsUrl = `${wsBase}/ws/pissbet`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Flush any pending single-event subscriptions requested before socket opened.
      const ids = Array.from(pendingEventIdsRef.current);
      pendingEventIdsRef.current.clear();
      for (const eventId of ids) {
        try {
      ws.send(
        JSON.stringify({
          action: "subscribeToEvents",
          requestId: `single-event_${eventId}--${Date.now()}`,
          events: [{ id: eventId }],
        })
      );
        } catch {
          // ignore
        }
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      const text = typeof ev?.data === 'string' ? ev.data : '';
      if (!text) return;
      // Only store frames that actually contain top-events data.
      // Ignore heartbeat/status/error frames so UI doesn't "re-skeleton" after it already rendered.
      try {
        const parsed = JSON.parse(text);
        const events = Array.isArray((parsed as any)?.events)
          ? (parsed as any).events
          : Array.isArray((parsed as any)?.data?.events)
            ? (parsed as any).data.events
            : null;
        if (!events) return;
        setHasData(true);
        setRaw(text);
      } catch {
        // ignore non-json frames
      }
    };

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    };
  }, [enabled]);

  const matches = useMemo(() => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      // ignore internal status messages
      if (parsed && typeof parsed === 'object' && ('type' in parsed || 'error' in parsed)) return [];
      return mapPissbetTopEventsToMatches(parsed);
    } catch {
      return [];
    }
  }, [raw]);

  const subscribeEvent = (eventId: number) => {
    const id = Number(eventId);
    if (!Number.isFinite(id) || id <= 0) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // Queue until socket opens.
      pendingEventIdsRef.current.add(id);
      return;
    }
    try {
      // Pissbet detail flow: first request using `payload.eventIds`
      ws.send(
        JSON.stringify({
          action: 'subscribeToEvents',
          payload: { eventIds: [id] },
          requestId: `single-event__${id}--${Date.now()}`,
        })
      );
      // Mirror Pissbet: when opening a single event, unsubscribe it from the top-events feed.
      ws.send(
        JSON.stringify({
          action: 'subscribeToTopEvents',
          requestId: 'unsubscribe-from-top-events',
          events: [{ id, r: 1 }],
          teams: [],
        })
      );
      ws.send(
        JSON.stringify({
          action: "subscribeToEvents",
          requestId: `single-event_${id}--${Date.now()}`,
          events: [{ id }],
        })
      );
    } catch {
      // ignore
    }
  };

  return { connected, raw, matches, hasData, subscribeEvent };
}

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const { data } = await api.get('/betting/catalog');
      console.log("CATALOG RESPONSE", data);
      if (data.provider) {
        const mapped = {
          ...data,
          sports: mapBackendCatalog(data.sports || [])
        };
        console.log("SIDEBAR SPORTS", mapped.sports);
        return mapped;
      }
      const sports = mapBackendCatalog(data.sports || []);
      console.log("SIDEBAR SPORTS (legacy)", sports);
      return sports;
    },

    staleTime: 60000 * 5, // 5 minutes
  });
}

export function usePissbetMarketsTemplate(sportId: number = 50, enabled: boolean = true) {
  return useQuery({
    queryKey: ['pissbet-markets-template', sportId],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/odds/pissbet/markets-template', { params: { sportId } });
      return data;
    },
    staleTime: 6 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function usePissbetTopLeagues(enabled: boolean = true) {
  return useQuery({
    queryKey: ['pissbet-top-leagues'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/odds/pissbet/top-leagues');
      return data;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

function mapMezzoTopEventsToMatches(payload: any): Match[] {
  const lists = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  const main = Array.isArray(lists) ? lists : [];

  const normalizeTeamName = (value: any) => {
    const s = String(value || "").trim();
    if (!s) return s;
    // Mezzo eventName sometimes appends "V Away" / "V Home" after the opponent name.
    return s.replace(/\s+v\s+(away|home)\s*$/i, "").trim();
  };

  const asOdd = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return main.flatMap((sportBlock: any) => {
    const competitions = Array.isArray(sportBlock?.competitions) ? sportBlock.competitions : [];
    return competitions.flatMap((comp: any) => {
      const events = Array.isArray(comp?.events) ? comp.events : [];
      return events.map((ev: any) => {
        const eventId = String(ev?.eventId ?? '');
        const name = String(ev?.eventName || '');
        const parts = name.split(' - ').map((s) => s.trim()).filter(Boolean);
        const homeTeam = normalizeTeamName(parts[0]) || 'Home';
        const awayTeam = normalizeTeamName(parts[1]) || 'Away';

        const collections = Array.isArray(ev?.collections) ? ev.collections : [];
        const markets = collections.flatMap((c: any) => (Array.isArray(c?.markets) ? c.markets : []));

        const findMarket = (code: string) => markets.find((m: any) => String(m?.marketCode || '').toUpperCase() === code);
        const findPrice = (m: any, priceName: string) =>
          (Array.isArray(m?.prices) ? m.prices : []).find((p: any) => String(p?.priceName || '').toUpperCase() === priceName);

        const oneXtwo = findMarket('1X2');
        const dc = findMarket('DC');
        const bts = findMarket('BTS');

        const home = asOdd(findPrice(oneXtwo, '1')?.rate);
        const draw = asOdd(findPrice(oneXtwo, 'X')?.rate);
        const away = asOdd(findPrice(oneXtwo, '2')?.rate);
        const dc1x = asOdd(findPrice(dc, '1X')?.rate);
        const dc12 = asOdd(findPrice(dc, '12')?.rate);
        const dcx2 = asOdd(findPrice(dc, 'X2')?.rate);
        const btsYes = asOdd(findPrice(bts, 'YES')?.rate ?? findPrice(bts, 'Yes')?.rate);
        const btsNo = asOdd(findPrice(bts, 'NO')?.rate ?? findPrice(bts, 'No')?.rate);

        const startsAt = ev?.eventStartTime ? new Date(ev.eventStartTime) : new Date();
        const matchSportId = Number(sportBlock?.sportId ?? 0) || 501;

        return {
          // Include sportId so fixture details can be fetched for non-football sports.
          id: `mezzo:${matchSportId}:${eventId}`,
          externalProvider: 'mezzo',
          externalEventId: ev?.eventId ?? null,
          sportId: sportBlock?.sportId ?? null,
          sportName: String(sportBlock?.sportName || 'Football'),
          leagueId: comp?.competitionId ?? null,
          league: String(comp?.competitionName || ''),
          country: String(comp?.country || ''),
          homeTeam,
          awayTeam,
          time: startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: startsAt.toLocaleDateString(),
          isTop: Boolean(ev?.top),
          startsAt: startsAt.toISOString(),
          pricesCount: Number(ev?.pricesCount ?? 0) || undefined,
          odds: { home, draw, away, dc1x, dc12, dcx2, btsYes, btsNo },
          markets: markets.map((m: any) => ({
            id: String(m?.marketId ?? m?.marketCode ?? ''),
            key: String(m?.marketCode ?? ''),
            name: String(m?.marketName ?? m?.marketCode ?? 'Market'),
            outcomes: (Array.isArray(m?.prices) ? m.prices : []).map((p: any) => ({
              id: String(p?.referenceId ?? ''),
              name: String(p?.priceName ?? ''),
              outcomeKey: `mezzo:${eventId}:${String(m?.marketCode ?? '')}:${String(p?.referenceId ?? '')}`,
              odds: asOdd(p?.rate),
              displayOdds: asOdd(p?.rate),
              rawOdds: asOdd(p?.rate),
              status: p?.blocked ? 'suspended' : 'active',
              uiStatus: p?.blocked ? 'suspended' : 'fresh',
              isSelectable: !p?.blocked,
              handicapValue: p?.handicapValue ?? null,
            })),
          })),
        } as Match;
      });
    });
  });
}

export function useMezzoTopEvents(args: { enabled?: boolean; sportId?: number } = {}) {
  const enabled = args.enabled ?? true;
  const sportId = Number(args.sportId ?? 501);
  const pageSize = 30;
  const q = useInfiniteQuery({
    queryKey: ['mezzo-top-events', 'infinite', sportId],
    enabled,
    queryFn: async ({ pageParam = 0 }) => {
      const offset = Number(pageParam || 0);
      const { data } = await api.get('/odds/mezzo/top-events', { params: { sportId, limit: pageSize, offset } });
      const fixtures = Array.isArray((data as any)?.fixtures) ? (data as any).fixtures : [];
      const count = Number((data as any)?.count ?? 0) || 0;
      return {
        raw: data,
        matches: mapBackendFixtures(fixtures as any),
        offset,
        count,
        nextOffset: offset + fixtures.length,
        hasMore: offset + fixtures.length < count,
      };
    },
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextOffset : undefined),
    initialPageParam: 0,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const matches = q.data?.pages.flatMap((p) => p.matches) || [];
  const count = q.data?.pages?.[0]?.count ?? 0;
  return { ...q, data: { matches, count } } as any;
}

export function useMezzoTopLeagues(enabled: boolean = true) {
  return useQuery({
    queryKey: ['mezzo-top-leagues'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/odds/mezzo/top-leagues');
      // Normalize to { data: topLeagueList[], sportList: [], fetchedAt }
      if (Array.isArray(data)) {
        return {
          fetchedAt: null,
          data: data?.[0]?.data?.topLeagueList || [],
          sportList: data?.[1]?.data?.sportList || [],
          raw: data,
        };
      }
      return data;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useBanners(enabled: boolean = true) {
  return useQuery({
    queryKey: ["banners"],
    enabled,
    queryFn: async () => {
      const { data } = await api.get("/banners");
      const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
      return rows as Banner[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFixtures(filters: any = {}) {
  return useQuery({
    queryKey: ['fixtures', filters],
    queryFn: async () => {
      console.log("FIXTURE REQUEST FILTERS", filters);
      const provider = String(filters?.providerOverride || (await getActiveOddsProviderFromCatalog()) || "");
      if (provider === 'pissbet_socket') {
        // This list is driven by a WS stream; keep HTTP fixtures empty to avoid mixing providers.
        return [];
      }
      if (provider === 'mezzo') {
        // Mezzo is served from stored snapshots via /odds/mezzo; keep fixtures HTTP empty to avoid mixing providers.
        return [];
      }

      const { providerOverride: _providerOverride, ...params } = filters || {};
      const { data } = await api.get('/betting/fixtures', { params });
      console.log("FIXTURE RESPONSE", data);
      const rows = data.rows || data.fixtures || [];
      const fixtures = mapBackendFixtures(rows);
      console.log("Parsed fixtures:", fixtures);
      return fixtures;
    },

    refetchInterval: 30000,
  });
}

export function useFixturesInfinite(filters: any = {}) {
  const pageSize = 10;
  return useInfiniteQuery({
    queryKey: ['fixtures', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const provider = String(filters?.providerOverride || (await getActiveOddsProviderFromCatalog()) || "");
      if (provider === 'pissbet_socket') {
        // This list is driven by a WS stream; keep HTTP fixtures empty to avoid mixing providers.
        return { fixtures: [], count: 0, nextOffset: undefined };
      }
      if (provider === 'mezzo') {
        // Mezzo is served from stored snapshots via /odds/mezzo; keep fixtures HTTP empty to avoid mixing providers.
        return { fixtures: [], count: 0, nextOffset: undefined };
      }

      const { providerOverride: _providerOverride, ...params } = filters || {};
      const { data } = await api.get('/betting/fixtures', {
        params: {
          ...params,
          offset: pageParam,
          limit: pageSize
        }
      });
      console.log(`Betting fixtures infinite API response (offset: ${pageParam}):`, data);
      const rows = data.rows || data.fixtures || [];
      const fixtures = mapBackendFixtures(rows);
      console.log(`Parsed fixtures for page ${pageParam}:`, fixtures);
      if (fixtures.length > 0) {
        console.log("First fixture markets:", fixtures[0]?.markets);
        console.log("First fixture odds:", fixtures[0]?.odds);
      }
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
      const id = String(fixtureId || "");
      if (id.startsWith("pissbet:")) {
        const eventId = Number(id.split(":")[1]);
        if (!Number.isFinite(eventId) || eventId <= 0) throw new Error("Invalid pissbet fixtureId");
        const { data } = await api.get(`/odds/pissbet/event/${eventId}`);
        const raw = data?.lastRaw;
        const parsed = raw ? JSON.parse(raw) : null;
        return { provider: "pissbet_socket", eventId, raw, parsed, streamer: data?.streamer };
      }

      if (id.startsWith("mezzo:")) {
        const parts = id.split(":");
        // Back-compat: old ids were `mezzo:<eventId>`.
        const sportId = parts.length >= 3 ? Number(parts[1]) : 501;
        const eventId = parts.length >= 3 ? parts[2] : parts[1];
        if (!eventId) throw new Error("Invalid mezzo fixtureId");
        const { data } = await api.get(`/odds/mezzo/event-details`, { params: { sportId, eventId } });
        const raw = (data as any)?.data ?? null;

        const event =
          Array.isArray(raw) &&
          raw?.[0]?.data?.eventList?.[0]?.competitions?.[0]?.events?.[0]
            ? raw[0].data.eventList[0].competitions[0].events[0]
            : null;

        const collections = Array.isArray(event?.collections) ? event.collections : [];
        const mappedCollections = collections.map((c: any) => ({
          collectionId: String(c?.collectionId ?? ""),
          collectionName: String(c?.collectionName ?? "Markets"),
          markets: (Array.isArray(c?.markets) ? c.markets : []).map((m: any) => ({
            id: String(m?.marketId ?? ""),
            code: String(m?.marketCode ?? ""),
            marketCode: String(m?.marketCode ?? ""),
            marketName: String(m?.marketName ?? ""),
            name: String(m?.marketName ?? ""),
            outcomes: (Array.isArray(m?.prices) ? m.prices : []).map((p: any) => {
              const odds = Number(p?.rate);
              const okOdds = Number.isFinite(odds) ? odds : 0;
              const blocked = Boolean(p?.blocked);
              return {
                id: String(p?.referenceId ?? ""),
                outcomeId: String(p?.referenceId ?? ""),
                priceName: String(p?.priceName ?? "").trim(),
                name: String(p?.priceName ?? "").trim(),
                odds: okOdds,
                displayOdds: okOdds,
                rawOdds: okOdds,
                status: blocked ? "suspended" : "active",
                uiStatus: blocked ? "suspended" : "fresh",
                isSelectable: !blocked && okOdds > 0,
                handicapValue: p?.handicapValue ?? null,
              };
            }),
          })),
        }));

        return {
          provider: "mezzo",
          eventId,
          sportId,
          fetchedAt: (data as any)?.fetchedAt ?? null,
          cached: Boolean((data as any)?.cached),
          data: {
            eventId,
            collections: mappedCollections,
            raw,
          },
        };
      }

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
