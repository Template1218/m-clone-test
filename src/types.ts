export interface Match {
  id: string;
  externalProvider?: string | null;
  externalEventId?: string | number | null;
  sportName?: string;
  league: string;
  leagueName?: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  pricesCount?: number;
  homeScore?: number;
  awayScore?: number;
  time: string;
  date: string;
  isTop?: boolean;
  startsAt?: string;
  odds: {
    home: number;
    draw: number;
    away: number;
    dc1x: number;
    dc12: number;
    dcx2: number;
    btsYes: number;
    btsNo: number;
  };
  outcomeIds?: {
    home?: string;
    draw?: string;
    away?: string;
    dc1x?: string;
    dc12?: string;
    dcx2?: string;
    btsYes?: string;
    btsNo?: string;
  };
  markets?: Array<{
    id: string;
    key?: string;
    name: string;
    outcomes: Array<{
      id: string;
      name: string;
      outcomeKey?: string;
      displayOdds?: number;
      rawOdds?: number | null;
      odds: number;
      oddsVersion?: number;
      lastFetchedAt?: string;
      status?: string;
      uiStatus?: "fresh" | "warning" | "expired" | "suspended" | "closed";
      isSelectable?: boolean;
      disabledReason?: string | null;
      ageSeconds?: number | null;
      maxAgeSeconds?: number | null;
      isFresh?: boolean;
    }>;
  }>;
}

export interface BetSelection {
  matchId: string;
  matchName: string;
  externalEventId?: string | number | null;
  market: string;
  selection: string;
  odd: number;
  outcomeId?: string;
  acceptedOddsVersion?: number;
  lastFetchedAt?: string;
  status?: string;
  uiStatus?: "fresh" | "warning" | "expired" | "suspended" | "closed";
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  highlight?: string | null;
  imageUrl: string;
  color: string;
  sortOrder?: number;
}

export interface Country {
  name: string;
  count: number;
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  count: number;
  countries?: Country[];
}

export interface Game {
  id: string;
  name: string;
  image: string;
  provider: string;
  isNew?: boolean;
  fairness?: boolean;
}
