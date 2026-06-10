import { Match, Sport } from '../../types';

function normalizeMarketKey(value?: string | null): string {
  const key = String(value || '').trim().toLowerCase();

  if (key === '1x2' || key === 'match result') return '1X2';
  if (key === 'dc' || key === 'double chance') return 'DC';
  if (key === 'bts' || key === 'both teams to score') return 'BTS';
  if (key === 'ah' || key === 'handicap' || key === 'sp' || key === 'spread') return 'SP';

  return key.toUpperCase();
}

export function mapBackendCatalog(sports: any[]): Sport[] {
  const soccerRank = (s: any) => {
    const id = String(s?.slug ?? s?.id ?? '').toLowerCase();
    const name = String(s?.name ?? '').toLowerCase();
    return id.includes('football') || id.includes('soccer') || name.includes('football') || name.includes('soccer') ? 0 : 1;
  };

  return sports.map((s: any) => ({
    id: s.slug,
    name: s.name,
    icon: s.name.toLowerCase() === 'football' ? 'Soccer' : 'Activity',
    count: s.eventCount || 0,
    countries: (s.Leagues || []).reduce((acc: any[], l: any) => {
      const countryName = l.country || 'International';
      const country = acc.find(c => c.name === countryName);
      if (country) {
        country.count += (l.eventCount || 0);
      } else {
        acc.push({ name: countryName, count: (l.eventCount || 0) });
      }
      return acc;
    }, [])
  })).sort((a: any, b: any) => soccerRank(a) - soccerRank(b) || String(a.name).localeCompare(String(b.name)));
}

