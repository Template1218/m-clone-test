import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Smartphone } from "lucide-react";
import { Match, BetSelection } from "./types";
import { useActiveOddsProvider, useBanners, useFixtures, useFixturesInfinite, useMezzoTopEvents, usePissbetTopEventsStream, useRefreshVisibleOdds } from "./modules/betting/hooks";
import { useMe } from "./modules/auth/hooks";
import { useQueryClient } from "@tanstack/react-query";

// Modular Components
import Header from "./components/layout/Header";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import Betslip from "./components/betting/Betslip";
import MatchCard from "./components/betting/MatchCard";
import MatchDetail from "./components/betting/MatchDetail";
import AuthModal from "./components/betting/AuthModal";
import AccountPanelPage from "./components/betting/AccountPanelPage";
import { MatchCardSkeletonList } from "./components/betting/MatchCardSkeleton";

import GamesView from "./components/games/GamesView";
import LiveView from "./components/live/LiveView";
import VirtualSportsView from "./components/virtual/VirtualSportsView";

export default function App() {
  const getInitialSlipSlot = (): 1 | 2 | 3 => {
    if (typeof window === "undefined") return 1;
    const raw = localStorage.getItem("activeSlipSlot");
    if (raw === "2") return 2;
    if (raw === "3") return 3;
    return 1;
  };
  const [activeSlipSlot, setActiveSlipSlot] = useState<1 | 2 | 3>(getInitialSlipSlot);
  const [selectedBetsBySlot, setSelectedBetsBySlot] = useState<Record<1 | 2 | 3, BetSelection[]>>({
    1: [],
    2: [],
    3: [],
  });
  const selectedBets = selectedBetsBySlot[activeSlipSlot];
  const [betslipNotice, setBetslipNotice] = useState<string | null>(null);
  const [stake, setStake] = useState<number>(20);
  const [view, setView] = useState<string>("home");
  const [isBetslipOpen, setIsBetslipOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeSport, setActiveSport] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);
  const [activeApiFootballLeagueId, setActiveApiFootballLeagueId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>('All Time');
  const [fixturesTab, setFixturesTab] = useState<"upcoming" | "top">("top");

  const queryClient = useQueryClient();
  const refreshVisibleOdds = useRefreshVisibleOdds();
  const lastBulkRefreshAtRef = useRef<number>(0);
  const bulkRefreshInFlightRef = useRef<boolean>(false);
  const { data: currentUser, isLoading: meLoading, isFetching: meFetching } = useMe();
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
  const authLoading = hasToken && (meLoading || meFetching);
  const { data: activeProvider } = useActiveOddsProvider();
  const { data: remoteBanners = [] } = useBanners(true);
  const pissbetStream = usePissbetTopEventsStream(activeProvider === "pissbet_socket");
  const mezzoSportId = activeProvider === "mezzo" ? Number(activeSport ?? 501) : 501;
  const mezzoTopEvents = useMezzoTopEvents({
    enabled: activeProvider === "mezzo",
    sportId: mezzoSportId,
    tab: fixturesTab,
    leagueId: activeLeagueId,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("activeSlipSlot", String(activeSlipSlot));
  }, [activeSlipSlot]);

  useEffect(() => {
    if (!authLoading) setUser(currentUser || null);
  }, [authLoading, currentUser]);

  const handleSignOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const handleAuth = (type: "login" | "register") => {
    setAuthModal({ open: true, type });
  };
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    type: "login" | "register";
  }>({
    open: false,
    type: "login",
  });
  const [accountPanelTab, setAccountPanelTab] = useState<"deposit" | "bets" | "ticket">("deposit");

  const toggleBet = (
    match: Match,
    market: string,
    selection: string,
    odd: number,
    outcomeId?: string,
    acceptedOddsVersion?: number,
    lastFetchedAt?: string,
    status?: string,
    uiStatus?: "fresh" | "warning" | "expired" | "suspended" | "closed",
  ) => {
    setSelectedBetsBySlot((prevBySlot) => {
      const prev = prevBySlot[activeSlipSlot];
      const exists = prev.find((b) => b.matchId === match.id && b.market === market && b.selection === selection);
      if (exists) {
        const nextSlot = prev.filter((b) => !(b.matchId === match.id && b.market === market && b.selection === selection));
        return { ...prevBySlot, [activeSlipSlot]: nextSlot };
      }

      const matchExternalEventId = match.externalEventId ?? null;
      const hasExistingForMatch = prev.some(
        (b) =>
          b.matchId === match.id ||
          (matchExternalEventId && b.externalEventId && String(b.externalEventId) === String(matchExternalEventId)),
      );
      const filteredPrev = prev.filter(
        (b) =>
          !(
            b.matchId === match.id ||
            (matchExternalEventId && b.externalEventId && String(b.externalEventId) === String(matchExternalEventId))
          ),
      );
      if (hasExistingForMatch) {
        setBetslipNotice("Selection updated for this match.");
        setTimeout(() => setBetslipNotice(null), 2000);
      }

      const nextSlot: BetSelection[] = [
        ...filteredPrev,
        {
          matchId: match.id,
          matchName: `${match.homeTeam} v ${match.awayTeam}`,
          externalEventId: matchExternalEventId,
          market,
          selection,
          odd,
          outcomeId,
          acceptedOddsVersion,
          lastFetchedAt,
          status,
          uiStatus,
        },
      ];
      if (nextSlot.length === 1) setIsBetslipOpen(true);
      return { ...prevBySlot, [activeSlipSlot]: nextSlot };
    });
  };

  const requestRefreshOdds = async (fixtureId: string) => {
    try {
      await refreshVisibleOdds.mutateAsync([fixtureId]);
      await queryClient.invalidateQueries({ queryKey: ["fixtures"] });
    } catch {
      // Ignore; odds will remain disabled until next poll.
    }
  };

  const chunk = <T,>(arr: T[], size: number) => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const removeBet = (matchId: string, market: string, selection: string) => {
    setSelectedBetsBySlot((prevBySlot) => ({
      ...prevBySlot,
      [activeSlipSlot]: prevBySlot[activeSlipSlot].filter(
        (b) => !(b.matchId === matchId && b.market === market && b.selection === selection),
      ),
    }));
    setBetslipNotice(null);
  };

  const [currentBanner, setCurrentBanner] = useState(0);
  const defaultBanners = [
    {
      title: "Take Control Before",
      subtitle: "The Final Whistle,",
      highlight: "Early Cashout",
      image:
        "https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=1200",
      color: "bg-brand-primary",
    },
    {
      title: "Champions League",
      subtitle: "Final Countdown,",
      highlight: "Boosted Odds",
      image:
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200",
      color: "bg-brand-yellow",
    },
    {
      title: "Weekend Special",
      subtitle: "Accumulator Bonus,",
      highlight: "20% Extra Win",
      image:
        "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=1200",
      color: "bg-white",
    },
  ];

  const banners = (remoteBanners || []).length
    ? (remoteBanners as any[]).map((b: any) => ({
        title: String(b?.title || ""),
        subtitle: b?.subtitle ?? "",
        highlight: b?.highlight ?? "",
        image: String(b?.imageUrl || ""),
        color: String(b?.color || "bg-brand-primary"),
      }))
    : defaultBanners;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleMatchClick = (matchId: string) => {
    if (activeProvider === "pissbet_socket") {
      const m = visibleFixtures.find((x: any) => String(x?.id) === String(matchId));
      const eventId = Number((m as any)?.externalEventId ?? String(matchId).split(":")[1]);
      if (Number.isFinite(eventId) && eventId > 0) {
        pissbetStream.subscribeEvent(eventId);
      }
    }
    setSelectedMatchId(matchId);
    setView("detail");
  };

  const handleViewChange = (newView: string) => {
    setView(newView);
    setSelectedMatchId(null);
    if (newView === 'home') {
      setActiveSport(null);
      setActiveLeague(null);
      setActiveLeagueId(null);
      setActiveApiFootballLeagueId(null);
    }
  };


  const apifbInfinite = useFixturesInfinite({
    enabled: !!activeProvider && activeProvider !== "mezzo" && activeProvider !== "pissbet_socket",
    sportId: activeSport,
    leagueName: activeLeague,
    leagueId: activeLeagueId,
    apiFootballLeagueId: activeApiFootballLeagueId,
    timeLimit: timeFilter,
    tab: fixturesTab,
    providerOverride: activeProvider,
  });

  const data = apifbInfinite.data;
  const fixturesQueryIsFetching = activeProvider === "mezzo" ? (mezzoTopEvents as any).isFetching : apifbInfinite.isFetching;
  const fixturesQueryStatus = activeProvider === "mezzo" ? (mezzoTopEvents as any).status : apifbInfinite.status;

  const fetchNextPage = activeProvider === "mezzo" ? (mezzoTopEvents as any).fetchNextPage : apifbInfinite.fetchNextPage;
  const hasNextPage = activeProvider === "mezzo" ? (mezzoTopEvents as any).hasNextPage : apifbInfinite.hasNextPage;
  const isFetchingNextPage = activeProvider === "mezzo" ? (mezzoTopEvents as any).isFetchingNextPage : apifbInfinite.isFetchingNextPage;


  const fixturesRaw =
    activeProvider === "pissbet_socket"
      ? pissbetStream.matches
      : activeProvider === "mezzo"
        ? ((mezzoTopEvents as any).data?.matches || [])
        : (data?.pages.flatMap(page => page.fixtures) || []);
  // Backend dedupes by canonical identity, but keep a client-side guard too.
  const normalizeText = (value: any) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\s+vs\s+/g, " v ")
      .replace(/\s+v\s+/g, " v ");

  const canonicalKey = (f: any) => {
    const provider = String(f?.externalProvider || f?.external_provider || "unknown").trim();
    const externalId = f?.externalEventId ?? f?.external_event_id ?? f?.sourceEventId ?? f?.source_event_id;
    if (externalId) return `${provider}:${String(externalId)}`;

    const sport = f?.sportName || f?.Sport?.name || "";
    const league = f?.league || f?.League?.name || "";
    const home = f?.homeTeam || f?.homeTeamName || "";
    const away = f?.awayTeam || f?.awayTeamName || "";
    const startsAt = f?.startsAt || "";
    try {
      const iso = startsAt ? new Date(startsAt).toISOString() : "";
      const fallback = [sport, league, home, away, iso].map(normalizeText).join("|");
      if (fallback.replace(/\|/g, "").trim()) return fallback;
    } catch {
      // ignore
    }

    return `local:${f?.id}`;
  };
  const fixtures = (() => {
    const map = new Map<string, any>();
    for (const f of fixturesRaw) map.set(canonicalKey(f), f); // prefer latest page occurrence
    return Array.from(map.values());
  })();

  const providerFilteredFixtures = (() => {
    // For Mezzo + Pissbet, filtering happens client-side (they don't use /betting/fixtures).
    if (activeProvider === "mezzo") {
      // Mezzo filtering is backend-driven via `/odds/mezzo/top-events` params.
      return fixtures;
    }

    if (activeProvider === "pissbet_socket") {
      return fixtures.filter((f: any) => {
        if (activeSport && String(activeSport) !== "football") return false;
        if (activeLeagueId) return true; // pissbet doesn't have stable league ids in this mapping
        if (activeLeague) {
          const league = String(f?.league || "").trim();
          if (league && league !== String(activeLeague)) return false;
        }
        return true;
      });
    }

    // API-Football path is server-filtered via query params.
    return fixtures;
  })();

  const tabSortedFixtures = (() => {
    const items = [...providerFilteredFixtures];
    const startsAtMs = (f: any) => {
      const t = f?.startsAt ? new Date(f.startsAt).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };

    if (fixturesTab === "top") {
      items.sort((a: any, b: any) => {
        const aTop = a?.isTop ? 1 : 0;
        const bTop = b?.isTop ? 1 : 0;
        if (aTop !== bTop) return bTop - aTop;

        const aPrices = Number(a?.pricesCount ?? 0) || 0;
        const bPrices = Number(b?.pricesCount ?? 0) || 0;
        if (aPrices !== bPrices) return bPrices - aPrices;

        const aStart = startsAtMs(a);
        const bStart = startsAtMs(b);
        if (aStart && bStart && aStart !== bStart) return aStart - bStart;
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return String(a?.id || "").localeCompare(String(b?.id || ""));
      });
      return items;
    }

    // Upcoming: nearest kickoff first.
    items.sort((a: any, b: any) => {
      const aStart = startsAtMs(a);
      const bStart = startsAtMs(b);
      if (aStart && bStart && aStart !== bStart) return aStart - bStart;
      if (aStart && !bStart) return -1;
      if (!aStart && bStart) return 1;
      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });
    return items;
  })();

  const isStartedOrCompleted = (f: any) => {
    // IMPORTANT: avoid time-based filtering here (timezone/format issues can hide valid upcoming fixtures).
    // Only hide fixtures that are explicitly live/started or completed/closed.
    const status = String(f?.status || f?.matchStatus || f?.state || "").toLowerCase();
    if (!status) return false;

    // Started / in-play
    if (["live", "inplay", "in_play", "1h", "2h", "ht", "et", "pen", "started"].includes(status)) return true;

    // Completed / removed
    return ["ft", "finished", "ended", "completed", "final", "closed", "settled", "canceled", "cancelled", "postponed"].includes(status);
  };

  const visibleFixtures = tabSortedFixtures.filter((f) => !isStartedOrCompleted(f));
  const showFixturesSkeleton =
    fixturesQueryStatus === "pending" ||
    (fixturesQueryIsFetching && visibleFixtures.length === 0) ||
    (activeProvider === "pissbet_socket" && !pissbetStream.hasData);

  // Bulk refresh visible fixtures (one call per chunk) so a page refresh updates odds "all at once".
  useEffect(() => {
    // Pissbet socket odds are live-streamed; there is no per-fixture refresh endpoint.
    if (activeProvider === "pissbet_socket") return;
    if (!visibleFixtures.length) return;
    if (bulkRefreshInFlightRef.current) return;

    const now = Date.now();
    // Client-side throttle; backend also has per-fixture locks.
    if (now - lastBulkRefreshAtRef.current < 20_000) return;

    const staleFixtureIds = visibleFixtures
      .filter((m) => {
        const markets = m.markets || [];
        const mainKeys = new Set(["1X2", "DC", "BTS"]);
        for (const mk of markets) {
          const key = String(mk.key || "").toUpperCase();
          if (!mainKeys.has(key)) continue;
          for (const o of mk.outcomes || []) {
            if (o.isSelectable === false) return true;
          }
        }
        return false;
      })
      .map((m) => m.id);

    if (!staleFixtureIds.length) return;

    bulkRefreshInFlightRef.current = true;
    lastBulkRefreshAtRef.current = now;

    (async () => {
      try {
        for (const group of chunk(Array.from(new Set(staleFixtureIds)), 30)) {
          await refreshVisibleOdds.mutateAsync(group);
        }
        await queryClient.invalidateQueries({ queryKey: ["fixtures"] });
      } finally {
        bulkRefreshInFlightRef.current = false;
      }
    })();
  }, [visibleFixtures, refreshVisibleOdds, queryClient]);

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 1.0 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    console.log("Filters:", { activeSport, activeLeague, timeFilter });
    console.log("Fixtures count:", visibleFixtures.length);
  }, [activeSport, activeLeague, timeFilter, visibleFixtures.length]);

  const selectedMatch = visibleFixtures.find((m) => m.id === selectedMatchId);

  const isLiveView = view === "live";
  const isGamesView = view === "games";
  const isVirtualView = view === "virtual";

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-brand-dark">
      <Header
        user={user}
        authLoading={authLoading}
        onAuth={handleAuth}
        onSignOut={handleSignOut}
        onOpenDeposit={() => {
          setAccountPanelTab("deposit");
          setView("account");
        }}
        onOpenBetsHistory={() => {
          setAccountPanelTab("bets");
          setView("account");
        }}
        onOpenCheckTicket={() => {
          setAccountPanelTab("ticket");
          setView("account");
        }}
      />
      <Navbar
        currentView={view === "detail" ? "home" : view}
        onViewChange={handleViewChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Only show sidebar on home/detail/live views */}
        {(view === "home" || view === "detail" || view === "live") && (
          <Sidebar 
            activeSport={activeSport} 
            onSportChange={setActiveSport}
            activeLeague={activeLeague}
            onLeagueChange={({ name, id, apiFootballLeagueId }) => {
              setActiveLeague(name);
              setActiveLeagueId(id);
              setActiveApiFootballLeagueId(apiFootballLeagueId);
            }}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            isHot={fixturesTab === "top"}
            onIsHotChange={(v) => setFixturesTab(v ? "top" : "upcoming")}
          />
        )}

        <main
          className={`flex-1 ${selectedMatchId ? "overflow-hidden" : "overflow-y-auto"} ${isGamesView || isVirtualView ? "bg-[#0a0a0a]" : "p-0 lg:p-4"} pb-32 lg:pb-4`}
        >
          {view === "account" ? (
            <div className="p-4 lg:p-0">
              <AccountPanelPage tab={accountPanelTab} onTabChange={setAccountPanelTab} user={user} />
            </div>
          ) : isGamesView ? (
            <GamesView />
          ) : isLiveView ? (
            <LiveView />
          ) : isVirtualView ? (
            <VirtualSportsView />
          ) : (
            <div
              className={`flex flex-col lg:flex-row lg:gap-6 transition-all duration-300 ${selectedMatchId ? "items-start h-full" : ""} max-w-full`}
            >
              {/* Left Column: Match List */}
              <div
                className={`transition-all duration-300 ${selectedMatchId ? "hidden lg:block lg:w-[40%] h-full overflow-y-auto no-scrollbar" : "w-full"} p-2 lg:p-0`}
              >
                {/* Banner Carousel */}
                {!selectedMatchId && (
                  <div className="relative w-full h-[180px] lg:h-[300px] lg:rounded-lg overflow-hidden mb-0.5 shadow-2xl -mx-2 lg:mx-0 w-[calc(100%+1rem)] lg:w-full group">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentBanner}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`absolute inset-0 ${banners[currentBanner].color}`}
                      >
                        <img
                          src={banners[currentBanner].image}
                          alt="Betting Banner"
                          className="absolute right-0 top-0 h-full w-2/3 object-cover mix-blend-multiply opacity-30 lg:opacity-60"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex flex-col justify-center px-6 lg:px-12 z-10">
                          <div className="flex flex-col">
                            <h2 className="text-2xl lg:text-4xl font-black text-black italic leading-none uppercase">
                              {banners[currentBanner].title}
                            </h2>
                            <h2 className="text-2xl lg:text-4xl font-black text-black italic leading-none uppercase mb-2 lg:mb-4">
                              {banners[currentBanner].subtitle}
                            </h2>
                            <div className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-black text-2xl lg:text-4xl italic uppercase tracking-tighter">
                              {banners[currentBanner].highlight}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-6 lg:left-8 z-20 flex gap-1.5">
                      {banners.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentBanner(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${currentBanner === idx ? "bg-black w-6" : "bg-black/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Match Headers - Pill Shaped */}
                <div className="flex bg-brand-surface rounded-full overflow-hidden mb-0.5 p-0.5 border border-white/5">
                  <button
                    onClick={() => {
                      setFixturesTab("upcoming");
                      setTimeFilter("3 Hours");
                      setSelectedMatchId(null);
                    }}
                    className={`px-4 py-2 font-normal transition-all flex-1 rounded-full ${selectedMatchId ? "text-[13px]" : "text-[14px]"} ${fixturesTab === "upcoming" ? "bg-brand-primary text-black shadow-lg shadow-green-500/20" : "text-gray-500 hover:text-white"}`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => {
                      setFixturesTab("top");
                      setSelectedMatchId(null);
                    }}
                    className={`px-4 py-2 font-normal flex-1 rounded-full transition-all ${fixturesTab === "top" ? "bg-brand-primary text-black shadow-lg shadow-green-500/20" : "text-gray-500 hover:text-white"} ${selectedMatchId ? "text-[13px]" : "text-[14px]"}`}
                  >
                    Top Matches
                  </button>
                </div>

                {/* Matches List */}
                <div className="bg-brand-surface rounded-2xl overflow-hidden border border-brand-border shadow-xl">
                  {/* Header Grid - Rounded Header */}
                  <div
                    className={`bg-[#111111] text-[9px] font-black text-gray-500 h-8 px-6 uppercase tracking-widest items-center border-b border-white/5 rounded-t-2xl ${selectedMatchId ? "flex justify-between" : "grid grid-cols-[1.5fr_1.5fr_1fr]"}`}
                  >
                    {selectedMatchId ? (
                      <span className="text-[10px] text-brand-primary">Match List</span>
                    ) : (
                      <>
                        <div className="text-left font-bold opacity-80 border-r border-white/50 h-full flex items-center">
                          Match Result
                        </div>
                        <div className=" font-bold text-center opacity-80 border-r border-white/50 h-full flex items-center justify-center">
                          Double chance
                        </div>
                        <div className="text-right font-bold pr-2 opacity-80 h-full flex items-center justify-end">
                          Both Score
                        </div>
                      </>
                    )}
                  </div>

                  {showFixturesSkeleton ? (
                    <MatchCardSkeletonList count={10} isCompact={!!selectedMatchId} />
                  ) : (
                    visibleFixtures.map((match) => (
                      <MatchCard
                        key={canonicalKey(match)}
                        match={match}
                        selectedBets={selectedBets}
                        onToggleBet={toggleBet}
                        onClick={handleMatchClick}
                        onRequestRefreshOdds={requestRefreshOdds}
                        isCompact={!!selectedMatchId}
                        isSelected={selectedMatchId === match.id}
                      />
                    ))
                  )}
                  
                  <div ref={loaderRef} className="h-10 flex items-center justify-center">
                    {isFetchingNextPage && (
                       <div className="flex gap-1">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                              className="w-1.5 h-1.5 rounded-full bg-brand-primary"
                            />
                          ))}
                       </div>
                    )}
                  </div>
                  
                  {!hasNextPage && visibleFixtures.length > 0 && (
                    <div className="p-8 text-center text-gray-600 text-[10px] font-black uppercase italic tracking-widest">
                      No more matches to show
                    </div>
                  )}

                  {fixturesQueryStatus === 'success' && visibleFixtures.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="text-gray-500 text-[11px] font-black uppercase italic mb-2">No matches found</div>
                      <button 
                        onClick={() => handleViewChange('home')}
                        className="text-brand-primary text-[10px] font-black uppercase italic underline"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Match Detail */}
              {selectedMatch && (
                <div className="w-full lg:w-[55%] h-full animate-in fade-in slide-in-from-right-4 duration-300 p-0 lg:p-0 overflow-hidden">
                  <MatchDetail
                    match={selectedMatch}
                    selectedBets={selectedBets}
                    onToggleBet={toggleBet}
                    onBack={() => {
                      setSelectedMatchId(null);
                      setView("home");
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sidebar/Drawer: Betslip */}
        {view !== "games" && view !== "virtual" && view !== "account" && (
      <Betslip
        selectedBets={selectedBets}
        onRemoveBet={removeBet}
        onClear={() => {
          setSelectedBetsBySlot((prevBySlot) => ({ ...prevBySlot, [activeSlipSlot]: [] }));
          setBetslipNotice(null);
        }}
        activeSlot={activeSlipSlot}
        onChangeSlot={(slot) => {
          setActiveSlipSlot(slot);
          setBetslipNotice(null);
        }}
        slotCounts={{
          1: selectedBetsBySlot[1].length,
          2: selectedBetsBySlot[2].length,
          3: selectedBetsBySlot[3].length,
        }}
        stake={stake}
        onStakeChange={setStake}
        isOpen={isBetslipOpen}
        onClose={() => {
          setIsBetslipOpen(false);
          setBetslipNotice(null);
        }}
        isAuthenticated={hasToken}
        authLoading={authLoading}
        onRequireAuth={() => setAuthModal({ open: true, type: "login" })}
        notice={betslipNotice}
      />
        )}
      </div>

      {/* Floating Betslip Button (Mobile Only) */}
      {selectedBets.length > 0 && !isBetslipOpen && (
        <div className="fixed bottom-24 right-4 z-[95] lg:hidden">
          <button
            onClick={() => setIsBetslipOpen(true)}
            className="w-16 h-16 bg-brand-yellow text-black rounded-full shadow-[0_10px_30px_rgba(250,204,21,0.4)] flex flex-col items-center justify-center border-4 border-brand-dark active:scale-90 transition-all group"
          >
            <div className="relative">
              <Smartphone className="w-6 h-6" />
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-dark">
                {selectedBets.length}
              </div>
            </div>
            <span className="text-[8px] font-black uppercase italic mt-1">
              Ticket
            </span>
          </button>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <MobileBottomNav currentView={view} onViewChange={handleViewChange} />

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        <button className="bg-brand-primary text-black p-4 rounded-full shadow-lg shadow-brand-primary/20 hover:scale-110 transition-transform">
          <Activity className="w-6 h-6" />
        </button>
      </div>

      <AuthModal
        isOpen={authModal.open}
        type={authModal.type}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        onSwitch={(type) => setAuthModal({ open: true, type })}
        onSuccess={(data) => setUser(data)}
      />
    </div>
  );
}
