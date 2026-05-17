import React, { useState } from 'react';
import { ChevronDown, Globe, Info, ChevronUp } from 'lucide-react';
import { Match, BetSelection } from '../../types';
import { useFixtureDetails, usePissbetMarketsTemplate } from '../../modules/betting/hooks';
import { CountryFlag } from '../common/CountryFlag';

interface MatchDetailProps {
  match: Match;
  selectedBets: BetSelection[];
  onToggleBet: (match: Match, market: string, selection: string, odd: number, outcomeId?: string, acceptedOddsVersion?: number, lastFetchedAt?: string, status?: string, uiStatus?: "fresh" | "warning" | "expired" | "suspended" | "closed") => void;
  onBack: () => void;
}

interface MarketSectionProps {
  key?: string | number;
  title: string;
  children: React.ReactNode;
  hasInfo?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  subtitle?: string | null;
}

const MarketSection = ({ title, children, hasInfo = false, isExpanded, onToggle, disabled = false, subtitle = null }: MarketSectionProps) => (
  <div className="mb-1.5 bg-[#111111] border border-white/5 rounded-xl overflow-hidden shadow-sm">
    <div 
      className={`p-3 flex items-center justify-between transition-colors ${disabled ? "opacity-40 cursor-default" : "cursor-pointer hover:bg-white/[0.02]"}`}
      onClick={disabled ? undefined : onToggle}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase text-white/90 tracking-tight leading-none">{title}</span>
          {subtitle ? <span className="text-[9px] text-gray-500 font-medium mt-1 leading-none uppercase tracking-tighter">{subtitle}</span> : null}
        </div>
        {hasInfo && <Info className="w-3 h-3 text-brand-primary cursor-help opacity-60 hover:opacity-100" />}
      </div>
      {disabled ? null : (
        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      )}
    </div>
    {isExpanded && (
      <div className="p-3 pt-0 border-t border-white/[0.03] bg-black/20">
        {children}
      </div>
    )}
  </div>
);

function DetailLoadingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-6 w-32 bg-white/5 rounded-md animate-pulse mb-4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden h-12 animate-pulse" />
      ))}
    </div>
  );
}

