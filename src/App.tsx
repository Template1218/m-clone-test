import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Smartphone } from "lucide-react";
import { Match, BetSelection } from "./types";
import { MATCHES } from "./data";

// Modular Components
import Header from "./components/layout/Header";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import Betslip from "./components/betting/Betslip";
import MatchCard from "./components/betting/MatchCard";
import MatchDetail from "./components/betting/MatchDetail";
import AuthModal from "./components/betting/AuthModal";

import GamesView from "./components/games/GamesView";
import LiveView from "./components/live/LiveView";
import VirtualSportsView from "./components/virtual/VirtualSportsView";

export default function App() {
  const [selectedBets, setSelectedBets] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<number>(20);
  const [view, setView] = useState<string>("home");
  const [isBetslipOpen, setIsBetslipOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    type: "login" | "register";
  }>({
    open: false,
    type: "login",
  });

  const toggleBet = (
    match: Match,
    market: string,
    selection: string,
    odd: number,
  ) => {
    setSelectedBets((prev) => {
      const exists = prev.find(
        (b) =>
          b.matchId === match.id &&
          b.market === market &&
          b.selection === selection,
      );
      if (exists) {
        return prev.filter(
          (b) =>
            !(
              b.matchId === match.id &&
              b.market === market &&
              b.selection === selection
            ),
        );
      }
      const newBets = [
        ...prev,
        {
          matchId: match.id,
          matchName: `${match.homeTeam} v ${match.awayTeam}`,
          market,
          selection,
          odd,
        },
      ];
      if (newBets.length === 1) setIsBetslipOpen(true);
      return newBets;
    });
  };

  const removeBet = (matchId: string, market: string, selection: string) => {
    setSelectedBets((prev) =>
      prev.filter(
        (b) =>
          !(
            b.matchId === matchId &&
            b.market === market &&
            b.selection === selection
          ),
      ),
    );
  };

  const [currentBanner, setCurrentBanner] = useState(0);
  const banners = [
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleMatchClick = (matchId: string) => {
    setSelectedMatchId(matchId);
    setView("detail");
  };

  const handleViewChange = (newView: string) => {
    setView(newView);
    setSelectedMatchId(null);
  };

  const selectedMatch = MATCHES.find((m) => m.id === selectedMatchId);

  const isLiveView = view === "live";
  const isGamesView = view === "games";
  const isVirtualView = view === "virtual";

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-brand-dark">
      <Header
        user={user}
        onAuth={(type) => setAuthModal({ open: true, type })}
        onSignOut={() => {
          setUser(null);
          setView("home");
        }}
      />
      <Navbar
        currentView={view === "detail" ? "home" : view}
        onViewChange={handleViewChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Only show sidebar on home/detail/live views */}
        {(view === "home" || view === "detail" || view === "live") && (
          <Sidebar />
        )}

        <main
          className={`flex-1 overflow-y-auto ${isGamesView || isVirtualView ? "bg-[#0a0a0a]" : "p-0 lg:p-4"} pb-32 lg:pb-4`}
        >
          {isGamesView ? (
            <GamesView />
          ) : isLiveView ? (
            <LiveView />
          ) : isVirtualView ? (
            <VirtualSportsView />
          ) : (
            <div
              className={`flex flex-col lg:flex-row lg:gap-6 transition-all duration-300 ${selectedMatchId ? "items-start" : ""} max-w-full`}
            >
              {/* Left Column: Match List */}
              <div
                className={`transition-all duration-300 ${selectedMatchId ? "hidden lg:block lg:w-[45%]" : "w-full"} p-4 lg:p-0`}
              >
                {/* Banner Carousel */}
                {!selectedMatchId && (
                  <div className="relative w-full h-[200px] lg:h-[300px] lg:rounded-lg overflow-hidden mb-1 shadow-2xl -mx-4 lg:mx-0 w-[calc(100%+2rem)] lg:w-full group">
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
                <div className="flex bg-brand-surface rounded-full overflow-hidden mb-1 p-1 border border-white/5">
                  <button
                    className={`px-6 py-3  font-normal transition-all flex-1 rounded-full ${selectedMatchId ? "text-[15px]" : "text-[16px]"} ${!selectedMatchId ? "bg-brand-primary text-black shadow-lg shadow-green-500/20" : "text-gray-500 hover:text-white"}`}
                  >
                    Upcoming
                  </button>
                  <button
                    className={`px-6 py-3 font-normal flex-1 rounded-full transition-all text-gray-500 hover:text-white ${selectedMatchId ? "text-[15px]" : "text-[16px]"}`}
                  >
                    Top Matches
                  </button>
                </div>

                {/* Matches List */}
                <div className="bg-brand-surface rounded-4xl overflow-hidden border border-brand-border shadow-xl">
                  {/* Header Grid - Rounded Header */}
                  <div
                    className={`grid bg-[#111111] text-[9px] font-black text-gray-500 h-8 px-6 uppercase tracking-widest items-center border-b border-white/5 rounded-t-2xl ${selectedMatchId ? "grid-cols-[1.5fr_1.5fr_1fr]" : "grid-cols-[1.5fr_1.5fr_1fr]"}`}
                  >
                    <div className="text-left font-bold opacity-80 border-r border-white/50 h-full flex items-center">
                      Match Result
                    </div>
                    <div className=" font-bold text-center opacity-80 border-r border-white/50 h-full flex items-center justify-center">
                      Double chance
                    </div>
                    <div className="text-right font-bold pr-2 opacity-80 h-full flex items-center justify-end">
                      Both Score
                    </div>
                  </div>

                  {MATCHES.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      selectedBets={selectedBets}
                      onToggleBet={toggleBet}
                      onClick={handleMatchClick}
                      isCompact={!!selectedMatchId}
                      isSelected={selectedMatchId === match.id}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column: Match Detail */}
              {selectedMatch && (
                <div className="lg:w-[55%] animate-in fade-in slide-in-from-right-4 duration-300 lg:sticky lg:top-0 p-4 lg:p-0">
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
        {view !== "games" && view !== "virtual" && (
          <Betslip
            selectedBets={selectedBets}
            onRemoveBet={removeBet}
            onClear={() => setSelectedBets([])}
            stake={stake}
            onStakeChange={setStake}
            isOpen={isBetslipOpen}
            onClose={() => setIsBetslipOpen(false)}
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
