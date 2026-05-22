import { useEffect, useMemo, useState } from "react";
import { useMyUserBetslips, useTicketDetails } from "../../modules/betslips/hooks";
import { Activity, CreditCard, Ticket, ChevronRight, Search, Clock, Wallet, Info, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type AccountTab = "deposit" | "bets" | "ticket";
type PeriodFilter = "24h" | "7d" | "30d" | "all";

interface AccountPanelPageProps {
  tab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
  user?: any;
}

function amount(v: any) {
  return Number(v || 0);
}

function fmtMoney(v: any) {
  return `${amount(v).toFixed(2)} ETB`;
}

function fmtDate(v?: string) {
  if (!v) return "-";
  const d = new Date(v);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function normalizeBetStatus(status: any) {
  return String(status || "").trim().toLowerCase();
}

function statusConfig(status: any) {
  const v = normalizeBetStatus(status);
  if (v === "won" || v === "win" || v === "settled_won") {
    return { label: "WON", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
  }
  if (v === "lost" || v === "lose" || v === "settled_lost") {
    return { label: "LOST", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" };
  }
  if (v === "pending" || v === "open" || v === "placed") {
    return { label: "PENDING", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
  }
  return { label: String(v || "UNKNOWN").toUpperCase(), bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };
}

function BetHistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-full bg-brand-dark/40 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex flex-col gap-2">
            <div className="h-2.5 w-32 bg-white/5 rounded" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
          <div className="flex items-center gap-8">
            <div className="h-6 w-16 bg-white/5 rounded" />
            <div className="h-6 w-16 bg-white/5 rounded" />
            <div className="h-8 w-20 bg-white/5 rounded-lg" />
            <div className="h-4 w-4 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketDetailsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 w-full bg-brand-dark/40 border border-white/5 rounded-2xl" />
      <div className="bg-brand-dark/20 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-8 py-6 flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-white/10 rounded" />
              <div className="h-3 w-32 bg-white/5 rounded" />
            </div>
            <div className="space-y-2 flex flex-col items-end">
              <div className="h-8 w-12 bg-white/10 rounded-lg" />
              <div className="h-3 w-16 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-brand-dark/40 border border-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function AccountPanelPage({ tab, onTabChange, user }: AccountPanelPageProps) {
  const [period, setPeriod] = useState<PeriodFilter>("24h");
  const [ticketId, setTicketId] = useState("");
  const [submittedTicketId, setSubmittedTicketId] = useState("");
  const [slipPage, setSlipPage] = useState(1);
  const slipsPerPage = 6;
  
  const { data: slips = [], isLoading: slipsLoading, refetch: refetchSlips, isFetching: slipsFetching } = useMyUserBetslips(tab === "bets" || tab === "ticket");
  const { data: ticket, isError, isLoading: ticketLoading, isFetching: ticketFetching, refetch: refetchTicket } = useTicketDetails(submittedTicketId, tab === "ticket" && !!submittedTicketId);

  const isTicketSearching = ticketLoading || (ticketFetching && !!submittedTicketId);

  const filteredSlips = useMemo(() => {
    const now = Date.now();
    const maxAgeMs =
      period === "24h" ? 24 * 3600 * 1000 :
      period === "7d" ? 7 * 24 * 3600 * 1000 :
      period === "30d" ? 30 * 24 * 3600 * 1000 :
      null;
    return slips.filter((s: any) => {
      if (!maxAgeMs) return true;
      return now - new Date(s.placedAt || s.createdAt).getTime() <= maxAgeMs;
    });
  }, [slips, period]);

  const totalSlipPages = Math.max(1, Math.ceil(filteredSlips.length / slipsPerPage));
  const pagedSlips = useMemo(() => {
    const safePage = Math.min(Math.max(1, slipPage), totalSlipPages);
    const start = (safePage - 1) * slipsPerPage;
    return filteredSlips.slice(start, start + slipsPerPage);
  }, [filteredSlips, slipPage, totalSlipPages]);

  useEffect(() => {
    setSlipPage(1);
  }, [period]);

  useEffect(() => {
    if (slipPage > totalSlipPages) setSlipPage(totalSlipPages);
  }, [slipPage, totalSlipPages]);

  const slipPagesToShow = useMemo(() => {
    if (totalSlipPages <= 7) return Array.from({ length: totalSlipPages }, (_, i) => i + 1);
    const pages = new Set<number>([1, totalSlipPages]);
    const start = Math.max(2, slipPage - 1);
    const end = Math.min(totalSlipPages - 1, slipPage + 1);
    for (let p = start; p <= end; p++) pages.add(p);
    return Array.from(pages).sort((a, b) => a - b);
  }, [slipPage, totalSlipPages]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header Tabs - Modern Pill Style */}
      <div className="bg-brand-dark border border-white/5 rounded-2xl p-1.5 flex gap-1 shadow-xl">
        {[
          { id: 'deposit', label: 'DEPOSIT', icon: Wallet },
          { id: 'bets', label: 'MY BETS', icon: Activity },
          { id: 'ticket', label: 'CHECK TICKET', icon: Ticket }
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => onTabChange(t.id as AccountTab)} 
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[11px] font-bold transition-all ${
              tab === t.id 
                ? "bg-brand-primary text-black shadow-lg shadow-brand-primary/10" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            <t.icon size={16} /> 
            <span className="tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl min-h-[500px]">
        <AnimatePresence mode="wait">
          {tab === "deposit" && (
            <motion.div 
              key="deposit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 space-y-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-brand-dark/50 border border-white/5 rounded-3xl gap-6">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">Total Available Balance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl font-black text-white">{amount(user?.balance).toFixed(2)}</span>
                    <span className="text-xl font-bold text-brand-primary">ETB</span>
                  </div>
                </div>
                <button className="w-full md:w-auto bg-brand-primary text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/10">
                  Top Up Now
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-dark/30 p-6 border border-white/5 rounded-2xl group hover:border-white/10 transition-colors">
                  <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest block mb-1.5">Account ID</span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white tracking-tight">{user?.displayName || user?.id || "-"}</span>
                    <CreditCard size={18} className="text-white/10 group-hover:text-brand-primary transition-colors" />
                  </div>
                </div>
                <div className="bg-brand-dark/30 p-6 border border-white/5 rounded-2xl group hover:border-white/10 transition-colors">
                  <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest block mb-1.5">Phone Number</span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white tracking-tight">{user?.phoneNumber || "-"}</span>
                    <Clock size={18} className="text-white/10 group-hover:text-brand-primary transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "bets" && (
            <motion.div 
              key="bets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex bg-brand-dark p-1 rounded-xl border border-white/5 gap-1">
                    {(["24h", "7d", "30d", "all"] as PeriodFilter[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          period === p ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {p === "all" ? "All Time" : p}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => refetchSlips()}
                    className={`p-2 rounded-lg bg-brand-dark border border-white/5 text-gray-500 hover:text-brand-primary transition-all ${slipsFetching ? 'animate-spin text-brand-primary' : ''}`}
                    title="Refresh bet history"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
                <button className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-red-400 transition-colors">
                  Clear History
                </button>
              </div>

              {slipsLoading ? (
                <BetHistorySkeleton />
              ) : (
                <div className="space-y-3">
                  {filteredSlips.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-white/10" />
                      </div>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">No bet history found</p>
                    </div>
                  ) : (
                    pagedSlips.map((slip: any) => {
                      const stake = amount(slip.stake);
                      const slipResult = slip.result || (slip.status === "settled" ? "pending" : slip.status);
                      const possibleWin = amount(slip.potentialPayout);
                      const settledPayout = slip.status === "settled" ? amount(slip.payout) : null;
                      const payoutToShow = settledPayout !== null ? settledPayout : possibleWin;
                      const config = statusConfig(slipResult);
                      
                      return (
                        <button
                          key={slip.id}
                          onClick={() => {
                            setTicketId(slip.id);
                            setSubmittedTicketId(slip.id);
                            onTabChange("ticket");
                          }}
                          className="w-full bg-brand-dark/40 border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all group"
                        >
                          <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="flex flex-col items-start">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{fmtDate(slip.placedAt)}</span>
                              <span className="text-sm font-black text-white mt-1">MULTI BET</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto">
                             <div className="text-right">
                               <div className="text-[8px] uppercase font-bold text-gray-600 tracking-wider mb-0.5">Stake</div>
                               <div className="text-xs font-bold text-white">{stake.toFixed(2)} <span className="text-[9px] text-gray-500">ETB</span></div>
                             </div>
                             <div className="text-right">
                               <div className="text-[8px] uppercase font-bold text-gray-600 tracking-wider mb-0.5">Payout</div>
                               <div className="text-xs font-bold text-brand-primary">{payoutToShow.toFixed(2)} <span className="text-[9px] text-brand-primary/60">ETB</span></div>
                             </div>
                             <div className={`px-3 py-1.5 rounded-lg border ${config.bg} ${config.text} ${config.border} text-[9px] font-black tracking-widest`}>
                               {config.label}
                             </div>
                             <ChevronRight size={16} className="text-white/10 group-hover:text-white transition-colors" />
                          </div>
                        </button>
                      );
                    })
                  )}

                  {filteredSlips.length > slipsPerPage && (
                    <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center sm:text-left">
                        Page {Math.min(Math.max(1, slipPage), totalSlipPages)} of {totalSlipPages}
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                        <button
                          onClick={() => setSlipPage((p) => Math.max(1, p - 1))}
                          disabled={slipPage <= 1}
                          className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-dark/60 border border-white/5 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:border-white/10 transition-all"
                        >
                          Prev
                        </button>
                        <div className="flex items-center gap-1 max-w-full overflow-x-auto whitespace-nowrap px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {slipPagesToShow.map((p, idx) => {
                            const prev = slipPagesToShow[idx - 1];
                            const showGap = idx > 0 && prev !== undefined && p - prev > 1;
                            return (
                              <div key={p} className="flex items-center gap-1">
                                {showGap && <span className="px-1 text-gray-700 text-[12px] font-black">…</span>}
                                <button
                                  onClick={() => setSlipPage(p)}
                                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-[10px] font-black border transition-all shrink-0 ${
                                    p === slipPage
                                      ? "bg-brand-primary text-black border-brand-primary shadow-lg shadow-brand-primary/10"
                                      : "bg-brand-dark/60 text-gray-400 border-white/5 hover:text-white hover:border-white/10"
                                  }`}
                                >
                                  {p}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setSlipPage((p) => Math.min(totalSlipPages, p + 1))}
                          disabled={slipPage >= totalSlipPages}
                          className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-dark/60 border border-white/5 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:border-white/10 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {tab === "ticket" && (
            <motion.div 
              key="ticket"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6"
            >
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    value={ticketId} 
                    onChange={(e) => setTicketId(e.target.value)} 
                    placeholder="ENTER TICKET ID..." 
                    className="w-full bg-brand-dark/60 border border-white/5 px-14 py-4.5 text-white placeholder-gray-700 outline-none rounded-2xl focus:border-brand-primary/50 transition-all text-sm font-bold tracking-tight" 
                  />
                </div>
                <button 
                  onClick={() => setSubmittedTicketId(ticketId.trim())} 
                  className="bg-brand-primary text-black px-10 py-4.5 font-black text-[11px] uppercase rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all tracking-widest shadow-lg shadow-brand-primary/10"
                >
                  Check
                </button>
              </div>
              
              {isTicketSearching ? (
                <TicketDetailsSkeleton />
              ) : !ticket && !isError ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-white/10" />
                  </div>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Enter your ticket id to see the status</p>
                </div>
              ) : isError ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-8 h-8 text-rose-500/40" />
                  </div>
                  <p className="text-rose-400 font-bold uppercase tracking-widest text-[11px]">Ticket not found</p>
                </div>
              ) : ticket ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-6 py-4 bg-brand-dark/40 border border-white/5 rounded-2xl">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Status Report</span>
                        <button 
                          onClick={() => refetchTicket()}
                          className={`p-1 rounded bg-white/5 text-gray-500 hover:text-brand-primary transition-all ${ticketFetching ? 'animate-spin text-brand-primary' : ''}`}
                        >
                          <RotateCw size={10} />
                        </button>
                      </div>
                      <div className="text-lg font-black text-white tracking-widest italic">TICKET: #{ticket.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    {(() => {
                      const config = statusConfig(ticket.result || ticket.status);
                      return (
                        <div className={`px-4 py-2 rounded-xl border ${config.bg} ${config.text} ${config.border} text-[10px] font-black tracking-[0.2em]`}>
                          {config.label}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-brand-dark/20 border border-white/5 rounded-3xl overflow-hidden">
                    {(ticket.BetSelections || []).map((sel: any) => {
                      const modelFx = sel.Outcome?.Market?.Fixture;
                      const fx = sel.snapshot?.fixture || (modelFx ? {
                        startsAt: modelFx.startsAt,
                        leagueName: modelFx.League?.name,
                        homeTeamName: modelFx.homeTeam?.name,
                        awayTeamName: modelFx.awayTeam?.name,
                        homeScore: modelFx.homeScore,
                        awayScore: modelFx.awayScore,
                        status: modelFx.status,
                      } : null);
                      const outcomeName = sel.snapshot?.outcome?.name || sel.Outcome?.name || "-";
                      const marketName = sel.snapshot?.market?.name || sel.Outcome?.Market?.name || "-";
                      const matchName = fx?.homeTeamName && fx?.awayTeamName ? `${fx.homeTeamName} v ${fx.awayTeamName}` : outcomeName;
                      const selStatus = sel.result || "pending";
                      const config = statusConfig(selStatus);

                      return (
                        <div key={sel.id} className="grid grid-cols-[1fr_auto] items-center px-8 py-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                           <div>
                             <div className="font-bold text-white text-[15px]">{matchName}</div>
                             <div className="flex items-center gap-2 mt-1.5">
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{marketName}</span>
                               <div className="w-1 h-1 rounded-full bg-white/10" />
                               <span className="text-[10px] font-bold text-brand-primary uppercase tracking-tight">{outcomeName}</span>
                             </div>
                           </div>
                           <div className="text-right flex flex-col items-end gap-2">
                             <div className="bg-white/5 text-white px-3 py-1.5 rounded-lg text-sm font-black tracking-tight border border-white/5">
                               {amount(sel.oddsAtPlacement).toFixed(2)}
                             </div>
                             <div className={`text-[8px] font-black uppercase px-2 py-0.5 border rounded ${config.bg} ${config.text} ${config.border} tracking-widest`}>
                               {config.label}
                             </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-brand-dark/40 p-5 border border-white/5 rounded-2xl">
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Stake</div>
                      <div className="text-white font-black text-lg">{fmtMoney(ticket.stake)}</div>
                    </div>
                    <div className="bg-brand-dark/40 p-5 border border-white/5 rounded-2xl">
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Odds</div>
                      <div className="text-white font-black text-lg">{(amount(ticket.potentialPayout) / Math.max(amount(ticket.stake), 1)).toFixed(2)}</div>
                    </div>
                    <div className="bg-brand-dark/40 p-5 border border-brand-primary/10 rounded-2xl shadow-lg shadow-brand-primary/5">
                      <div className="text-[9px] font-bold text-brand-primary/60 uppercase tracking-widest mb-1">Potential Win</div>
                      <div className="text-brand-primary font-black text-lg">{fmtMoney(ticket.potentialPayout)}</div>
                    </div>
                    <div className="bg-brand-dark/40 p-5 border border-white/5 rounded-2xl">
                      <div className="text-[9px] font-bold text-rose-500/60 uppercase tracking-widest mb-1">Tax (15%)</div>
                      <div className="text-rose-400 font-black text-lg">{fmtMoney(amount(ticket.potentialPayout) * 0.15)}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
