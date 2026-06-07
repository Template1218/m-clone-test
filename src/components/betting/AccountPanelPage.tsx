import { useEffect, useMemo, useState } from "react";
import { useMyUserBetslips, useTicketDetails } from "../../modules/betslips/hooks";
import { Activity, CreditCard, Ticket, ChevronRight, Search, Clock, Wallet, Info, RotateCw, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../lib/api";

type AccountTab = "deposit" | "withdraw" | "bets" | "ticket";
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
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawRequest, setWithdrawRequest] = useState<any>(null);
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
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

  const requestWithdrawal = async () => {
    const amountValue = Number(withdrawAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setWithdrawMessage("Enter a valid amount.");
      return;
    }
    setWithdrawLoading(true);
    setWithdrawMessage("");
    setWithdrawRequest(null);
    try {
      const { data } = await api.post("/users/me/withdrawal-requests", { amount: amountValue });
      setWithdrawRequest(data.request);
      setWithdrawAmount("");
    } catch (e: any) {
      setWithdrawMessage(e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "Could not create withdrawal token.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header Tabs - Modern Pill Style */}
      <div className="bg-brand-dark border border-white/10 rounded-2xl p-1.5 flex gap-1 shadow-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'deposit', label: 'DEPOSIT', icon: Wallet },
          { id: 'withdraw', label: 'WITHDRAW', icon: ArrowUpRight },
          { id: 'bets', label: 'MY BETS', icon: Activity },
          { id: 'ticket', label: 'TICKET', icon: Ticket }
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => onTabChange(t.id as AccountTab)} 
            className={`flex-1 min-w-[80px] sm:min-w-0 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] sm:text-[11px] font-black transition-all ${
              tab === t.id 
                ? "bg-brand-primary text-black shadow-lg shadow-brand-primary/20 scale-[0.98]" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            <t.icon size={14} className="flex-shrink-0" /> 
            <span className="tracking-tighter sm:tracking-widest truncate">{t.label}</span>
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
              className="p-6 sm:p-10 space-y-8"
            >
              <div className="p-8 bg-zinc-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Available Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold text-white tabular-nums">
                    {amount(user?.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-base font-bold text-brand-primary">ETB</span>
                </div>
              </div>
              
              <div className="max-w-2xl mx-auto w-full">
                <div className="divide-y divide-white/5 bg-zinc-950/50 border border-white/5 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <CreditCard size={18} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Account Identifier</p>
                        <p className="text-[15px] font-medium text-white">{user?.displayName || user?.id || "-"}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-brand-primary/80 uppercase px-2 py-1 bg-brand-primary/10 rounded">Active</span>
                  </div>
                  
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Wallet size={18} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Withdrawal Method</p>
                        <p className="text-[15px] font-medium text-white">Main Wallet</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600" />
                  </div>

                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Clock size={18} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Registration Date</p>
                        <p className="text-[15px] font-medium text-white">{fmtDate(user?.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "withdraw" && (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 space-y-6"
            >
              <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-zinc-900 border border-white/5 rounded-2xl gap-8 shadow-sm">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Available Balance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">{amount(user?.balance).toFixed(2)}</span>
                    <span className="text-lg font-bold text-brand-primary">ETB</span>
                  </div>
                </div>
                <div className="w-full md:w-[320px] space-y-3">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && requestWithdrawal()}
                    placeholder="Enter amount"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-xl text-sm font-medium outline-none focus:border-brand-primary/50 transition-colors"
                  />
                  <button
                    onClick={requestWithdrawal}
                    disabled={withdrawLoading}
                    className="w-full bg-brand-primary text-black px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[11px] disabled:opacity-50 transition-all hover:brightness-105"
                  >
                    {withdrawLoading ? "PROCESSING..." : "GET TOKEN"}
                  </button>
                </div>
              </div>

              {withdrawRequest ? (
                <div className="bg-brand-dark/40 border border-brand-primary/20 rounded-3xl p-8 text-center space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Give this token to the cashier</p>
                  <div className="text-5xl font-black tracking-[0.25em] text-brand-primary">{withdrawRequest.token}</div>
                  <div className="text-sm font-bold text-white">{fmtMoney(withdrawRequest.amount)}</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Expires {fmtDate(withdrawRequest.expiresAt)}
                  </div>
                </div>
              ) : null}

              {withdrawMessage ? <div className="text-sm font-bold text-rose-400">{withdrawMessage}</div> : null}
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none flex bg-brand-dark p-1 rounded-xl border border-white/10 gap-0.5">
                    {(["24h", "7d", "30d", "all"] as PeriodFilter[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
                          period === p ? "bg-white/10 text-white shadow-inner" : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {p === "all" ? (
                          <>
                            <span className="hidden sm:inline">All Time</span>
                            <span className="sm:hidden">All</span>
                          </>
                        ) : p}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => refetchSlips()}
                    className={`p-2.5 rounded-xl bg-brand-dark border border-white/10 text-gray-500 hover:text-brand-primary transition-all active:scale-90 ${slipsFetching ? 'animate-spin text-brand-primary' : ''}`}
                    title="Refresh bet history"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
                <button className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-rose-400 transition-colors py-1">
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
                          className="w-full bg-zinc-900/50 border border-white/5 hover:border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors group"
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{fmtDate(slip.placedAt)}</span>
                            <span className="text-sm font-bold text-white">Multi Bet</span>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                             <div className="text-right">
                               <p className="text-[9px] uppercase font-bold text-zinc-600 mb-0.5">Stake</p>
                               <p className="text-sm font-bold text-white">{stake.toFixed(2)} <span className="text-[10px] text-zinc-500">ETB</span></p>
                             </div>
                             <div className="text-right">
                               <p className="text-[9px] uppercase font-bold text-zinc-600 mb-0.5">Payout</p>
                               <p className="text-sm font-bold text-brand-primary">{payoutToShow.toFixed(2)} <span className="text-[10px] text-brand-primary/60">ETB</span></p>
                             </div>
                             <div className={`px-3 py-1.5 rounded-lg border ${config.bg} ${config.text} ${config.border} text-[9px] font-bold tracking-widest`}>
                               {config.label}
                             </div>
                             <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
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
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    value={ticketId} 
                    onChange={(e) => setTicketId(e.target.value)} 
                    placeholder="Enter ticket ID..." 
                    className="w-full bg-zinc-900 border border-white/5 px-10 py-3.5 text-white placeholder-zinc-700 outline-none rounded-xl focus:border-brand-primary/40 transition-all text-sm font-medium" 
                  />
                </div>
                <button 
                  onClick={() => setSubmittedTicketId(ticketId.trim())} 
                  className="bg-brand-primary text-black px-8 py-3.5 font-bold text-[11px] uppercase rounded-xl transition-all hover:brightness-105 active:scale-95 tracking-widest"
                >
                  Check
                </button>
              </div>
              
              {isTicketSearching ? (
                <TicketDetailsSkeleton />
              ) : !ticket && !isError ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-zinc-800" />
                  </div>
                  <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Enter ticket ID to check status</p>
                </div>
              ) : isError ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-8 h-8 text-rose-500/30" />
                  </div>
                  <p className="text-rose-400 font-bold uppercase tracking-widest text-[10px]">Ticket not found</p>
                </div>
              ) : ticket ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border border-white/5 rounded-xl">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Ticket Details</span>
                        <button 
                          onClick={() => refetchTicket()}
                          className={`p-1 text-zinc-600 hover:text-brand-primary transition-colors ${ticketFetching ? 'animate-spin text-brand-primary' : ''}`}
                        >
                          <RotateCw size={12} />
                        </button>
                      </div>
                      <div className="text-base font-bold text-white tracking-widest uppercase">ID: {ticket.id.slice(0, 8)}</div>
                    </div>
                    {(() => {
                      const config = statusConfig(ticket.result || ticket.status);
                      return (
                        <div className={`px-4 py-1.5 rounded-lg border ${config.bg} ${config.text} ${config.border} text-[9px] font-bold tracking-widest`}>
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
