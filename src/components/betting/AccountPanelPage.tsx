import { useMemo, useState } from "react";
import { useMyUserBetslips, useTicketDetails } from "../../modules/betslips/hooks";
import { Activity, CreditCard, Ticket, Clock, CheckCircle, XCircle, ChevronRight, Search } from "lucide-react";

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

function statusBadgeClass(status: any) {
  const v = normalizeBetStatus(status);
  if (v === "won" || v === "win" || v === "settled_won") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (v === "lost" || v === "lose" || v === "settled_lost") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  if (v === "pending" || v === "open" || v === "placed") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

function ticketCardClass(status: any) {
  const v = normalizeBetStatus(status);
  if (v === "won" || v === "win" || v === "settled_won") return "border-emerald-500/20 bg-emerald-500/[0.02]";
  if (v === "lost" || v === "lose" || v === "settled_lost") return "border-rose-500/20 bg-rose-500/[0.02]";
  return "border-zinc-800 bg-[#0d1117]";
}

export default function AccountPanelPage({ tab, onTabChange, user }: AccountPanelPageProps) {
  const [period, setPeriod] = useState<PeriodFilter>("24h");
  const [category, setCategory] = useState("sports");
  const [ticketId, setTicketId] = useState("");
  const [submittedTicketId, setSubmittedTicketId] = useState("");
  const { data: slips = [] } = useMyUserBetslips(tab === "bets" || tab === "ticket");
  const { data: ticket, isError } = useTicketDetails(submittedTicketId, tab === "ticket" && !!submittedTicketId);

  const filteredSlips = useMemo(() => {
    const now = Date.now();
    const maxAgeMs =
      period === "24h" ? 24 * 3600 * 1000 :
      period === "7d" ? 7 * 24 * 3600 * 1000 :
      period === "30d" ? 30 * 24 * 3600 * 1000 :
      null;
    return slips.filter((s: any) => {
      if (category !== "sports") return false;
      if (!maxAgeMs) return true;
      return now - new Date(s.placedAt || s.createdAt).getTime() <= maxAgeMs;
    });
  }, [slips, period, category]);

  return (
    <div className="bg-[#050505] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
      <div className="flex bg-[#0d1117] border-b border-zinc-800">
        {[
          { id: 'deposit', label: 'DEPOSIT', icon: CreditCard },
          { id: 'bets', label: 'MY BETS', icon: Activity },
          { id: 'ticket', label: 'CHECK TICKET', icon: Ticket }
        ].map((t) => (
            <button 
              key={t.id}
              onClick={() => onTabChange(t.id as AccountTab)} 
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${tab === t.id ? "text-[#ccff00] border-[#ccff00] bg-[#111]" : "text-zinc-600 border-transparent hover:text-zinc-400"}`}
            >
              <t.icon size={14} /> {t.label}
            </button>
        ))}
      </div>

      <div className="p-6 md:p-8">
        {tab === "deposit" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-[#0d1117] border border-zinc-800 rounded-2xl">
              <div>
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Available Balance</p>
                <p className="text-4xl font-black text-white mt-1 italic">{fmtMoney(user?.balance)}</p>
              </div>
              <button className="bg-[#ccff00] text-black px-8 py-3 rounded-xl font-black uppercase italic tracking-widest text-xs hover:bg-[#a8d100] transition-all">Top Up</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#0d1117] p-4 border border-zinc-800 rounded-xl"><span className="text-zinc-500 font-bold uppercase tracking-wider block mb-1">User ID</span> <span className="font-mono text-zinc-300">{user?.displayName || "-"}</span></div>
              <div className="bg-[#0d1117] p-4 border border-zinc-800 rounded-xl"><span className="text-zinc-500 font-bold uppercase tracking-wider block mb-1">Phone</span> <span className="font-mono text-zinc-300">{user?.phoneNumber || "-"}</span></div>
            </div>
          </div>
        )}

        {tab === "bets" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodFilter)} className="bg-[#0d1117] border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase px-4 py-3 rounded-xl w-full md:w-auto focus:outline-none focus:border-[#ccff00]">
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="all">All time</option>
              </select>
              <div className="flex-1" />
              <button className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-6 py-3 font-black text-[10px] uppercase rounded-xl hover:bg-zinc-800">Clear History</button>
            </div>

            <div className="space-y-3">
              {filteredSlips.map((slip: any) => {
                const stake = amount(slip.stake);
                const slipResult = slip.result || (slip.status === "settled" ? "pending" : slip.status);
                const possibleWin = amount(slip.potentialPayout);
                const settledPayout = slip.status === "settled" ? amount(slip.payout) : null;
                const payoutToShow = settledPayout !== null ? settledPayout : possibleWin;
                const odd = stake > 0 ? possibleWin / stake : 0;
                return (
                  <button
                    key={slip.id}
                    onClick={() => {
                      setTicketId(slip.id);
                      setSubmittedTicketId(slip.id);
                      onTabChange("ticket");
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 border rounded-2xl transition-all ${ticketCardClass(slipResult)}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-zinc-500 font-black text-[10px] tracking-widest">{fmtDate(slip.placedAt)}</div>
                      <div className="font-black text-white text-sm">MULTI BET</div>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                         <div className="text-[8px] uppercase font-black text-zinc-600 tracking-wider">Stake</div>
                         <div className="text-xs font-bold text-white">{stake.toFixed(2)} ETB</div>
                       </div>
                       <div className="text-right">
                         <div className="text-[8px] uppercase font-black text-zinc-600 tracking-wider">Payout</div>
                         <div className="text-xs font-bold text-[#ccff00]">{payoutToShow.toFixed(2)} ETB</div>
                       </div>
                       <span className={`px-3 py-1 text-[8px] font-black border rounded-full uppercase tracking-widest ${statusBadgeClass(slipResult)}`}>
                         {normalizeBetStatus(slipResult)}
                       </span>
                       <ChevronRight size={16} className="text-zinc-700" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "ticket" && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="ENTER TICKET ID..." className="w-full bg-[#0d1117] border border-zinc-800 px-12 py-4 text-white placeholder-zinc-700 outline-none rounded-2xl focus:border-[#ccff00] text-sm" />
              </div>
              <button onClick={() => setSubmittedTicketId(ticketId.trim())} className="bg-[#ccff00] text-black px-8 py-4 font-black text-xs uppercase rounded-2xl hover:bg-[#a8d100] transition-all italic">Check</button>
            </div>
            
            {!ticket && !isError && <div className="text-center py-20 text-zinc-700 font-bold uppercase tracking-widest">Enter ticket id to view status</div>}
            {isError && <div className="text-center py-20 text-rose-500 font-bold uppercase tracking-widest">Ticket not found</div>}
            
            {ticket && (
              <div className={`border rounded-2xl overflow-hidden ${ticketCardClass(ticket.result || ticket.status)}`}>
                <div className="px-6 py-4 bg-[#0d1117] flex items-center justify-between border-b border-zinc-800">
                  <div className="text-white font-black text-sm uppercase tracking-widest italic">TICKET: #{ticket.id.slice(0, 8)}</div>
                  <span className={`inline-flex items-center px-3 py-1 text-[8px] font-black border rounded-full uppercase tracking-widest ${statusBadgeClass(ticket.result || ticket.status)}`}>
                    {normalizeBetStatus(ticket.result || ticket.status)}
                  </span>
                </div>
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
                  const outcomeName = sel.snapshot?.outcome?.name || "-";
                  const matchName = fx?.homeTeamName && fx?.awayTeamName ? `${fx.homeTeamName} v ${fx.awayTeamName}` : outcomeName;
                  const selStatus = sel.result || "pending";
                  return (
                    <div key={sel.id} className="grid grid-cols-[1fr_auto] items-center px-6 py-5 border-b border-zinc-800 last:border-0 hover:bg-white/[0.02]">
                       <div>
                         <div className="font-bold text-white text-sm italic">{matchName}</div>
                         <div className="text-[9px] uppercase text-zinc-500 font-black tracking-wider mt-1">{outcomeName}</div>
                       </div>
                       <div className="text-right">
                         <div className="text-[#ccff00] font-black text-sm">{amount(sel.oddsAtPlacement).toFixed(2)}</div>
                         <div className={`mt-1 text-[8px] font-black uppercase px-2 py-0.5 border rounded ${statusBadgeClass(selStatus)}`}>{selStatus}</div>
                       </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-2 gap-4 px-6 py-6 bg-[#0d1117]/50 border-t border-zinc-800">
                  <div><div className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Stake</div><div className="text-white font-black">{fmtMoney(ticket.stake)}</div></div>
                  <div><div className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Total Odds</div><div className="text-white font-black">{(amount(ticket.potentialPayout) / Math.max(amount(ticket.stake), 1)).toFixed(2)}</div></div>
                  <div><div className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Potential Win</div><div className="text-[#ccff00] font-black">{fmtMoney(ticket.potentialPayout)}</div></div>
                  <div><div className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Tax (15%)</div><div className="text-rose-400 font-black">{fmtMoney(amount(ticket.potentialPayout) * 0.15)}</div></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
