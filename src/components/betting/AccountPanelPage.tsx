import { useMemo, useState } from "react";
import { useMyUserBetslips, useTicketDetails } from "../../modules/betslips/hooks";

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
  if (v === "won" || v === "win" || v === "settled_won") return "bg-green-600/20 text-green-300 border-green-600/30";
  if (v === "lost" || v === "lose" || v === "settled_lost") return "bg-red-600/20 text-red-300 border-red-600/30";
  if (v === "pending" || v === "open" || v === "placed") return "bg-yellow-600/20 text-yellow-200 border-yellow-600/30";
  if (v === "void" || v === "refunded") return "bg-slate-500/20 text-slate-200 border-slate-500/30";
  if (v === "cancelled" || v === "canceled") return "bg-slate-500/20 text-slate-200 border-slate-500/30";
  if (v === "manual_review") return "bg-orange-600/20 text-orange-200 border-orange-600/30";
  return "bg-slate-500/20 text-slate-200 border-slate-500/30";
}

function ticketCardClass(status: any) {
  const v = normalizeBetStatus(status);
  if (v === "won" || v === "win" || v === "settled_won") return "border-green-600/40 bg-green-600/10 hover:bg-green-600/15";
  if (v === "lost" || v === "lose" || v === "settled_lost") return "border-red-600/40 bg-red-600/10 hover:bg-red-600/15";
  if (v === "void" || v === "refunded") return "border-slate-400/30 bg-slate-400/10 hover:bg-slate-400/15";
  if (v === "manual_review") return "border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/15";
  return "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]";
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
    <div className="bg-[#1f1a2d] border border-white/10 rounded-md overflow-hidden">
      <div className="bg-[#4d7a26] px-5 py-3 flex items-center gap-5 text-sm font-black">
        <button onClick={() => onTabChange("deposit")} className={`${tab === "deposit" ? "text-white" : "text-white/80"}`}>DEPOSIT</button>
        <button onClick={() => onTabChange("bets")} className={`${tab === "bets" ? "text-white bg-black/20 px-2 py-1 rounded-sm" : "text-white/80"}`}>MY BETS</button>
        <button onClick={() => onTabChange("ticket")} className={`${tab === "ticket" ? "text-white" : "text-white/80"}`}>CHECK TICKET</button>
      </div>

      <div className="p-4">
        {tab === "deposit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white text-sm">
            <div className="border border-white/10 p-3"><span className="text-white/60">User:</span> {user?.displayName || "-"}</div>
            <div className="border border-white/10 p-3"><span className="text-white/60">Phone:</span> {user?.phoneNumber || "-"}</div>
            <div className="border border-white/10 p-3"><span className="text-white/60">Role:</span> {user?.Role?.name || "user"}</div>
            <div className="border border-white/10 p-3"><span className="text-white/60">Balance:</span> <span className="text-[#7CBB3D] font-bold">{fmtMoney(user?.balance)}</span></div>
          </div>
        )}

        {tab === "bets" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-4">
              <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodFilter)} className="bg-transparent border border-white/20 text-white px-3 py-2">
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="all">All time</option>
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-transparent border border-white/20 text-white px-3 py-2">
                <option value="sports">Sports</option>
              </select>
              <button className="bg-red-600 text-white px-4 py-2 font-bold text-sm">CLEAR HISTORY</button>
            </div>

            <div className="border border-white/10">
              <div className="grid grid-cols-6 px-3 py-2 text-white/70 bg-[#2a2440]">
                <div>Date</div><div>Type</div><div>Amount</div><div>Odd</div><div>Payout</div><div>Status</div>
              </div>
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
                    className={`w-full text-left grid grid-cols-6 px-3 py-3 border-t border-white/10 text-white border ${ticketCardClass(slipResult)}`}
                  >
                    <div>{fmtDate(slip.placedAt)}</div>
                    <div className="font-bold">MULTI</div>
                    <div>{stake.toFixed(2)}</div>
                    <div className="text-[#7CBB3D] font-bold">x {odd.toFixed(2)}</div>
                    <div>{payoutToShow.toFixed(2)}</div>
                    <div className="uppercase">
                      <span className={`inline-flex items-center px-2 py-1 text-[10px] font-black border rounded ${statusBadgeClass(slipResult)}`}>
                        {normalizeBetStatus(slipResult) || "-"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "ticket" && (
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="Enter ticket id" className="bg-transparent border border-white/20 px-3 py-2 text-white outline-none" />
              <button onClick={() => setSubmittedTicketId(ticketId.trim())} className="bg-[#7CBB3D] text-white px-5 py-2 font-bold">CHECK</button>
              <button className="bg-[#7CBB3D] text-white px-5 py-2 font-bold">COPY BET</button>
            </div>
            {!ticket && !isError && <div className="text-white/70">Enter your placed ticket id to view details.</div>}
            {isError && <div className="text-red-300">Ticket not found.</div>}
            {ticket && (
              <div className={`border ${ticketCardClass(ticket.result || ticket.status)}`}>
                <div className="px-3 py-3 bg-[#2a2440] flex items-center justify-between">
                  <div className="text-white font-black text-sm uppercase">Ticket</div>
                  <span className={`inline-flex items-center px-2 py-1 text-[10px] font-black border rounded uppercase ${statusBadgeClass(ticket.result || ticket.status)}`}>
                    {normalizeBetStatus(ticket.result || ticket.status) || "-"}
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
                  const matchName = fx?.homeTeamName && fx?.awayTeamName
                    ? `${fx.homeTeamName} - ${fx.awayTeamName}`
                    : outcomeName;
                  const dateLabel = fmtDate(fx?.startsAt || ticket.placedAt);
                  const scoreLabel = fx?.status === "finished" && fx?.homeScore !== undefined && fx?.awayScore !== undefined
                    ? `${fx.homeScore}-${fx.awayScore}`
                    : "-";
                  const selStatus = sel.result || "pending";
                  const selReason = sel.settlementReason || sel.settlement_reason || null;
                  return (
                    <div key={sel.id} className="grid grid-cols-1 md:grid-cols-[2.2fr_1.5fr_1fr_0.8fr_0.8fr] px-3 py-3 border-b border-white/10 text-white">
                      <div>
                        <div className="text-white/60 text-sm">{dateLabel}</div>
                        <div className="font-semibold">{matchName}</div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black border rounded uppercase ${statusBadgeClass(selStatus)}`}>
                            {normalizeBetStatus(selStatus) || "-"}
                          </span>
                          {normalizeBetStatus(selStatus) === "manual_review" ? (
                            <span className="ml-2 text-[10px] text-orange-200/80 uppercase font-black">
                              Manual review{selReason ? `: ${String(selReason)}` : ""}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 text-sm">Competition Name</div>
                        <div className="font-semibold">{fx?.leagueName || "-"}</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-sm">Match Result:</div>
                        <div className="font-semibold">{outcomeName}</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-sm">Rate</div>
                        <div className="text-[#7CBB3D] font-bold">{amount(sel.oddsAtPlacement).toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-sm">Score</div>
                        <div className="font-semibold">{scoreLabel}</div>
                      </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-3 py-3 bg-[#2a2440]">
                  <div><div className="text-white/60 text-sm">AMOUNT</div><div className="text-[#7CBB3D] font-bold">{fmtMoney(ticket.stake)}</div></div>
                  <div><div className="text-white/60 text-sm">TOTAL ODDS</div><div className="text-white font-bold">{(amount(ticket.potentialPayout) / Math.max(amount(ticket.stake), 1)).toFixed(2)}</div></div>
                  <div><div className="text-white/60 text-sm">{ticket.status === "settled" ? "PAYOUT" : "POSSIBLE WINNING"}</div><div className="text-white font-bold">{fmtMoney(ticket.status === "settled" ? ticket.payout : ticket.potentialPayout)}</div></div>
                  <div><div className="text-white/60 text-sm">POSSIBLE TAX</div><div className="text-white font-bold">{fmtMoney(amount(ticket.potentialPayout) * 0.15)}</div></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