export default function MatchDetail({ match, selectedBets, onToggleBet, onBack }: MatchDetailProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { data: detailResp, isLoading: detailLoading } = useFixtureDetails(match.id);

  const preferSocketMarkets = String(match?.externalProvider || "").toLowerCase() === "pissbet_socket";
  const { data: pissbetTemplateResp } = usePissbetMarketsTemplate(50, preferSocketMarkets);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isSelected = (market: string, selection: string) => 
    selectedBets.some(b => b.matchId === match.id && b.market === market && b.selection === selection);

  const sportName = String(match.sportName || "").toLowerCase();
  const isFootball = sportName.includes("football") || sportName.includes("soccer");
  const isBasketball = sportName.includes("basketball");

  const categoryOrder = isFootball
    ? ["MAIN", "GOALS", "HANDICAP", "DOUBLE BETS", "SPECIALS", "MINUTES", "1ST HALF", "2ND HALF", "STATISTIC", "PENALTY", "CORNERS", "YELLOW CARDS", "FOULS", "THROW-INS", "SAVES", "OFFSIDES", "SHOTS", "SHOTS ON TARGET", "GOAL KICKS", "SUBSTITUTIONS", "PLAYERS", "OTHER"]
    : isBasketball
      ? ["MAIN", "TOTALS", "HANDICAP", "1ST HALF", "2ND HALF", "1ST QUARTER", "2ND QUARTER", "3RD QUARTER", "4TH QUARTER", "SPECIALS", "OTHER"]
      : ["MAIN", "OTHER"];

  const pissbetGroupNameByMarketCode = (() => {
    const groups = Array.isArray((pissbetTemplateResp as any)?.template?.groups) ? (pissbetTemplateResp as any).template.groups : [];
    const map = new Map<string, string>();
    for (const g of groups) {
      const groupName = String((g as any)?.name || '').trim();
      const marketCodes = Array.isArray((g as any)?.marketCodes) ? (g as any).marketCodes : [];
      for (const c of marketCodes) {
        const code = String(c || '').trim();
        if (code) map.set(code, groupName);
      }
    }
    return map;
  })();

  const pissbetMarketByCode = (() => {
    const markets = Array.isArray((pissbetTemplateResp as any)?.template?.markets) ? (pissbetTemplateResp as any).template.markets : [];
    const map = new Map<string, any>();
    for (const m of markets) {
      const code = String((m as any)?.code || '').trim();
      if (code) map.set(code, m);
    }
    return map;
  })();

  function humanizePissbetMarketCode(code: string, handicap?: string) {
    const raw = String(code || "").trim();
    const h = String(handicap || "").trim();
    const upper = raw.toUpperCase();

    const suffixHalf = upper.endsWith("_H1") ? " (1st Half)" : upper.endsWith("_H2") ? " (2nd Half)" : "";
    const base = upper.replace(/_H[12]$/, "");

    const known: Record<string, string> = {
      "1X2": "1X2",
      "DC": "Double Chance",
      "DNB": "Draw No Bet",
      "BTS": "Both Teams To Score",
      "OE": "Odd/Even",
      "OU": "Total Goals (O/U)",
      "AH": "Asian Handicap",
      "EH": "European Handicap",
      "CS": "Correct Score",
      "IOU_T1": "Team 1 Total (O/U)",
      "IOU_T2": "Team 2 Total (O/U)",
      "IOU": "Team Total (O/U)",
      "FTS_3W": "First Team To Score (3-way)",
      "LTS_3W": "Last Team To Score (3-way)",
      "AGSC_DYN": "Anytime Goalscorer",
      "FGSC_DYN": "First Goalscorer",
      "LGSC_DYN": "Last Goalscorer",
      "FCOR_2W": "First Corner (2-way)",
      "LCOR_2W": "Last Corner (2-way)",
      "COR_1X2": "Corners 1X2",
      "COR_DC": "Corners Double Chance",
      "COR_AH": "Corners Handicap",
      "COR_EH": "Corners European Handicap",
      "COR_OU": "Corners Total (O/U)",
      "COR_OU_3W": "Corners Total (3-way)",
      "COR_OE": "Corners Odd/Even",
      "COR_RC": "Corners Race To",
      "SD": "Score Draw",
      "HTFT": "Half Time / Full Time",
      "TSG": "Team To Score (Yes/No)",
      "CSH": "Clean Sheet (Yes/No)",
      "BTST1D": "Both Teams To Score + Team 1 (Yes/No)",
      "BTST2D": "Both Teams To Score + Team 2 (Yes/No)",
      "BTST1T2": "Both Teams To Score + Team 1 & Team 2 (Yes/No)",
      "BTST1": "Team 1 To Score (Yes/No)",
      "BTST2": "Team 2 To Score (Yes/No)",
      "BTSD": "Both Teams To Score + Draw (Yes/No)",
      "SBH": "Score Both Halves (Yes/No)",
      "WEH": "Win Either Half",
      "WTN": "Win To Nil (Yes/No)",
      "WBH": "Win Both Halves (Yes/No)",
      "CARD_OU": "Total Cards (O/U)",
      "CARD_IOU_T1": "Team 1 Cards (O/U)",
      "CARD_IOU_T2": "Team 2 Cards (O/U)",
      "DC_MGOAL": "Double Chance + Multi Goals",
      "TIN": "Throw-ins",
      "TIN_OU": "Throw-ins Total (O/U)",
      "TIN_OU_T1": "Throw-ins Team 1 (O/U)",
      "TIN_OU_T2": "Throw-ins Team 2 (O/U)",
      "TIN_1X2": "Throw-ins 1X2",
      "TIN_DC": "Throw-ins Double Chance",
      "TIN_AH": "Throw-ins Handicap",
      "TIN_OE": "Throw-ins Odd/Even",
      "FLS_1X2": "Fouls 1X2",
      "FLS_DC": "Fouls Double Chance",
      "FLS_AH": "Fouls Handicap",
      "FLS_OU": "Fouls Total (O/U)",
      "FLS_OU_T1": "Fouls Team 1 (O/U)",
      "FLS_OU_T2": "Fouls Team 2 (O/U)",
      "FLS_OE": "Fouls Odd/Even",
      "OFFS_1X2": "Offsides 1X2",
      "OFFS_DC": "Offsides Double Chance",
      "OFFS_AH": "Offsides Handicap",
      "OFFS_OU": "Offsides Total (O/U)",
      "OFFS_OU_T1": "Offsides Team 1 (O/U)",
      "OFFS_OU_T2": "Offsides Team 2 (O/U)",
      "OFFS_OE": "Offsides Odd/Even",
      "SV_1X2": "Saves 1X2",
      "SV_DC": "Saves Double Chance",
      "SV_AH": "Saves Handicap",
      "SV_OU": "Saves Total (O/U)",
      "SV_OU_T1": "Saves Team 1 (O/U)",
      "SV_OU_T2": "Saves Team 2 (O/U)",
      "SV_OE": "Saves Odd/Even",
      "COR_OU_T1": "Corners Team 1 Total (O/U)",
      "COR_OU_T2": "Corners Team 2 Total (O/U)",
      "BTSH1H2": "Both Teams To Score (1st Half & 2nd Half)",
      "RTGWO": "Team To Win & Over",
      "RTGWU": "Team To Win & Under",
      "RTGDO": "Team To Draw & Over",
      "RTGDU": "Team To Draw & Under",
      "RTGNLO": "Team Not To Lose & Over",
      "RTGNLU": "Team Not To Lose & Under",
    };

    // Minutes-style (e.g. 1x2_0_15, 1x2_15_30, GM_0_15)
    const minutesMatch = base.match(/^([A-Z0-9]+)_(\d{1,3})_(\d{1,3})$/i);
    if (minutesMatch) {
      const mCode = String(minutesMatch[1] || "").toUpperCase();
      const a = minutesMatch[2];
      const b = minutesMatch[3];
      const head = known[mCode] || mCode.replace(/_/g, " ");
      return `${head} (${a}-${b} min)${suffixHalf}`.trim();
    }

    // Single minute marker (e.g. 1x2_15M, DC_30M)
    const minuteMarker = base.match(/^([A-Z0-9]+)_(\d{1,3})M$/i);
    if (minuteMarker) {
      const mCode = String(minuteMarker[1] || "").toUpperCase();
      const at = minuteMarker[2];
      const head = known[mCode] || mCode.replace(/_/g, " ");
      return `${head} (${at} min)${suffixHalf}`.trim();
    }

    // Team-specific helpers (e.g. SBH_T1, SBH_T2, WEH_T1, WTN_T2, TSG_T1, CSH_T2, etc.)
    const teamMatch = base.match(/^([A-Z0-9]+)_(T1|T2)$/i);
    if (teamMatch) {
      const head = String(teamMatch[1] || "").toUpperCase();
      const team = String(teamMatch[2] || "").toUpperCase() === "T1" ? "Team 1" : "Team 2";
      const headPretty = known[head] || head.replace(/_/g, " ");
      return `${headPretty} (${team})${suffixHalf}`.trim();
    }

    // Yellow cards prefixed (Y_...)
    if (base.startsWith("Y_")) {
      const rest = base.slice(2);
      const restPretty = known[rest] || rest.replace(/_/g, " ").replace(/\bT1\b/g, "Team 1").replace(/\bT2\b/g, "Team 2");
      return `Yellow Cards: ${h ? `${restPretty} ${h}` : restPretty}${suffixHalf}`.trim();
    }

    // Corners + Yellow Cards combined markets (best-effort readability)
    // Examples: COR_1_Y_O, COR_2_Y_U, COR_OE_O_Y_OE_E, COR_1_Y_1, COR_2_Y_X
    const corYMatch = base.match(/^COR_(.+)_Y_(.+)$/i);
    if (corYMatch) {
      const a = String(corYMatch[1] || "").toUpperCase();
      const b = String(corYMatch[2] || "").toUpperCase();

      const prettySide = (s: string) => {
        if (s === "1") return "Home";
        if (s === "2") return "Away";
        if (s === "X") return "Draw";
        if (s === "O") return "Over";
        if (s === "U") return "Under";
        if (s === "OE_E") return "Odd/Even (Even)";
        if (s === "OE_O") return "Odd/Even (Odd)";
        if (s.startsWith("OE_")) return `Odd/Even (${s.slice(3)})`;
        return s.replace(/_/g, " ");
      };

      const left = prettySide(a);
      const right = prettySide(b);
      const title = `Corners: ${left} + Yellow Cards: ${right}`;
      return `${h ? `${title} ${h}` : title}${suffixHalf}`.trim();
    }

    // Race to goals / totals combos (RTGT1T2O / RTGT1T2U)
    if (base.startsWith("RTGT1T2O")) {
      const title = "Total Goals Over/Under (Yes/No)";
      return `${h ? `${title} ${h}` : title}${suffixHalf}`.trim();
    }
    if (base.startsWith("RTGT1T2U")) {
      const title = "Total Goals Under/Over (Yes/No)";
      return `${h ? `${title} ${h}` : title}${suffixHalf}`.trim();
    }

    // Corner handicap combos (CH_*_COR_* variants)
    const chCorner = base.match(/^CH_(1X|X2|12|1|2|X)_COR_(O|U)$/i);
    if (chCorner) {
      const pick = String(chCorner[1] || "").toUpperCase();
      const ou = String(chCorner[2] || "").toUpperCase() === "O" ? "Over" : "Under";
      const pickPretty =
        pick === "1" ? "Home" :
        pick === "2" ? "Away" :
        pick === "X" ? "Draw" :
        pick === "1X" ? "Home/Draw" :
        pick === "X2" ? "Draw/Away" :
        pick === "12" ? "Home/Away" : pick;
      const title = `Corners ${pickPretty} + Total ${ou}`;
      return `${h ? `${title} ${h}` : title}${suffixHalf}`.trim();
    }

    // Corner handicap yes/no (CH_*_COR_1 / CH_*_COR_2)
    const chCornerYesNo = base.match(/^CH_(1X|X2|12|1|2|X)_COR_(1|2)$/i);
    if (chCornerYesNo) {
      const pick = String(chCornerYesNo[1] || "").toUpperCase();
      const which = String(chCornerYesNo[2] || "").toUpperCase();
      const pickPretty =
        pick === "1" ? "Home" :
        pick === "2" ? "Away" :
        pick === "X" ? "Draw" :
        pick === "1X" ? "Home/Draw" :
        pick === "X2" ? "Draw/Away" :
        pick === "12" ? "Home/Away" : pick;
      const title = which === "1" ? `Corners ${pickPretty} (Yes)` : `Corners ${pickPretty} (No)`;
      return `${title}${suffixHalf}`.trim();
    }

    // Yellow cards combos (CH_*_Y_O / CH_*_Y_U)
    const chYellow = base.match(/^CH_(1X|X2|12|1|2|X)_Y_(O|U)$/i);
    if (chYellow) {
      const pick = String(chYellow[1] || "").toUpperCase();
      const ou = String(chYellow[2] || "").toUpperCase() === "O" ? "Over" : "Under";
      const pickPretty =
        pick === "1" ? "Home" :
        pick === "2" ? "Away" :
        pick === "X" ? "Draw" :
        pick === "1X" ? "Home/Draw" :
        pick === "X2" ? "Draw/Away" :
        pick === "12" ? "Home/Away" : pick;
      const title = `Yellow Cards ${pickPretty} + Total ${ou}`;
      return `${h ? `${title} ${h}` : title}${suffixHalf}`.trim();
    }

    const pretty = known[base] || base.replace(/_/g, " ").replace(/\bT1\b/g, "Team 1").replace(/\bT2\b/g, "Team 2");
    const withHandicap = h ? `${pretty} ${h}` : pretty;
    return `${withHandicap}${suffixHalf}`.trim();
  }

  function displayMarketTitle(m: any) {
    const code = String(m?.code || m?.key || "").trim();
    const handicap = String(m?.handicap || "").trim();

    // Prefer backend-provided display name if available
    const directName = String(m?.marketName || m?.name || "").trim();
    const norm = (s: string) => String(s || "").replace(/[\s_]+/g, "").toUpperCase();
    const directLooksLikeCode = directName && code && norm(directName) === norm(code);
    if (directName && !directLooksLikeCode && directName.toUpperCase() !== code.toUpperCase()) {
      return handicap ? `${directName} ${handicap}` : directName;
    }

    if (preferSocketMarkets && code) {
      return humanizePissbetMarketCode(code, handicap);
    }

    // Fallback: show code with handicap so at least it’s readable.
    return handicap ? `${code} ${handicap}` : (code || "Market");
  }

  function categoryForMarket(name: string, marketCode?: string): string {
    if (marketCode && preferSocketMarkets) {
      const g = pissbetGroupNameByMarketCode.get(String(marketCode));
      if (g) {
        const gl = g.toLowerCase();
        if (gl.includes("1st half")) return "1ST HALF";
        if (gl.includes("2nd half")) return "2ND HALF";
        if (gl.includes("corners")) return "CORNERS";
        if (gl.includes("yellow")) return "YELLOW CARDS";
        if (gl.includes("fouls")) return "FOULS";
        if (gl.includes("offsides")) return "OFFSIDES";
        if (gl.includes("saves")) return "SAVES";
        if (gl.includes("minutes")) return "MINUTES";
        if (gl.includes("double")) return "DOUBLE BETS";
        if (gl.includes("main")) return "MAIN";
      }
    }

    const n = String(name || "").toLowerCase();

    // Basketball-ish
    if (n.includes("quarter")) {
      if (n.includes("1st")) return "1ST QUARTER";
      if (n.includes("2nd")) return "2ND QUARTER";
      if (n.includes("3rd")) return "3RD QUARTER";
      if (n.includes("4th")) return "4TH QUARTER";
      return "1ST QUARTER";
    }
    if (n.includes("total") || n.includes("over/under") || n.includes("odd/even")) return isBasketball ? "TOTALS" : "GOALS";
    if (n.includes("handicap") || n.includes("spread")) return "HANDICAP";
    if (n.includes("half") && n.includes("1st")) return "1ST HALF";
    if (n.includes("half") && n.includes("2nd")) return "2ND HALF";

    // Football-ish
    if (n.includes("corner")) return "CORNERS";
    if (n.includes("yellow")) return "YELLOW CARDS";
    if (n.includes("foul")) return "FOULS";
    if (n.includes("offside")) return "OFFSIDES";
    if (n.includes("shot on target")) return "SHOTS ON TARGET";
    if (n.includes("shot")) return "SHOTS";
    if (n.includes("throw")) return "THROW-INS";
    if (n.includes("goal kick")) return "GOAL KICKS";
    if (n.includes("save")) return "SAVES";
    if (n.includes("substitution")) return "SUBSTITUTIONS";
    if (n.includes("player")) return "PLAYERS";
    if (n.includes("minute")) return "MINUTES";
    if (n.includes("penalty")) return "PENALTY";
    if (n.includes("stat")) return "STATISTIC";
    if (n.includes("double")) return "DOUBLE BETS";
    if (n.includes("special")) return "SPECIALS";

    return "MAIN";
  }

  const outcomeOddsValue = (o: any) => {
    const v = Number(o?.displayOdds ?? o?.display_odds ?? o?.rate ?? o?.odds ?? o?.rawOdds ?? o?.raw_odds ?? 0);
    return Number.isFinite(v) ? v : 0;
  };

  const outcomeSelectable = (o: any) => {
    const v = o?.isSelectable ?? o?.is_selectable;
    if (v === true) return true;
    if (v === false) return false;
    const status = String(o?.status || "active").toLowerCase();
    if (status !== "active") return false;
    if (o?.isActive === false) return false;
    const odds = outcomeOddsValue(o);
    return odds > 0;
  };

  const disabledReason = (o: any) => o?.disabledReason ?? o?.disabled_reason ?? null;
  const fixtureKey = String(match?.externalProvider && match?.externalEventId ? `${match.externalProvider}:${match.externalEventId}` : match?.id);

  const detailCollections = detailResp?.data?.collections;

  // Pissbet markets arrive via socket and are attached to `match.markets`.
  // The HTTP fixture-details endpoint may return a different provider's shape (or empty),
  // so prefer the socket markets when the match comes from `pissbet_socket`.
  const marketsFromCollections = Array.isArray(detailCollections)
    ? detailCollections.flatMap((c: any) => (c.markets || []).map((m: any) => ({ ...m, __collectionName: c.collectionName })))
    : [];

  const activeMarketsSource =
    preferSocketMarkets || marketsFromCollections.length === 0 ? (match.markets || []) : marketsFromCollections;

  const categories = (() => {
    const map = new Map<string, any[]>();
    for (const m of activeMarketsSource || []) {
      const titleGuess = displayMarketTitle(m);
      const cat = categoryForMarket(titleGuess, m.code);
      const arr = map.get(cat) || [];
      arr.push(m);
      map.set(cat, arr);
    }
    return categoryOrder
      .map((key) => ({ key, markets: map.get(key) || [] }))
      .filter((x) => x.markets.length > 0);
  })();

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-[#0a0a0a]">
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-2 mb-2 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-brand-primary text-[11px] font-bold hover:bg-white/10 transition-colors uppercase tracking-wider shadow-sm"
        >
          <span className="text-lg leading-none">&larr;</span> Back
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
           <CountryFlag country={match.country || null} className="w-3.5 h-3.5" />
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{match.league}</span>
        </div>
      </div>

      {/* Cinematic Header - Shrink-0 prevents it from being squashed */}
      <div className="relative h-28 rounded-xl overflow-hidden mb-3 border border-white/5 bg-[#111111] shadow-2xl group shrink-0 mx-2">
        {/* Abstract Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-primary/5 rounded-full blur-[60px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-black/10 to-black/50 z-1" />
        
        <div className="relative z-10 h-full flex flex-col justify-center p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-1.5 flex-1 text-center min-w-0">
              <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-xl transition-transform group-hover:scale-105">
                 <div className="text-lg opacity-80">🛡️</div>
              </div>
              <span className="text-[12px] lg:text-[14px] font-bold text-white uppercase tracking-tight leading-tight w-full drop-shadow-md truncate">{match.homeTeam}</span>
            </div>

            <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
              <div className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">VS</div>
              <div className="px-2 py-0.5 bg-brand-primary text-black text-[10px] font-black rounded shadow-lg">
                {match.time}
              </div>
              <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest opacity-60">{match.date}</div>
            </div>

            <div className="flex flex-col items-center gap-1.5 flex-1 text-center min-w-0">
               <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-xl transition-transform group-hover:scale-105">
                 <div className="text-lg opacity-80">🛡️</div>
              </div>
              <span className="text-[12px] lg:text-[14px] font-bold text-white uppercase tracking-tight leading-tight w-full drop-shadow-md truncate">{match.awayTeam}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Markets Content - flex-1 min-h-0 makes it scrollable independently */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1 no-scrollbar pb-10 mx-2">
        {detailLoading ? <DetailLoadingSkeleton /> : null}
        {detailResp?.warning ? <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs mb-4">{detailResp.warning}</div> : null}
        {detailResp?.success === false ? <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{detailResp?.message || "Could not load event details."}</div> : null}
        
        {!detailLoading && categories.map((cat) => (
          <div key={cat.key} className="space-y-2">
            <div className="flex items-center gap-2 mb-3 px-1 sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-sm py-2">
              <div className="w-1 h-4 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(193,223,31,0.5)]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{cat.key}</span>
            </div>

            <div className="grid gap-1.5">
              {cat.markets.map((m: any) => {
                const marketTitle = displayMarketTitle(m);
                const outcomes = m.outcomes || m.prices || [];
                const hasOdds = Array.isArray(outcomes) && outcomes.length > 0;
                const expanded = expandedSections[marketTitle] ?? false;
                
                return (
                  <MarketSection
                    key={m.id}
                    title={marketTitle}
                    isExpanded={hasOdds ? expanded : false}
                    onToggle={() => toggleSection(marketTitle)}
                    disabled={!hasOdds}
                    subtitle={!hasOdds ? "Suspended" : null}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mt-2">
                      {outcomes.map((o: any) => {
                        const oName = o.label || o.priceName || o.name || o.outcomeKey || o.key;
                        // Some providers reuse generic outcome names like "Over"/"Under" with different handicapValue.
                        // Include handicapValue in the selection key so selecting "Over 0.5" doesn't highlight all "Over X" rows.
                        const handicapSuffix = Number(o.handicapValue || 0) ? ` ${Number(o.handicapValue)}` : "";
                        const selectionKey = `${String(oName)}${handicapSuffix}`;
                        const isBetActive = isSelected(m.marketName || m.name, selectionKey);
                        const selectable = outcomeSelectable(o);

                        return (
                          <button
                            key={o.id}
                            onClick={() => {
                              if (!selectable || o.uiStatus === "suspended" || o.uiStatus === "closed") return;
                              onToggleBet(
                                match,
                                m.marketName || m.name,
                                selectionKey,
                                outcomeOddsValue(o),
                                o.outcomeId || o.id,
                                Number(o.oddsVersion ?? o.odds_version ?? 1),
                                o.lastFetchedAt,
                                o.status,
                                o.uiStatus
                              );
                            }}
                            disabled={!selectable}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all ${
                              isBetActive
                                ? "bg-brand-primary text-black border-brand-primary shadow-lg shadow-brand-primary/20 scale-[1.01]"
                                : "bg-white/[0.03] border-white/5 text-white/80 hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.98]"
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                          >
                            <span className={`text-[9px] font-bold truncate pr-1.5 ${isBetActive ? "text-black/70" : "text-gray-400"}`}>
                              {oName}{Number(o.handicapValue || 0) ? ` ${Number(o.handicapValue)}` : ""}
                            </span>
                            <span className={`text-[11px] font-black tabular-nums ${isBetActive ? "text-black" : "text-brand-primary"}`}>
                              {outcomeOddsValue(o).toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </MarketSection>
                );
              })}
            </div>
          </div>
        ))}

        {!detailLoading && activeMarketsSource.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Info className="w-12 h-12 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">No Markets Available</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
