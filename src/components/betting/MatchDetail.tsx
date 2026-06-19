import React, { useMemo, useState } from 'react';
import { ChevronDown, Globe, Info, ChevronUp } from 'lucide-react';
import { Match, BetSelection } from '../../types';
import { useFixtureDetails, usePissbetMarketsTemplate } from '../../modules/betting/hooks';
import { CountryFlag } from '../common/CountryFlag';

interface MatchDetailProps {
  match: Match;
  selectedBets: BetSelection[];
  onToggleBet: (match: Match, market: string, selection: string, odd: number, outcomeId?: string, selectionKey?: string, acceptedOddsVersion?: number, lastFetchedAt?: string, status?: string, uiStatus?: "fresh" | "warning" | "expired" | "suspended" | "closed") => void;
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
  <div className="mb-1">
    {/* Header — always visible */}
    <div
      className={`relative overflow-hidden border transition-colors ${
        isExpanded
          ? "rounded-t-lg bg-[#1a1a1a] border-white/10 border-b-transparent"
          : "rounded-lg bg-[#0d0d0d] border-white/5 hover:border-white/10"
      } ${disabled ? "opacity-40 cursor-default" : "cursor-pointer"}`}
      onClick={disabled ? undefined : onToggle}
    >
      <div className="px-2.5 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white/80">
              {title}
            </span>
            {subtitle ? <span className="text-[8px] text-gray-500 font-medium uppercase tracking-wider">{subtitle}</span> : null}
          </div>
          {hasInfo && <Info className="w-2.5 h-2.5 text-brand-primary opacity-60" />}
        </div>

