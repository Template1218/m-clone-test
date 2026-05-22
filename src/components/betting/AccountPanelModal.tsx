import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Search, Activity, CreditCard, Ticket, ChevronRight, Clock, Wallet, Info, RotateCw } from "lucide-react";
import { useMyUserBetslips, useTicketDetails } from "../../modules/betslips/hooks";

type PanelTab = "deposit" | "bets" | "ticket";

interface AccountPanelModalProps {
  isOpen: boolean;
  tab: PanelTab;
  onClose: () => void;
  onTabChange: (tab: PanelTab) => void;
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
  if (Number.isNaN(d.getTime())) return "-";
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

function SkeletonRow() {
  return (
    <div className="w-full bg-brand-dark/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-2 w-24 bg-white/5 rounded" />
        <div className="h-4 w-20 bg-white/10 rounded" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-4 w-12 bg-white/5 rounded" />
        <div className="h-8 w-16 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

export default function AccountPanelModal({ isOpen, tab, onClose, onTabChange, user }: AccountPanelModalProps) {
  const [ticketId, setTicketId] = useState("");
  const [submittedTicketId, setSubmittedTicketId] = useState("");
  const [slipPage, setSlipPage] = useState(1);
  const slipsPerPage = 5;
  const { data: slips = [], isLoading: slipsLoading, refetch: refetchSlips, isFetching: slipsFetching } = useMyUserBetslips(isOpen && (tab === "bets" || tab === "ticket"));
  const { data: ticket, isError: isTicketError, isLoading: ticketLoading, isFetching: ticketFetching, refetch: refetchTicket } = useTicketDetails(submittedTicketId, isOpen && tab === "ticket" && !!submittedTicketId);

  const isTicketSearching = ticketLoading || (ticketFetching && !!submittedTicketId);

  const totalSlipPages = Math.max(1, Math.ceil(slips.length / slipsPerPage));
  const pagedSlips = useMemo(() => {
    const safePage = Math.min(Math.max(1, slipPage), totalSlipPages);
    const start = (safePage - 1) * slipsPerPage;
    return slips.slice(start, start + slipsPerPage);
  }, [slips, slipPage, totalSlipPages]);

  useEffect(() => {
    if (!isOpen || tab !== "bets") return;
    setSlipPage(1);
  }, [isOpen, tab]);

  useEffect(() => {
    if (slipPage > totalSlipPages) setSlipPage(totalSlipPages);
  }, [slipPage, totalSlipPages]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            className="relative z-10 w-full max-w-4xl bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header Tabs */}
            <div className="flex items-center justify-between bg-brand-dark px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                {[
                  { key: "deposit", label: "DEPOSIT", icon: Wallet },
                  { key: "bets", label: "MY BETS", icon: Activity },
                  { key: "ticket", label: "CHECK TICKET", icon: Ticket },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => onTabChange(item.key as PanelTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                      tab === item.key 
                        ? "bg-brand-primary text-black" 
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <item.icon size={14} />
                    <span className="tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              {tab === "deposit" && (
                <div className="space-y-6">
                  <div className="p-8 bg-brand-dark/50 border border-white/5 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Available Balance</p>
                    <div className="text-4xl font-black text-white flex items-center justify-center gap-2">
                      {amount(user?.balance).toFixed(2)}
                      <span className="text-lg font-bold text-brand-primary">ETB</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-brand-dark/30 p-5 border border-white/5 rounded-xl">
                      <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest block mb-1">Account ID</span>
                      <span className="font-bold text-white">{user?.displayName || user?.id || "-"}</span>
                    </div>
                    <div className="bg-brand-dark/30 p-5 border border-white/5 rounded-xl">
                      <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest block mb-1">Phone</span>
                      <span className="font-bold text-white">{user?.phoneNumber || "-"}</span>
                    </div>
                  </div>
                </div>
              )}

              {tab === "bets" && (
                <div className="space-y-3">
                  <div className="flex justify-end mb-2 px-1">
                    <button 
                      onClick={() => refetchSlips()}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-dark border border-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary transition-all ${slipsFetching ? 'text-brand-primary' : ''}`}
                    >
                      <RotateCw size={12} className={slipsFetching ? 'animate-spin' : ''} />
                      {slipsFetching ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  {slipsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : slips.length === 0 ? (
                    <div className="py-20 text-center text-gray-500 font-bold uppercase tracking-widest text-[11px]">No bets found</div>
                  ) : (
                    pagedSlips.map((slip: any) => {
                      const config = statusConfig(slip.result || slip.status);
                      return (
                        <div 
                          key={slip.id} 
                          className="w-full bg-brand-dark/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{fmtDate(slip.placedAt)}</span>
                            <span className="text-sm font-black text-white mt-1">MULTI BET</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                               <div className="text-[8px] uppercase font-bold text-gray-600 tracking-wider">Stake</div>
                               <div className="text-xs font-bold text-white">{amount(slip.stake).toFixed(2)}</div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg border ${config.bg} ${config.text} ${config.border} text-[9px] font-black tracking-widest`}>
                               {config.label}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}

                  {slips.length > slipsPerPage && (
                    <div className="flex items-center justify-between pt-2 px-1">
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        Page {Math.min(Math.max(1, slipPage), totalSlipPages)} of {totalSlipPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSlipPage((p) => Math.max(1, p - 1))}
                          disabled={slipPage <= 1}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-brand-dark border border-white/5 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:border-white/10 transition-all"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setSlipPage((p) => Math.min(totalSlipPages, p + 1))}
                          disabled={slipPage >= totalSlipPages}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-brand-dark border border-white/5 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:border-white/10 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "ticket" && (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        placeholder="ENTER TICKET ID..."
                        className="w-full bg-brand-dark/60 border border-white/5 px-12 py-3.5 text-white placeholder-gray-700 outline-none rounded-xl focus:border-brand-primary/50 text-sm font-bold"
                      />
                    </div>
                    <button onClick={() => setSubmittedTicketId(ticketId.trim())} className="bg-brand-primary text-black px-8 py-3.5 font-black text-[11px] uppercase rounded-xl tracking-widest shadow-lg shadow-brand-primary/10">CHECK</button>
                  </div>

                  {isTicketSearching ? (
                     <div className="space-y-4 animate-pulse">
                        <div className="h-14 w-full bg-white/5 rounded-xl" />
                        <div className="h-40 w-full bg-white/5 rounded-2xl" />
                     </div>
                  ) : isTicketError ? (
                    <div className="text-rose-400 text-center py-10 font-bold uppercase tracking-widest text-[10px]">Ticket not found.</div>
                  ) : ticket ? (
                    <div className="space-y-4">
                      <div className="bg-brand-dark/40 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic leading-none">Ticket Selections</span>
                           <button 
                             onClick={() => refetchTicket()}
                             className={`flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-brand-primary transition-all ${ticketFetching ? 'text-brand-primary' : ''}`}
                           >
                             <RotateCw size={12} className={ticketFetching ? 'animate-spin' : ''} />
                             {ticketFetching ? 'Refreshing...' : 'Refresh'}
                           </button>
                        </div>
                        {(ticket.BetSelections || []).map((sel: any) => {
                          const outcomeName = sel.snapshot?.outcome?.name || sel.Outcome?.name || "-";
                          const marketName = sel.snapshot?.market?.name || sel.Outcome?.Market?.name || "-";
                          const selStatus = sel.result || "pending";
                          const config = statusConfig(selStatus);
                          return (
                            <div key={sel.id} className="flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0">
                              <div>
                                <div className="font-bold text-white text-sm italic">{sel.snapshot?.fixture?.homeTeamName} v {sel.snapshot?.fixture?.awayTeamName}</div>
                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{marketName} : {outcomeName}</div>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <div className="text-brand-primary font-black text-xs">{amount(sel.oddsAtPlacement).toFixed(2)}</div>
                                <div className={`text-[7px] font-black uppercase px-2 py-0.5 border rounded ${config.bg} ${config.text} ${config.border}`}>{config.label}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-brand-dark/40 p-4 border border-white/5 rounded-xl">
                          <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Stake</div>
                          <div className="text-white font-black text-sm">{fmtMoney(ticket.stake)}</div>
                        </div>
                        <div className="bg-brand-dark/40 p-4 border border-white/5 rounded-xl">
                          <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Odds</div>
                          <div className="text-white font-black text-sm">{(amount(ticket.potentialPayout) / Math.max(amount(ticket.stake), 1)).toFixed(2)}</div>
                        </div>
                        <div className="bg-brand-dark/40 p-4 border border-brand-primary/20 rounded-xl">
                          <div className="text-[8px] font-bold text-brand-primary uppercase tracking-widest">Win</div>
                          <div className="text-brand-primary font-black text-sm">{fmtMoney(ticket.potentialPayout)}</div>
                        </div>
                        <div className="bg-brand-dark/40 p-4 border border-white/5 rounded-xl">
                          <div className="text-[8px] font-bold text-rose-500 uppercase tracking-widest">Tax</div>
                          <div className="text-rose-400 font-black text-sm">{fmtMoney(amount(ticket.potentialPayout) * 0.15)}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
