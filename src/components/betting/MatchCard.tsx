import { Globe, Lock } from "lucide-react";
import { Match, BetSelection } from "../../types";
import { CountryFlag } from "../common/CountryFlag";

function normalizeMarketKey(value?: string | null): string {
  const key = String(value || "").trim().toLowerCase();
  if (key === "1x2" || key === "match result") return "1X2";
  if (key === "dc" || key === "double chance") return "DC";
  if (key === "bts" || key === "both teams to score") return "BTS";
  return key.toUpperCase();
}

interface MatchCardProps {
  key?: string | number;
  match: Match;
  selectedBets: BetSelection[];
  onToggleBet: (
    match: Match,
    market: string,
    selection: string,
    odd: number,
    outcomeId?: string,
    acceptedOddsVersion?: number,
    lastFetchedAt?: string,
    status?: string,
    uiStatus?: "fresh" | "warning" | "expired" | "suspended" | "closed",
  ) => void;
  onClick: (matchId: string) => void;
  onRequestRefreshOdds?: (matchId: string) => void;
  isCompact?: boolean;
  isSelected?: boolean;
}

export default function MatchCard({
  match,
  selectedBets,
  onToggleBet,
  onClick,
  onRequestRefreshOdds,
  isCompact = false,
  isSelected = false,
}: MatchCardProps) {
  const isBetSelected = (market: string, selection: string) =>
    selectedBets.some(
      (b) =>
        b.matchId === match.id &&
        b.market === market &&
        b.selection === selection,
    );

  const pickBestMarket = (canonicalKey: string) => {
    const markets = (match.markets as any[]) || [];
    const candidates = markets.filter((m: any) => normalizeMarketKey(m?.key) === canonicalKey);
    if (candidates.length <= 1) return candidates[0];

    const parseTime = (value: any) => {
      const t = value ? new Date(value).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };

    const isRenderableOutcome = (o: any) => {
      const name = String(o?.name ?? "").trim();
      if (!name) return false;
      const status = String(o?.status ?? "active").toLowerCase();
      if (status !== "active") return false;
      if (o?.isActive === false) return false;
      const odds = Number(o?.odds ?? 0);
      return Number.isFinite(odds) && odds > 1;
    };

    const scoreMarket = (m: any) => {
      const outcomes = (m?.outcomes || []).filter(isRenderableOutcome);
      const latestFetched = outcomes.reduce(
        (acc: number, o: any) => Math.max(acc, parseTime(o?.lastFetchedAt)),
        0,
      );

      let hasRequiredSet = true;
      if (canonicalKey === "1X2") {
        const names = new Set(outcomes.map((o: any) => String(o?.name ?? "").trim()));
        hasRequiredSet = names.has("1") && names.has("X") && names.has("2");
      }

      return { m, hasRequiredSet, latestFetched, count: outcomes.length };
    };

    return candidates
      .map(scoreMarket)
      .sort(
        (a, b) =>
          (b.hasRequiredSet ? 1 : 0) - (a.hasRequiredSet ? 1 : 0) ||
          b.latestFetched - a.latestFetched ||
          b.count - a.count,
      )[0]?.m;
  };

  const bestOneXTwoMarket = pickBestMarket("1X2");
  const bestDoubleChanceMarket = pickBestMarket("DC");
  const bestBtsMarket = pickBestMarket("BTS");

  const findOutcomeMeta = (outcomeId?: string, fallbackMarket?: any, selectionName?: string) => {
    if (!outcomeId) return fallbackMarket?.outcomes?.find((o: any) => o.name === selectionName);
    const markets = (match.markets as any[]) || [];
    for (const m of markets) {
      const found = (m?.outcomes || []).find((o: any) => o?.id === outcomeId);
      if (found) return found;
    }
    return fallbackMarket?.outcomes?.find((o: any) => o.name === selectionName);
  };

  const outcomeOddsValue = (o: any, fallback = 0) => {
    const v = Number(o?.displayOdds ?? o?.display_odds ?? o?.odds ?? o?.rawOdds ?? o?.raw_odds ?? fallback ?? 0);
    return Number.isFinite(v) ? v : 0;
  };

  const normalizeBool = (v: any) => (v === true ? true : v === false ? false : undefined);
  const normalizeNumOrNull = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  const metaHome = findOutcomeMeta(match.outcomeIds?.home, bestOneXTwoMarket, "1");
  const metaDraw = findOutcomeMeta(match.outcomeIds?.draw, bestOneXTwoMarket, "X");
  const metaAway = findOutcomeMeta(match.outcomeIds?.away, bestOneXTwoMarket, "2");
  const metaDc1x = findOutcomeMeta(match.outcomeIds?.dc1x, bestDoubleChanceMarket, "1X");
  const metaDc12 = findOutcomeMeta(match.outcomeIds?.dc12, bestDoubleChanceMarket, "12");
  const metaDcX2 = findOutcomeMeta(match.outcomeIds?.dcx2, bestDoubleChanceMarket, "X2");
  const metaBtsYes = findOutcomeMeta(match.outcomeIds?.btsYes, bestBtsMarket, "Yes");
  const metaBtsNo = findOutcomeMeta(match.outcomeIds?.btsNo, bestBtsMarket, "No");

  const OddsButton = ({
    market,
    sel,
    odd,
    outcomeId,
    outcomeKey,
    acceptedOddsVersion,
    lastFetchedAt,
    status,
    uiStatus,
    isSelectable,
    ageSeconds,
    maxAgeSeconds,
    disabledReason,
    displayOdds,
    rawOdds,
  }: {
    market: string;
    sel: string;
    odd: number;
    outcomeId?: string;
    outcomeKey?: string;
    acceptedOddsVersion?: number;
    lastFetchedAt?: string;
    status?: string;
    uiStatus?: "fresh" | "warning" | "expired" | "suspended" | "closed";
    isSelectable?: boolean;
    ageSeconds?: number | null;
    maxAgeSeconds?: number | null;
    disabledReason?: string | null;
    displayOdds?: number | null;
    rawOdds?: number | null;
  }) => {
    const hasOdd = !!odd && odd > 0;
    const normalizedStatus = String(status ?? "").toLowerCase();
    const frontendDisabledReason =
      normalizedStatus === "suspended" || uiStatus === "suspended"
        ? "SUSPENDED"
        : normalizedStatus === "closed" || uiStatus === "closed"
          ? "CLOSED"
          : isSelectable === false
            ? "BACKEND_NOT_SELECTABLE"
            : null;
    const blocked =
      normalizedStatus === "suspended" ||
      normalizedStatus === "closed" ||
      uiStatus === "suspended" ||
      uiStatus === "closed" ||
      isSelectable === false;

    const hardDisabled =
      normalizedStatus === "suspended" ||
      normalizedStatus === "closed" ||
      uiStatus === "suspended" ||
      uiStatus === "closed";

    if (!hasOdd) {
      return (
        <button
          type="button"
          disabled
          className="relative flex items-center justify-between px-2 h-8 flex-1 text-[11px] font-bold rounded-[3px] transition-all border bg-[#0a0a0a] text-gray-300 border-white/[0.04] opacity-40 cursor-not-allowed"
        >
          <span className="uppercase text-gray-200">{sel}</span>
          <span className="text-gray-500 font-light text-[13px]">--</span>
        </button>
      );
    }
    
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (blocked) {
            // Temporary debug: help track cases where backend says selectable but UI is locked.
            // eslint-disable-next-line no-console
            console.debug("[odds-button][locked]", {
              fixtureName: `${match.homeTeam} v ${match.awayTeam}`,
              fixtureKey: String(match?.externalProvider && match?.externalEventId ? `${match.externalProvider}:${match.externalEventId}` : match?.id),
              outcomeId: outcomeId || null,
              outcomeKey: outcomeKey || null,
              name: sel,
              displayOdds: typeof displayOdds === "number" ? displayOdds : odd,
              odds: odd,
              rawOdds: typeof rawOdds === "number" ? rawOdds : null,
              ageSeconds: typeof ageSeconds === "number" ? ageSeconds : null,
              maxAgeSeconds: typeof maxAgeSeconds === "number" ? maxAgeSeconds : null,
              isSelectable: isSelectable === true,
              disabledReason: disabledReason ?? null,
              frontendDisabled: blocked,
              frontendDisabledReason,
            });
            if (onRequestRefreshOdds) onRequestRefreshOdds(match.id);
            return;
          }
          onToggleBet(match, market, sel, odd, outcomeId, acceptedOddsVersion, lastFetchedAt, status, uiStatus);
        }}
        disabled={hardDisabled}
        aria-disabled={blocked}
        className={`relative flex items-center justify-between px-2 h-8 flex-1 text-[11px] font-bold rounded-[3px] transition-all border ${
          isBetSelected(market, sel)
            ? "bg-brand-primary text-black border-brand-primary"
            : "bg-[#0a0a0a] text-gray-300 border-white/[0.04] hover:bg-white/[0.08] hover:border-white/10"
        } ${blocked ? "opacity-50 cursor-not-allowed hover:bg-[#0a0a0a]" : ""}`}
      >
        {blocked && <Lock className="absolute top-1 left-1 w-3 h-3 text-gray-200/80" />}
        <span
          className={`uppercase ${isBetSelected(market, sel) ? "text-black/60" : "text-gray-200"}`}
        >
          {sel}
        </span>
        <span
          className={
            isBetSelected(market, sel)
              ? "text-black"
              : "text-brand-primary font-light text-[13px]"
          }
        >
          {odd.toFixed(2)}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Card Layout */}
      <div
        className="lg:hidden flex flex-col bg-[#1e1a2b] border border-white/5 rounded-xl p-1 px-4 mb-2 gap-2 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => onClick(match.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h3 className="text-[14px] font-black text-white italic uppercase tracking-tight">
              {match.homeTeam}
            </h3>
            <h3 className="text-[14px] font-black text-white italic uppercase tracking-tight">
              {match.awayTeam}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] font-black text-[#525252] tabular-nums tracking-wide">
              {match.date} {match.time}
            </span>
            <div className="bg-[#facc15] text-black px-1 py-0.5 rounded-sm">
              <span className="text-[10px] font-black italic">
                +{Number(match.pricesCount || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 h-10">
          <OddsButton
            market="Match Result"
            sel="1"
            odd={outcomeOddsValue(metaHome, match.odds.home)}
            outcomeId={match.outcomeIds?.home}
            outcomeKey={metaHome?.outcomeKey ?? metaHome?.sourceSelectionId ?? metaHome?.key}
            acceptedOddsVersion={metaHome?.oddsVersion}
            lastFetchedAt={metaHome?.lastFetchedAt}
            status={metaHome?.status}
            uiStatus={metaHome?.uiStatus}
            isSelectable={normalizeBool(metaHome?.isSelectable ?? metaHome?.is_selectable)}
            ageSeconds={normalizeNumOrNull(metaHome?.ageSeconds ?? metaHome?.age_seconds)}
            maxAgeSeconds={normalizeNumOrNull(metaHome?.maxAgeSeconds ?? metaHome?.max_age_seconds)}
            disabledReason={metaHome?.disabledReason ?? metaHome?.disabled_reason ?? null}
            displayOdds={normalizeNumOrNull(metaHome?.displayOdds ?? metaHome?.display_odds)}
            rawOdds={normalizeNumOrNull(metaHome?.rawOdds ?? metaHome?.raw_odds)}
          />
          <OddsButton
            market="Match Result"
            sel="X"
            odd={outcomeOddsValue(metaDraw, match.odds.draw)}
            outcomeId={match.outcomeIds?.draw}
            outcomeKey={metaDraw?.outcomeKey ?? metaDraw?.sourceSelectionId ?? metaDraw?.key}
            acceptedOddsVersion={metaDraw?.oddsVersion}
            lastFetchedAt={metaDraw?.lastFetchedAt}
            status={metaDraw?.status}
            uiStatus={metaDraw?.uiStatus}
            isSelectable={normalizeBool(metaDraw?.isSelectable ?? metaDraw?.is_selectable)}
            ageSeconds={normalizeNumOrNull(metaDraw?.ageSeconds ?? metaDraw?.age_seconds)}
            maxAgeSeconds={normalizeNumOrNull(metaDraw?.maxAgeSeconds ?? metaDraw?.max_age_seconds)}
            disabledReason={metaDraw?.disabledReason ?? metaDraw?.disabled_reason ?? null}
            displayOdds={normalizeNumOrNull(metaDraw?.displayOdds ?? metaDraw?.display_odds)}
            rawOdds={normalizeNumOrNull(metaDraw?.rawOdds ?? metaDraw?.raw_odds)}
          />
          <OddsButton
            market="Match Result"
            sel="2"
            odd={outcomeOddsValue(metaAway, match.odds.away)}
            outcomeId={match.outcomeIds?.away}
            outcomeKey={metaAway?.outcomeKey ?? metaAway?.sourceSelectionId ?? metaAway?.key}
            acceptedOddsVersion={metaAway?.oddsVersion}
            lastFetchedAt={metaAway?.lastFetchedAt}
            status={metaAway?.status}
            uiStatus={metaAway?.uiStatus}
            isSelectable={normalizeBool(metaAway?.isSelectable ?? metaAway?.is_selectable)}
            ageSeconds={normalizeNumOrNull(metaAway?.ageSeconds ?? metaAway?.age_seconds)}
            maxAgeSeconds={normalizeNumOrNull(metaAway?.maxAgeSeconds ?? metaAway?.max_age_seconds)}
            disabledReason={metaAway?.disabledReason ?? metaAway?.disabled_reason ?? null}
            displayOdds={normalizeNumOrNull(metaAway?.displayOdds ?? metaAway?.display_odds)}
            rawOdds={normalizeNumOrNull(metaAway?.rawOdds ?? metaAway?.raw_odds)}
          />
        </div>
      </div>

      {/* Desktop Card Layout */}
      <div
        className={`hidden lg:flex flex-col border-b border-white/[0.05] hover:bg-white/[0.01] transition-all cursor-pointer group/card p-1 px-6 relative ${
          isSelected
            ? "bg-brand-primary/5 border-l-2 border-l-brand-primary"
            : "border-l-2 border-l-transparent"
        }`}
        onClick={() => onClick(match.id)}
      >
        {match.isTop && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-md shadow-lg z-10">
            HOT
          </div>
        )}
        {/* Row 1: League & Time */}
        {!isCompact && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <CountryFlag country={match.country || null} className="w-3.5 h-3.5 shrink-0 opacity-90" />
              <span className="text-[11px] font-bold text-gray-400 uppercase truncate">
                {(match.country ? `${match.country} - ` : "") + (match.league || "")}
              </span>
            </div>
            <span className="text-[11px] font-bold tabular-nums text-gray-400">
              {match.date} {match.time}
            </span>
          </div>
        )}

        {/* Row 2: Teams & Info */}
        <div className="flex items-center justify-between">
          <div
          className={`font-normal text-white truncate group-hover/card:text-brand-primary transition-all ${isCompact ? "text-[13px]" : "text-[15px]"}`}
        >
          {match.homeTeam} V {match.awayTeam}
        </div>
          {!isCompact && (
            <div className="flex items-center gap-3">
              <div className="bg-black/40 px-2 py-0.5 rounded border border-white/5 shadow-inner">
                <span className="text-brand-primary text-[10px] font-black">
                  +{Number(match.pricesCount || 0)} SIDE BETS
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Buttons Grid - Stretching to fill full width */}
        <div
          className={`grid items-center  border-t border-white/[0.03] ${isCompact ? "grid-cols-[1.5fr_1.5fr_1fr]" : "grid-cols-[1.5fr_1.5fr_1fr]"}`}
        >
          {/* Match Result Group */}
          <div className="flex gap-0.5 w-full pr-3 border-r border-white/50 py-2">
            <OddsButton
              market="Match Result"
              sel="1"
              odd={outcomeOddsValue(metaHome, match.odds.home)}
              outcomeId={match.outcomeIds?.home}
              outcomeKey={metaHome?.outcomeKey ?? metaHome?.sourceSelectionId ?? metaHome?.key}
              acceptedOddsVersion={metaHome?.oddsVersion}
              lastFetchedAt={metaHome?.lastFetchedAt}
              status={metaHome?.status}
              uiStatus={metaHome?.uiStatus}
              isSelectable={normalizeBool(metaHome?.isSelectable ?? metaHome?.is_selectable)}
              ageSeconds={normalizeNumOrNull(metaHome?.ageSeconds ?? metaHome?.age_seconds)}
              maxAgeSeconds={normalizeNumOrNull(metaHome?.maxAgeSeconds ?? metaHome?.max_age_seconds)}
              disabledReason={metaHome?.disabledReason ?? metaHome?.disabled_reason ?? null}
              displayOdds={normalizeNumOrNull(metaHome?.displayOdds ?? metaHome?.display_odds)}
              rawOdds={normalizeNumOrNull(metaHome?.rawOdds ?? metaHome?.raw_odds)}
            />
            <OddsButton
              market="Match Result"
              sel="X"
              odd={outcomeOddsValue(metaDraw, match.odds.draw)}
              outcomeId={match.outcomeIds?.draw}
              outcomeKey={metaDraw?.outcomeKey ?? metaDraw?.sourceSelectionId ?? metaDraw?.key}
              acceptedOddsVersion={metaDraw?.oddsVersion}
              lastFetchedAt={metaDraw?.lastFetchedAt}
              status={metaDraw?.status}
              uiStatus={metaDraw?.uiStatus}
              isSelectable={normalizeBool(metaDraw?.isSelectable ?? metaDraw?.is_selectable)}
              ageSeconds={normalizeNumOrNull(metaDraw?.ageSeconds ?? metaDraw?.age_seconds)}
              maxAgeSeconds={normalizeNumOrNull(metaDraw?.maxAgeSeconds ?? metaDraw?.max_age_seconds)}
              disabledReason={metaDraw?.disabledReason ?? metaDraw?.disabled_reason ?? null}
              displayOdds={normalizeNumOrNull(metaDraw?.displayOdds ?? metaDraw?.display_odds)}
              rawOdds={normalizeNumOrNull(metaDraw?.rawOdds ?? metaDraw?.raw_odds)}
            />
            <OddsButton
              market="Match Result"
              sel="2"
              odd={outcomeOddsValue(metaAway, match.odds.away)}
              outcomeId={match.outcomeIds?.away}
              outcomeKey={metaAway?.outcomeKey ?? metaAway?.sourceSelectionId ?? metaAway?.key}
              acceptedOddsVersion={metaAway?.oddsVersion}
              lastFetchedAt={metaAway?.lastFetchedAt}
              status={metaAway?.status}
              uiStatus={metaAway?.uiStatus}
              isSelectable={normalizeBool(metaAway?.isSelectable ?? metaAway?.is_selectable)}
              ageSeconds={normalizeNumOrNull(metaAway?.ageSeconds ?? metaAway?.age_seconds)}
              maxAgeSeconds={normalizeNumOrNull(metaAway?.maxAgeSeconds ?? metaAway?.max_age_seconds)}
              disabledReason={metaAway?.disabledReason ?? metaAway?.disabled_reason ?? null}
              displayOdds={normalizeNumOrNull(metaAway?.displayOdds ?? metaAway?.display_odds)}
              rawOdds={normalizeNumOrNull(metaAway?.rawOdds ?? metaAway?.raw_odds)}
            />
          </div>

          {/* Double Chance Group */}
          <div className="flex gap-0.5 w-full px-3 border-r border-white/50 py-2">
            <OddsButton
              market="Double Chance"
              sel="1X"
              odd={outcomeOddsValue(metaDc1x, match.odds.dc1x)}
              outcomeId={match.outcomeIds?.dc1x}
              outcomeKey={metaDc1x?.outcomeKey ?? metaDc1x?.sourceSelectionId ?? metaDc1x?.key}
              acceptedOddsVersion={metaDc1x?.oddsVersion}
              lastFetchedAt={metaDc1x?.lastFetchedAt}
              status={metaDc1x?.status}
              uiStatus={metaDc1x?.uiStatus}
              isSelectable={normalizeBool(metaDc1x?.isSelectable ?? metaDc1x?.is_selectable)}
              ageSeconds={normalizeNumOrNull(metaDc1x?.ageSeconds ?? metaDc1x?.age_seconds)}
              maxAgeSeconds={normalizeNumOrNull(metaDc1x?.maxAgeSeconds ?? metaDc1x?.max_age_seconds)}
              disabledReason={metaDc1x?.disabledReason ?? metaDc1x?.disabled_reason ?? null}
              displayOdds={normalizeNumOrNull(metaDc1x?.displayOdds ?? metaDc1x?.display_odds)}
              rawOdds={normalizeNumOrNull(metaDc1x?.rawOdds ?? metaDc1x?.raw_odds)}
            />
            <OddsButton
              market="Double Chance"
              sel="12"
              odd={outcomeOddsValue(metaDc12, match.odds.dc12)}
              outcomeId={match.outcomeIds?.dc12}
              outcomeKey={metaDc12?.outcomeKey ?? metaDc12?.sourceSelectionId ?? metaDc12?.key}
              acceptedOddsVersion={metaDc12?.oddsVersion}
              lastFetchedAt={metaDc12?.lastFetchedAt}
              status={metaDc12?.status}
              uiStatus={metaDc12?.uiStatus}
              isSelectable={normalizeBool(metaDc12?.isSelectable ?? metaDc12?.is_selectable)}
              ageSeconds={normalizeNumOrNull(metaDc12?.ageSeconds ?? metaDc12?.age_seconds)}
              maxAgeSeconds={normalizeNumOrNull(metaDc12?.maxAgeSeconds ?? metaDc12?.max_age_seconds)}
              disabledReason={metaDc12?.disabledReason ?? metaDc12?.disabled_reason ?? null}
              displayOdds={normalizeNumOrNull(metaDc12?.displayOdds ?? metaDc12?.display_odds)}
              rawOdds={normalizeNumOrNull(metaDc12?.rawOdds ?? metaDc12?.raw_odds)}
            />
            <OddsButton
              market="Double Chance"
              sel="X2"
              odd={outcomeOddsValue(metaDcX2, match.odds.dcx2)}
              outcomeId={match.outcomeIds?.dcx2}
              outcomeKey={metaDcX2?.outcomeKey ?? metaDcX2?.sourceSelectionId ?? metaDcX2?.key}
              acceptedOddsVersion={metaDcX2?.oddsVersion}
              lastFetchedAt={metaDcX2?.lastFetchedAt}
              status={metaDcX2?.status}
              uiStatus={metaDcX2?.uiStatus}
              isSelectable={normalizeBool(metaDcX2?.isSelectable ?? metaDcX2?.is_selectable)}
              ageSeconds={normalizeNumOrNull(metaDcX2?.ageSeconds ?? metaDcX2?.age_seconds)}
              maxAgeSeconds={normalizeNumOrNull(metaDcX2?.maxAgeSeconds ?? metaDcX2?.max_age_seconds)}
              disabledReason={metaDcX2?.disabledReason ?? metaDcX2?.disabled_reason ?? null}
              displayOdds={normalizeNumOrNull(metaDcX2?.displayOdds ?? metaDcX2?.display_odds)}
              rawOdds={normalizeNumOrNull(metaDcX2?.rawOdds ?? metaDcX2?.raw_odds)}
            />
          </div>

          {/* Both Score Group */}
          <div className="flex gap-0.5 w-full pl-3 py-2">
            <OddsButton
              market="Both Score"
              sel="Yes"
              odd={outcomeOddsValue(metaBtsYes, match.odds.btsYes)}
              outcomeId={match.outcomeIds?.btsYes}
              outcomeKey={metaBtsYes?.outcomeKey ?? metaBtsYes?.sourceSelectionId ?? metaBtsYes?.key}
              acceptedOddsVersion={metaBtsYes?.oddsVersion}
              lastFetchedAt={metaBtsYes?.lastFetchedAt}
              status={metaBtsYes?.status}
              uiStatus={metaBtsYes?.uiStatus}
              isSelectable={normalizeBool(metaBtsYes?.isSelectable ?? metaBtsYes?.is_selectable)}
              ageSeconds={normalizeNumOrNull(metaBtsYes?.ageSeconds ?? metaBtsYes?.age_seconds)}
              maxAgeSeconds={normalizeNumOrNull(metaBtsYes?.maxAgeSeconds ?? metaBtsYes?.max_age_seconds)}
              disabledReason={metaBtsYes?.disabledReason ?? metaBtsYes?.disabled_reason ?? null}
              displayOdds={normalizeNumOrNull(metaBtsYes?.displayOdds ?? metaBtsYes?.display_odds)}
              rawOdds={normalizeNumOrNull(metaBtsYes?.rawOdds ?? metaBtsYes?.raw_odds)}
            />
            <OddsButton
              market="Both Score"
              sel="No"
              odd={outcomeOddsValue(metaBtsNo, match.odds.btsNo)}
              outcomeId={match.outcomeIds?.btsNo}
              outcomeKey={metaBtsNo?.outcomeKey ?? metaBtsNo?.sourceSelectionId ?? metaBtsNo?.key}
              acceptedOddsVersion={metaBtsNo?.oddsVersion}
              lastFetchedAt={metaBtsNo?.lastFetchedAt}
              status={metaBtsNo?.status}
              uiStatus={metaBtsNo?.uiStatus}
              isSelectable={normalizeBool(metaBtsNo?.isSelectable ?? metaBtsNo?.is_selectable)}
              ageSeconds={normalizeNumOrNull(metaBtsNo?.ageSeconds ?? metaBtsNo?.age_seconds)}
              maxAgeSeconds={normalizeNumOrNull(metaBtsNo?.maxAgeSeconds ?? metaBtsNo?.max_age_seconds)}
              disabledReason={metaBtsNo?.disabledReason ?? metaBtsNo?.disabled_reason ?? null}
              displayOdds={normalizeNumOrNull(metaBtsNo?.displayOdds ?? metaBtsNo?.display_odds)}
              rawOdds={normalizeNumOrNull(metaBtsNo?.rawOdds ?? metaBtsNo?.raw_odds)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