export function mapBackendFixtures(fixtures: any[]): Match[] {
  const asNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const getDisplayOdds = (o: any) => {
    // UI-facing odds priority:
    // displayOdds -> display_odds -> odds -> rawOdds -> raw_odds
    const v =
      o?.displayOdds ??
      o?.display_odds ??
      o?.odds ??
      o?.rawOdds ??
      o?.raw_odds ??
      0;
    return asNum(v);
  };

  const toUiStatus = (o: any) => {
    const status = String(o.status || "").toLowerCase();
    if (status === "suspended") return "suspended";
    if (status === "closed") return "closed";
    const lastFetchedRaw = o.lastFetchedAt ?? o.last_fetched_at ?? o.fetchedAt ?? o.fetched_at;
    const lastFetched = lastFetchedRaw ? new Date(lastFetchedRaw).getTime() : 0;
    // Display-only freshness (so odds don't look "expired" too quickly).
    // Bet placement freshness is enforced by backend via `isSelectable`.
    if (!lastFetched || Date.now() - lastFetched > 5 * 60_000) return "expired";
    if (Date.now() - lastFetched > 2 * 60_000) return "warning";
    return "fresh";
  };

  const isRenderableOutcome = (o: any) => {
    const name = String(o?.label ?? o?.name ?? o?.outcomeKey ?? o?.key ?? '').trim();
    if (!name) return false;
    const status = String(o?.status ?? 'active').toLowerCase();
    if (status !== 'active') return false;
    if (o?.isActive === false) return false;
    const odds = getDisplayOdds(o);
    // Allow any finite odds > 0 for display, even if backend marks as warning.
    return Number.isFinite(odds) && odds > 0;
  };


  const getOutcomeOdds = (o: any) => getDisplayOdds(o);

  const parseTime = (value: any) => {
    const t = value ? new Date(value).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };

  const latestOutcomeFetchedAt = (market: any) => {
    const outcomes = market?.Outcomes || [];
    return outcomes.reduce(
      (acc: number, o: any) =>
        Math.max(acc, parseTime(o?.lastFetchedAt ?? o?.last_fetched_at ?? o?.fetchedAt ?? o?.fetched_at)),
      0,
    );
  };

  const latestMarketUpdatedAt = (market: any) =>
    Math.max(parseTime(market?.updatedAt), parseTime(market?.lastUpdatedAt), parseTime(market?.createdAt));

  const hasComplete1x2Set = (outcomes: any[]) => {
    const names = new Set(outcomes.map(o => String(o?.name ?? o?.key ?? '').trim()));
    return names.has('1') && names.has('X') && names.has('2');
  };

  const pickBestMarket = (canonicalKey: string, candidates: any[]) => {
    const scored = candidates.map((m: any) => {
      const allOutcomes = m?.Outcomes || [];
      const renderable = allOutcomes.filter(isRenderableOutcome);
      const hasActive = renderable.length > 0;
      const validOddsCount = renderable.length;
      const latestFetchedAt = latestOutcomeFetchedAt(m);
      const latestUpdatedAt = latestMarketUpdatedAt(m);
      const complete1x2 = canonicalKey === '1X2' ? hasComplete1x2Set(renderable) : false;

      // Priority (desc):
      // 1) has active outcomes
      // 2) has valid odds > 1 (count)
      // 3) fresh/latest lastFetchedAt
      // 4) (1X2 only) contains 1/X/2
      // 5) latest updatedAt
      // 6) most valid outcomes
      const score = [
        hasActive ? 1 : 0,
        validOddsCount > 0 ? 1 : 0,
        latestFetchedAt,
        complete1x2 ? 1 : 0,
        latestUpdatedAt,
        validOddsCount,
      ];

      return { market: m, renderable, score, latestFetchedAt };
    });

    scored.sort((a, b) => {
      for (let i = 0; i < a.score.length; i++) {
        const diff = b.score[i] - a.score[i];
        if (diff !== 0) return diff;
      }
      return 0;
    });

    return scored[0] || null;
  };

  const sortOutcomeOrder = (canonicalKey: string, outcomes: any[]) => {
    const order =
      canonicalKey === '1X2'
        ? ['1', 'X', '2']
        : canonicalKey === 'DC'
          ? ['1X', '12', 'X2']
          : canonicalKey === 'BTS'
            ? ['YES', 'NO', 'Yes', 'No']
            : [];

    if (order.length === 0) return outcomes;
    const index = new Map(order.map((n, i) => [n.toUpperCase(), i]));
    return [...outcomes].sort((a, b) => {
      const getVal = (x: any) => String(x?.label ?? x?.outcomeKey ?? x?.name ?? x?.key ?? '').trim().toUpperCase();
      const ai = index.get(getVal(a)) ?? 999;
      const bi = index.get(getVal(b)) ?? 999;
      return ai - bi;
    });
  };

  const findOutcome = (outcomes: any[], wanted: string) => {
    const normalize = (v: any) => String(v || "").trim().toUpperCase();
    const target = normalize(wanted);
    
    return outcomes.find(o => {
      const candidates = [
        o.outcomeKey,
        o.displayKey,
        o.label,
        o.name,
        o.key
      ].map(normalize);
      
      if (candidates.includes(target)) return true;
      
      // Fallback for APIfootball raw keys like apifootball:720965:DOUBLE_CHANCE:1X:
      const raw = String(o.key || o.sourceSelectionId || "");
      const parts = raw.split(":").filter(Boolean);
      if (parts.length >= 4 && normalize(parts[3]) === target) return true;
      
      return false;
    });
  };


  return fixtures.map((f: any) => {
    const markets = f.Markets || [];
    const mappedMarkets = markets.map((m: any) => ({
      id: m.id,
      key: m.key,
      name: m.name || m.key || "Market",
      outcomes: (m.Outcomes || []).map((o: any) => ({
        id: o.id,
        name: String(o.name ?? o.key ?? "").trim(),
        outcomeKey: String(o.sourceSelectionId ?? o.source_selection_id ?? o.key ?? o.id),
        displayOdds: getDisplayOdds(o),
        odds: getDisplayOdds(o),
        rawOdds: asNum(o?.rawOdds ?? o?.raw_odds ?? 0) || null,
        oddsVersion: Number(o.oddsVersion ?? o.odds_version ?? o.version ?? o.oddsVer ?? 1),
        lastFetchedAt: o.lastFetchedAt ?? o.last_fetched_at ?? o.fetchedAt ?? o.fetched_at,
        status: o.status || "active",
        isSelectable: (o.isSelectable ?? o.is_selectable) === true,
        disabledReason: o.disabledReason ?? o.disabled_reason ?? null,
        ageSeconds: typeof (o.ageSeconds ?? o.age_seconds) === "number" ? (o.ageSeconds ?? o.age_seconds) : null,
        maxAgeSeconds: typeof (o.maxAgeSeconds ?? o.max_age_seconds) === "number" ? (o.maxAgeSeconds ?? o.max_age_seconds) : null,
        isFresh: (o.isFresh ?? o.is_fresh) === true,
        uiStatus: toUiStatus(o)
      }))
    }));
    
  const findBestMarketByKeys = (canonicalKey: string, keys: string[]) => {
    const candidates = markets.filter((m: any) => {
      const mKey = normalizeMarketKey(m?.key || m?.code);
      if (mKey === canonicalKey) return true;
      const keyText = String(m?.key ?? m?.code ?? '').toLowerCase();
      const nameText = String(m?.name ?? '').toLowerCase();
      // IMPORTANT: avoid substring matching on keyText to prevent picking special/detail markets
      // like EX_1X2 as the main 1X2 market.
      return keys.some(k => keyText === k) || keys.some(k => nameText.includes(k));
    });

    return pickBestMarket(canonicalKey, candidates);
  };
    
    // 1x2 or 12 or HA (for tennis/basketball)
    const mainPick = findBestMarketByKeys('1X2', ['1x2', '12', 'winner', 'match_winner', 'match winner', 'ha', 'home/away']);
    const dcPick = findBestMarketByKeys('DC', ['dc', 'double_chance', 'double chance', 'doublechance']);
    const btsPick = findBestMarketByKeys('BTS', ['bts', 'both_teams_to_score', 'both teams to score', 'both score', 'bothscore', 'btts']);
    const spPick = findBestMarketByKeys('SP', ['sp', 'ah', 'spread', 'handicap']);
    const ouPick = findBestMarketByKeys('OU', ['ou', 'over_under', 'over/under', 'total', 'totals']);

    const mainOutcomes = (mainPick?.renderable || []).map((o: any) => ({ ...o, odds: getOutcomeOdds(o) }));
    const dcOutcomes = (dcPick?.renderable || []).map((o: any) => ({ ...o, odds: getOutcomeOdds(o) }));
    const btsOutcomes = (btsPick?.renderable || []).map((o: any) => ({ ...o, odds: getOutcomeOdds(o) }));
    const spOutcomes = (spPick?.renderable || []).map((o: any) => ({ ...o, odds: getOutcomeOdds(o) }));
    const ouOutcomes = (ouPick?.renderable || []).map((o: any) => ({ ...o, odds: getOutcomeOdds(o) }));
    
    const mainHome = findOutcome(mainOutcomes, '1');
    const mainDraw = findOutcome(mainOutcomes, 'X');
    const mainAway = findOutcome(mainOutcomes, '2');
    
    const dc1x = findOutcome(dcOutcomes, '1X');
    const dc12 = findOutcome(dcOutcomes, '12');
    const dcx2 = findOutcome(dcOutcomes, 'X2');
    
    const bYes = findOutcome(btsOutcomes, 'YES');
    const bNo = findOutcome(btsOutcomes, 'NO');
    const spHome = spOutcomes.find((o: any) => {
      const text = String(o?.name || o?.outcomeKey || o?.key || '').toLowerCase();
      return text.includes(String(f.homeTeam?.name || '').toLowerCase()) || text.includes('-home') || text.endsWith('home');
    });
    const spAway = spOutcomes.find((o: any) => {
      const text = String(o?.name || o?.outcomeKey || o?.key || '').toLowerCase();
      return text.includes(String(f.awayTeam?.name || '').toLowerCase()) || text.includes('-away') || text.endsWith('away');
    });
    const ouOver = findOutcome(ouOutcomes, 'OVER') || ouOutcomes.find((o: any) => String(o?.name || o?.outcomeKey || o?.key || '').toLowerCase().includes('over'));
    const ouUnder = findOutcome(ouOutcomes, 'UNDER') || ouOutcomes.find((o: any) => String(o?.name || o?.outcomeKey || o?.key || '').toLowerCase().includes('under'));


    // Temporary debug: only for fixtures where Match Result would be blank.
    const matchResultBlank =
      (!mainHome || !mainDraw || !mainAway) &&
      (Number(mainHome?.odds || 0) <= 1 || Number(mainDraw?.odds || 0) <= 1 || Number(mainAway?.odds || 0) <= 1);

    if (matchResultBlank) {
      const allKeys = markets.map((m: any) => String(m?.key ?? m?.code ?? ''));
      const canonicalKeys = markets.map((m: any) => normalizeMarketKey(m?.key ?? m?.code));
      const oneXTwoMarkets = markets.filter((m: any) => normalizeMarketKey(m?.key ?? m?.code) === '1X2');
      const selectedMarketId = mainPick?.market?.id;
      const selectedOutcomeCount = (mainPick?.renderable || []).length;
      const selectedLatestLastFetchedAt = mainPick?.latestFetchedAt ? new Date(mainPick.latestFetchedAt).toISOString() : null;

      let hiddenReason = 'no_1x2_market';
      if (oneXTwoMarkets.length > 0) hiddenReason = 'no_renderable_1x2_outcomes';
      if (selectedOutcomeCount > 0 && !hasComplete1x2Set(mainPick?.renderable || [])) hiddenReason = 'missing_1_x_2_outcomes';

      // eslint-disable-next-line no-console
      console.debug('[fixture-list][match-result-blank]', {
        fixtureId: f.id,
        eventName: `${f.homeTeam?.name || 'Home'} vs ${f.awayTeam?.name || 'Away'}`,
        allMarketKeys: allKeys,
        canonicalMarketKeys: canonicalKeys,
        oneXTwoMarketCount: oneXTwoMarkets.length,
        selectedOneXTwoMarketId: selectedMarketId,
        selectedOneXTwoOutcomeCount: selectedOutcomeCount,
        selectedOneXTwoLatestLastFetchedAt: selectedLatestLastFetchedAt,
        hiddenReason,
      });
    }

    return {
      id: f.id,
      externalProvider: f.externalProvider ?? f.external_provider ?? null,
      externalEventId: f.externalEventId ?? f.external_event_id ?? null,
      sportName: f.Sport?.name || undefined,
      league: f.League?.name || "Unknown",
      country: f.League?.country || "Unknown",
      homeTeam: f.homeTeam?.name || "Home",
      awayTeam: f.awayTeam?.name || "Away",
      isTop: f.isTop,
      pricesCount: Number(f.pricesCount || 0),
      startsAt: f.startsAt,
      date: new Date(f.startsAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      time: new Date(f.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      markets: mappedMarkets,
      odds: {
        home: Number(mainHome?.odds || 0),
        draw: Number(mainDraw?.odds || 0),
        away: Number(mainAway?.odds || 0),
        dc1x: Number(dc1x?.odds || 0),
        dc12: Number(dc12?.odds || 0),
        dcx2: Number(dcx2?.odds || 0),
        btsYes: Number(bYes?.odds || 0),
        btsNo: Number(bNo?.odds || 0),
        spHome: Number(spHome?.odds || 0),
        spAway: Number(spAway?.odds || 0),
        ouOver: Number(ouOver?.odds || 0),
        ouUnder: Number(ouUnder?.odds || 0),
      },
      outcomeIds: {
        home: mainHome?.id,
        draw: mainDraw?.id,
        away: mainAway?.id,
        dc1x: dc1x?.id,
        dc12: dc12?.id,
        dcx2: dcx2?.id,
        btsYes: bYes?.id,
        btsNo: bNo?.id,
        spHome: spHome?.id,
        spAway: spAway?.id,
        ouOver: ouOver?.id,
        ouUnder: ouUnder?.id,
      }
    };
  });
}