        {disabled ? null : (
          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 ${
            isExpanded ? "bg-brand-primary/20 rotate-180" : "bg-white/5"
          }`}>
            <ChevronDown className={`w-3 h-3 transition-colors ${isExpanded ? "text-brand-primary" : "text-gray-500"}`} />
          </div>
        )}
      </div>
    </div>

    {/* Expanded content — visually attached below header inside its own container */}
    {isExpanded && (
      <div className="rounded-b-lg border border-t-0 border-white/10 bg-[#111111] px-2 pb-2 pt-1.5">
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
  const isUuid = (v: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || "").trim());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const { data: detailResp, isLoading: detailLoading } = useFixtureDetails(match.id, {
    externalProvider: match.externalProvider ?? null,
    externalEventId: match.externalEventId ?? null,
    sportName: match.sportName ?? null,
  });

  const preferSocketMarkets = String(match?.externalProvider || "").toLowerCase() === "pissbet_socket";
  const { data: pissbetTemplateResp } = usePissbetMarketsTemplate(50, preferSocketMarkets);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCategory = (key: string) => {
    const k = String(key || "").trim().toUpperCase() || "OTHER";
    setExpandedCategories(prev => ({ ...prev, [k]: !(prev?.[k] ?? (k === "MAIN")) }));
  };

  const isSelected = (market: string, selection: string, outcomeId?: string, selectionKey?: string) => {
    const safeOutcomeId = String(outcomeId || "").trim();
    const safeSelectionKey = String(selectionKey || "").trim();
    return selectedBets.some((b) => {
      if (b.matchId !== match.id) return false;
      if (safeOutcomeId && b.outcomeId) return String(b.outcomeId) === safeOutcomeId;
      if (safeSelectionKey && b.selectionKey) return String(b.selectionKey) === safeSelectionKey;
      return b.market === market && b.selection === selection;
    });
  };

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
    const code = String(m?.code || m?.marketCode || m?.key || "").trim();
    const handicap = String(m?.handicap || "").trim();

    // Prefer backend-provided display name if available
    const directName = String(m?.marketName || m?.name || "").trim();
    const norm = (s: string) => String(s || "").replace(/[\s_]+/g, "").toUpperCase();
    const directLooksLikeCode = directName && code && norm(directName) === norm(code);
    if (directName && !directLooksLikeCode && directName.toUpperCase() !== code.toUpperCase()) {
      const dl = directName.toLowerCase();
      if (dl.includes("3-way moneyline")) return "Match Result";
      if (dl.includes("both teams to score")) return "Both Teams To Score";
      if (dl.includes("double chance")) return "Double Chance";
      if (dl.includes("draw no bet")) return "Draw No Bet";
      if (dl.includes("correct score")) return "Correct Score";
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

    // Non-socket providers (Mezzo / API-Football) often provide market codes that are
    // more reliable than the human market title for category grouping.
    // Example: "Total Corners" contains "total" which would otherwise fall into GOALS.
    const codeU = String(marketCode || "").trim().toUpperCase();
    if (codeU) {
      if (codeU === "RCARD" || codeU.startsWith("RCARD_")) return "STATISTIC";
      if (codeU.startsWith("CK_") || codeU.startsWith("COR_")) return "CORNERS";
      if (codeU.startsWith("YC_")) return "YELLOW CARDS";
      if (codeU.startsWith("CARDS_") || codeU.startsWith("CARD_")) return "STATISTIC";
      if (codeU.includes("SHOT") && codeU.includes("TARGET")) return "SHOTS ON TARGET";
      if (codeU.startsWith("SHOTS_")) return "SHOTS";
      if (codeU.includes("SHOT") && !codeU.includes("TARGET")) return "SHOTS";
      if (codeU.startsWith("FOUL_") || codeU.startsWith("FLS_")) return "FOULS";
      if (codeU.startsWith("GSCR_") || codeU.startsWith("PLAYER_")) return "PLAYERS";
      if (codeU === "DC" || codeU === "BTS" || codeU === "DNB" || codeU === "OE" || codeU === "OE_T1" || codeU === "OE_T2") return "MAIN";
      if (codeU.includes("DOUBLE")) return "DOUBLE BETS";
      if (codeU === "HTFT") return "MAIN";
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

    // Football-ish
    if (n.includes("corner")) return "CORNERS";
    if (n.includes("card")) return n.includes("yellow") ? "YELLOW CARDS" : "STATISTIC";
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
    if (n.includes("handicap") || n.includes("spread")) return "HANDICAP";
    if (n.includes("half") && n.includes("1st")) return "1ST HALF";
    if (n.includes("half") && n.includes("2nd")) return "2ND HALF";
    // Keep this late: many stat markets contain "Total ..." (e.g. Total Corners / Cards / Shots).
    if (n.includes("any goals") || n.includes("goals yes/no") || n.includes("total") || n.includes("over/under") || n.includes("odd/even")) return isBasketball ? "TOTALS" : "GOALS";

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
  const marketsFromCollections = useMemo(
    () => Array.isArray(detailCollections)
      ? detailCollections.flatMap((c: any) => (c.markets || []).map((m: any) => ({ ...m, __collectionName: c.collectionName })))
      : [],
    [detailCollections],
  );

  const activeMarketsSource =
    preferSocketMarkets || marketsFromCollections.length === 0 ? (match.markets || []) : marketsFromCollections;

  const categories = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const m of activeMarketsSource || []) {
      const titleGuess = displayMarketTitle(m);
      const cat = categoryForMarket(titleGuess, m.code || m.marketCode || m.key);
      const arr = map.get(cat) || [];
      arr.push(m);
      map.set(cat, arr);
    }
    if (isFootball) {
      const main = map.get("MAIN") || [];
      const hasTitle = (title: string) =>
        main.some((m: any) => displayMarketTitle(m).trim().toLowerCase() === title.trim().toLowerCase());
      const addPlaceholder = (title: string, marketCode: string) => {
        if (hasTitle(title)) return;
        main.push({
          id: `template:${marketCode}`,
          marketId: `template:${marketCode}`,
          marketName: title,
          name: title,
          marketCode,
          code: marketCode,
          outcomes: [],
          prices: [],
          __templateOnly: true,
        });
      };
      addPlaceholder("Match Result", "1X2");
      addPlaceholder("2UP", "2UP");
      addPlaceholder("Double Chance", "DC");
      addPlaceholder("Both Teams To Score", "BTS");
      addPlaceholder("Correct Score", "CS");
      addPlaceholder("Draw No Bet", "DNB");
      addPlaceholder("Goals Odd/Even", "OE");
      addPlaceholder("Home Team Goals Odd/Even", "OE_T1");
      addPlaceholder("Away Team Goals Odd/Even", "OE_T2");
      addPlaceholder("Half Time/Full Time", "HTFT");
      addPlaceholder("Highest Scoring Half", "HSH");
      addPlaceholder("Next Goal", "NG");
      map.set("MAIN", main);
    }
    return categoryOrder
      .map((key) => ({ key, markets: map.get(key) || [] }))
      .filter((x) => x.markets.length > 0);
  }, [activeMarketsSource, isFootball]);  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-[#0a0a0a]">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-3 py-3 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-bold transition-all hover:translate-x-[-2px]"
        >
          <span className="text-sm">←</span> BACK
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
           <CountryFlag country={match.country || null} className="w-3.5 h-3.5 shadow-sm" />
           <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">{match.league}</span>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-10">
        {/* Match Header Section */}
        <div className="px-3 pt-2 mb-6">
          <div className="relative rounded-[2rem] overflow-hidden bg-[#111111] border border-white/5">
            <div className="px-6 py-8 flex items-center justify-between">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[12px] font-bold text-white uppercase tracking-normal text-center leading-tight">
                    {match.homeTeam}
                  </span>
                  <span className="text-[9px] text-white/30 font-bold uppercase mt-1">Home</span>
                </div>
              </div>

              {/* Center Info */}
              <div className="flex flex-col items-center gap-2 px-4 shrink-0">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">VS</span>
                <div className="px-4 py-1.5 bg-brand-primary text-black text-xs font-black rounded-lg">
                  {match.time}
                </div>
                <span className="text-[9px] font-bold text-white/30 tracking-wider mt-1 uppercase">
                  {match.date}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[12px] font-bold text-white uppercase tracking-normal text-center leading-tight">
                    {match.awayTeam}
                  </span>
                  <span className="text-[9px] text-white/30 font-bold uppercase mt-1">Away</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Markets Area */}
        <div className="px-3 space-y-1.5">
          {detailLoading ? <DetailLoadingSkeleton /> : null}
          {detailResp?.warning ? <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-bold mb-6">{detailResp.warning}</div> : null}
          {detailResp?.success === false ? <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-bold">{detailResp?.message || "Could not load event details."}</div> : null}
          
          {!detailLoading && categories.map((cat) => {
            const catKey = String(cat.key || "").toUpperCase();
            const categoryExpanded = expandedCategories[catKey] ?? (catKey === "MAIN");
            return (
            <div key={cat.key} className="space-y-0">
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.key)}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 group transition-colors ${
                  categoryExpanded
                    ? "rounded-t-lg bg-[#1c1728] border border-white/10 border-b-transparent"
                    : "rounded-lg bg-[#1c1728] border border-white/5 hover:border-white/10 mb-2"
                }`}
              >
                <span className="text-[10px] font-black text-white uppercase tracking-wide group-hover:text-white transition-colors">
                  {cat.key}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[7px] font-bold text-white/20 uppercase tracking-tighter">{cat.markets.length} MARKETS</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${categoryExpanded ? "bg-brand-primary/20" : "bg-white/5 group-hover:bg-white/10"}`}>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${
                      categoryExpanded ? "rotate-180 text-brand-primary" : "text-white/40"
                    }`} />
                  </div>
                </div>
              </button>

              {/* Expanded content — contained panel attached to the header */}
              {categoryExpanded ? (
                <div className="rounded-b-lg border border-t-0 border-white/10 bg-[#0f0d14] px-1.5 pb-1.5 pt-1 animate-in fade-in slide-in-from-bottom-1 duration-200 mb-2">
                  <div className="grid gap-1">
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
                          subtitle={!hasOdds ? "SUSPENDED" : null}
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mt-1">
                            {outcomes.map((o: any) => {
                              const oName = o.label || o.priceName || o.name || o.outcomeKey || o.key;
                              const maybeOutcomeId = String(
                                (isUuid(o.outcomeId) ? o.outcomeId : "") ||
                                  (isUuid(o.id) ? o.id : "") ||
                                  ""
                              ).trim();
                              const rawSelectionKey = String(o.selectionKey || o.referenceId || o.selection_key || "").trim();
                              const displaySelection = String(oName);
                              const isBetActive = isSelected(m.marketName || m.name, displaySelection, maybeOutcomeId, rawSelectionKey);
                              const hasOutcomeId = !!maybeOutcomeId;
                              const selectable = outcomeSelectable(o) && (hasOutcomeId || !!rawSelectionKey);
                              const buttonKey = maybeOutcomeId || rawSelectionKey || String(o.id || o.outcomeKey || o.key || displaySelection);

                              return (
                                <button
                                  key={buttonKey}
                                  onClick={() => {
                                    if (!selectable || o.uiStatus === "suspended" || o.uiStatus === "closed") return;
                                    onToggleBet(
                                      match,
                                      m.marketName || m.name,
                                      displaySelection,
                                      outcomeOddsValue(o),
                                      maybeOutcomeId || undefined,
                                      rawSelectionKey || undefined,
                                      Number(o.oddsVersion ?? o.odds_version ?? 1),
                                      o.lastFetchedAt,
                                      o.status,
                                      o.uiStatus
                                    );
                                  }}
                                  disabled={!selectable}
                                  className={`group relative flex items-center justify-between px-2 py-1 rounded border transition-all ${
                                    isBetActive
                                      ? "bg-brand-primary text-black border-brand-primary"
                                      : "bg-[#111111] border-white/5 text-white/90 hover:bg-[#1a1a1a] hover:border-white/10"
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                  <span className={`text-[9px] font-bold truncate pr-1 uppercase ${isBetActive ? "text-black/80" : "text-gray-400"}`}>
                                    {oName}
                                  </span>
                                  <span className={`text-[10px] font-black tabular-nums shrink-0 ${isBetActive ? "text-black" : "text-brand-primary"}`}>
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
              ) : null}
            </div>
          )})}

          {!detailLoading && activeMarketsSource.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-10">
              <Info className="w-16 h-16 mb-6 stroke-[1.5]" />
              <p className="text-sm font-black uppercase tracking-[0.4em]">NO MARKETS AVAILABLE</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
