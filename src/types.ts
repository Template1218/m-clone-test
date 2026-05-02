export interface Match {
  id: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  date: string;
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
}

export interface BetSelection {
  matchId: string;
  matchName: string;
  market: string;
  selection: string;
  odd: number;
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
