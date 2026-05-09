import React, { useState } from 'react';
import { ChevronDown, Globe, Info, ChevronUp } from 'lucide-react';
import { Match, BetSelection } from '../../types';
import { useFixtureDetails } from '../../modules/betting/hooks';
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
}

const MarketSection = ({ title, children, hasInfo = false, isExpanded, onToggle }: MarketSectionProps) => (
  <div className="mb-2 bg-brand-surface border border-brand-border rounded overflow-hidden">
    <div 
      className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase text-gray-300">{title}</span>
        {hasInfo && <Info className="w-3 h-3 text-brand-primary cursor-help" />}
      </div>
      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
    </div>
    {isExpanded && (
      <div className="p-4 border-t border-brand-border bg-brand-dark/20 text-white">
        {children}
      </div>
    )}
  </div>
);

function DetailLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-7 w-44 bg-white/10 rounded animate-pulse" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-brand-surface border border-brand-border rounded overflow-hidden">
          <div className="p-3 flex items-center justify-between">
            <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="p-4 border-t border-brand-border bg-brand-dark/20">
            <div className="grid gap-2 grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-11 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MatchDetail({ match, selectedBets, onToggleBet, onBack }: MatchDetailProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { data: detailResp, isLoading: detailLoading } = useFixtureDetails(match.id);

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

  function categoryForMarket(name: string): string {
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
    // Detail payloads sometimes come from external provider ("prices") and don't include isSelectable flags.
    // In that case, infer from provider "blocked" + status.
    const status = String(o?.status || "active").toLowerCase();
    if (status !== "active") return false;
    if (o?.isActive === false) return false;
    if (Boolean(o?.blocked) === true) return false;
    return true;
  };
  const disabledReason = (o: any) => o?.disabledReason ?? o?.disabled_reason ?? null;
  const fixtureKey = String(match?.externalProvider && match?.externalEventId ? `${match.externalProvider}:${match.externalEventId}` : match?.id);

  const detailCollections = detailResp?.data?.collections;
  const activeMarketsSource = Array.isArray(detailCollections)
    ? detailCollections.flatMap((c: any) => (c.markets || []).map((m: any) => ({ ...m, __collectionName: c.collectionName })))
    : (match.markets || []);

  const categories = (() => {
    const map = new Map<string, any[]>();
    for (const m of activeMarketsSource || []) {
      const cat = categoryForMarket(m.marketName || m.name);
      const arr = map.get(cat) || [];
      arr.push(m);
      map.set(cat, arr);
    }
    return categoryOrder
      .map((key) => ({ key, markets: map.get(key) || [] }))
      .filter((x) => x.markets.length > 0);
  })();

  return (
    <div className="w-full pb-10 h-full flex flex-col min-h-0">
      {/* Back Button & Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between mb-4 bg-brand-surface/90 backdrop-blur p-2 rounded border border-brand-border">
        <button 
          onClick={onBack}
          className="text-brand-primary text-xs font-bold hover:underline"
        >
          &larr; BACK
        </button>
      </div>

      {/* Visual Header */}
      <div className="relative h-44 lg:h-48 rounded-lg overflow-hidden mb-6 border border-brand-border shadow-2xl">
        <div className="absolute inset-0 bg-green-900/40 z-0">
          {/* Simple Pitch Layout */}
          <div className="absolute inset-0 border-2 border-white/20 m-4 rounded flex items-center justify-between px-4 lg:px-20">
            <div className="w-16 lg:w-24 h-full border-r-2 border-white/20 flex-shrink-0" />
            <div className="w-24 lg:w-48 h-24 lg:h-48 border-2 border-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 bg-white/20 rounded-full" />
            </div>
            <div className="w-16 lg:w-24 h-full border-l-2 border-white/20 flex-shrink-0" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />
          </div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-between p-4 lg:p-6">
          <div className="flex items-center gap-2 text-[10px] lg:text-xs font-bold text-brand-primary">
            <CountryFlag country={match.country || null} className="w-3 h-3 lg:w-4 lg:h-4 shrink-0" />
            {match.country} - {match.league}
          </div>

          <div className="flex items-center justify-center gap-4 lg:gap-12 text-center">
            <div className="flex flex-col items-center gap-2 lg:gap-4 flex-1">
              <div className="w-14 h-14 lg:w-20 lg:h-20 bg-brand-surface rounded-full flex items-center justify-center border-2 lg:border-4 border-brand-primary/20 p-1 lg:p-2 shadow-inner">
                 <div className="bg-white/10 rounded-full w-full h-full flex items-center justify-center text-xl lg:text-3xl">🛡️</div>
              </div>
              <span className="text-xs lg:text-xl font-black uppercase italic tracking-tighter truncate w-full">{match.homeTeam}</span>
            </div>

            <div className="flex flex-col items-center gap-1 lg:gap-2">
              <div className="text-2xl lg:text-4xl font-black text-brand-primary italic">VS</div>
              <div className="text-[8px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{match.time}</div>
            </div>

            <div className="flex flex-col items-center gap-2 lg:gap-4 flex-1">
               <div className="w-14 h-14 lg:w-20 lg:h-20 bg-brand-surface rounded-full flex items-center justify-center border-2 lg:border-4 border-brand-primary/20 p-1 lg:p-2 shadow-inner">
                 <div className="bg-white/10 rounded-full w-full h-full flex items-center justify-center text-xl lg:text-3xl">🛡️</div>
              </div>
              <span className="text-xs lg:text-xl font-black uppercase italic tracking-tighter truncate w-full">{match.awayTeam}</span>
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Markets */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {detailLoading ? <DetailLoadingSkeleton /> : null}
        {detailResp?.warning ? <div className="text-amber-400 text-xs">{detailResp.warning}</div> : null}
        {detailResp?.success === false ? <div className="text-red-400 text-sm">{detailResp?.message || "Could not load event details. Try again."}</div> : null}
        {!detailLoading && categories.map((cat) => (
          <div key={cat.key}>
            <div className="flex items-center justify-between mb-2">
              <div className="bg-brand-primary text-black text-[10px] font-black px-4 py-1.5 rounded-sm skew-x-[-15deg] uppercase">
                {cat.key}
              </div>
            </div>

            {cat.markets.map((m: any) => {
              const expanded = expandedSections[m.marketName || m.name] ?? (cat.key === "MAIN");
              const outcomes = m.outcomes || m.prices || [];
              const cols = outcomes.length <= 2 ? 2 : 3;
              return (
                <MarketSection
                  key={m.id}
                  title={m.marketName || m.name}
                  hasInfo={false}
                  isExpanded={expanded}
                  onToggle={() => toggleSection(m.marketName || m.name)}
                >
                  {outcomes.length ? (
                    <div className={`grid gap-2 ${cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {outcomes.map((o: any) => (
                        <button
                          key={o.id}
                          onClick={() => {
                            const selectable = outcomeSelectable(o);
                            const status = String(o.status || "active").toLowerCase();
                            if (!selectable || status !== "active" || o.uiStatus === "suspended" || o.uiStatus === "closed") {
                              // eslint-disable-next-line no-console
                              console.debug("[odds-button][locked]", {
                                fixtureName: `${match.homeTeam} v ${match.awayTeam}`,
                                fixtureKey,
                                outcomeId: o.outcomeId || o.id || null,
                                outcomeKey: String(o.outcomeKey ?? o.sourceSelectionId ?? o.key ?? o.id ?? ""),
                                name: o.priceName || o.name,
                                displayOdds: outcomeOddsValue(o),
                                odds: Number(o?.odds ?? 0) || null,
                                ageSeconds: typeof (o.ageSeconds ?? o.age_seconds) === "number" ? (o.ageSeconds ?? o.age_seconds) : null,
                                maxAgeSeconds: typeof (o.maxAgeSeconds ?? o.max_age_seconds) === "number" ? (o.maxAgeSeconds ?? o.max_age_seconds) : null,
                                isSelectable: selectable,
                                disabledReason: disabledReason(o),
                                frontendDisabled: true,
                                frontendDisabledReason: !selectable ? "BACKEND_NOT_SELECTABLE" : status !== "active" ? "OUTCOME_NOT_ACTIVE" : String(o.uiStatus),
                              });
                              return;
                            }
                            onToggleBet(
                              match,
                              m.marketName || m.name,
                              o.priceName || o.name,
                              outcomeOddsValue(o),
                              o.outcomeId || o.id,
                              Number(o.oddsVersion ?? o.odds_version ?? 1),
                              o.lastFetchedAt,
                              o.status,
                              o.uiStatus
                            );
                          }}
                          disabled={!outcomeSelectable(o) || String(o.status || "active").toLowerCase() !== "active" || Boolean(o?.blocked) === true || o.uiStatus === "suspended" || o.uiStatus === "closed"}
                          className={`bet-button flex justify-between items-center py-3 px-4 ${isSelected(m.marketName || m.name, o.priceName || o.name) ? 'bet-button-active' : ''}`}
                        >
                          <span className="font-bold truncate">{(o.priceName || o.name)}{Number(o.handicapValue || 0) ? ` ${Number(o.handicapValue)}` : ""}</span>
                          <span className="text-brand-primary font-bold">{outcomeOddsValue(o).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4 text-xs italic">No odds available.</div>
                  )}
                </MarketSection>
              );
            })}
          </div>
        ))}

        {!detailLoading && (!match.markets || match.markets.length === 0) ? (
          <div className="text-center text-gray-500 py-8 text-sm italic">No market data available for this match.</div>
        ) : null}
      </div>
    </div>
  );
}
