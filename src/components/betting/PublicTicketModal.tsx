import { X, RotateCw } from "lucide-react";

interface PublicTicketModalProps {
  isOpen: boolean;
  ticket?: any;
  isLoading?: boolean;
  error?: string;
  onClose: () => void;
  onRefresh: () => void;
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
  return Number.isNaN(d.getTime()) ? String(v) : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function normalizeStatus(v: any) {
  return String(v || "pending").trim().toLowerCase();
}

function selectionData(sel: any) {
  const fx = sel?.snapshot?.fixture || {};
  return {
    league: fx?.leagueName || "Sport",
    match: fx?.homeTeamName && fx?.awayTeamName ? `${fx.homeTeamName} v ${fx.awayTeamName}` : "-",
    market: sel?.snapshot?.market?.name || "-",
    outcome: sel?.snapshot?.outcome?.name || "-",
    odds: amount(sel?.oddsAtPlacement || sel?.snapshot?.outcome?.displayOdds || sel?.snapshot?.outcome?.odds || 1).toFixed(2),
    result: normalizeStatus(sel?.result),
  };
}

export default function PublicTicketModal({ isOpen, ticket, isLoading, error, onClose, onRefresh }: PublicTicketModalProps) {
  if (!isOpen) return null;

  const status = normalizeStatus(ticket?.result || ticket?.status);
  const isWon = status === "won" || status === "win";
  const isLost = status === "lost" || status === "lose";
  const selections = ticket?.BetSelections || [];

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/10 bg-brand-dark shadow-2xl">
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/10">
          <div className="text-white font-black uppercase tracking-widest text-xs">Ticket</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onRefresh} className="p-2 text-white/60 hover:text-brand-primary transition-colors" aria-label="Refresh ticket">
              <RotateCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button type="button" onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors" aria-label="Close ticket">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-48px)] overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="py-24 text-center text-white/50 font-black uppercase text-xs">Loading ticket...</div>
          ) : error ? (
            <div className="py-24 text-center text-rose-300 font-black uppercase text-xs">{error}</div>
          ) : ticket ? (
            <div className={`overflow-hidden rounded-xl ${isWon ? "bg-emerald-600" : isLost ? "bg-rose-600" : "bg-white"}`}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
                <div>
                  <div className={`text-[9px] font-black uppercase tracking-[0.2em] ${isWon || isLost ? "text-white/60" : "text-gray-400"}`}>Ticket Record</div>
                  <div className={`text-lg font-black uppercase italic ${isWon || isLost ? "text-white" : "text-black"}`}>ID: {String(ticket.id || "-").slice(0, 12)}</div>
                  <div className={`text-[10px] font-bold ${isWon || isLost ? "text-white/60" : "text-gray-500"}`}>{fmtDate(ticket.placedAt)}</div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${isWon || isLost ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-700"}`}>
                  {status}
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {selections.length ? selections.map((sel: any, index: number) => {
                  const row = selectionData(sel);
                  const selLost = row.result === "lost" || row.result === "lose";
                  const selWon = row.result === "won" || row.result === "win";
                  return (
                    <div key={sel.id || index} className={`grid grid-cols-[1fr_auto] gap-3 px-5 py-4 border-b border-black/10 ${selLost ? "bg-rose-500 text-white" : selWon ? "bg-emerald-500 text-white" : "bg-white text-black"}`}>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase opacity-60 truncate">{row.league}</div>
                        <div className="text-sm font-black uppercase truncate">{row.match}</div>
                        <div className="text-[11px] font-bold opacity-60 truncate">{row.market}</div>
                        <div className="text-xs font-black italic truncate">{row.outcome}</div>
                      </div>
                      <div className="text-right">
                        <div className="bg-black text-white px-2 py-1 rounded text-xs font-black">{row.odds}</div>
                        <div className="mt-2 text-[8px] font-black uppercase tracking-widest opacity-70">{row.result}</div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="px-5 py-12 text-center text-zinc-500 text-xs font-black uppercase">No selections found</div>
                )}
              </div>

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 p-3 ${isWon || isLost ? "text-white" : "text-black"}`}>
                <div className="p-3 bg-black/5 rounded-lg">
                  <div className="text-[8px] font-black uppercase opacity-60">Stake</div>
                  <div className="font-black">{fmtMoney(ticket.stake)}</div>
                </div>
                <div className="p-3 bg-black/5 rounded-lg">
                  <div className="text-[8px] font-black uppercase opacity-60">Total Odds</div>
                  <div className="font-black">{(amount(ticket.potentialPayout) / Math.max(amount(ticket.stake), 1)).toFixed(2)}</div>
                </div>
                <div className="p-3 bg-black/5 rounded-lg">
                  <div className="text-[8px] font-black uppercase opacity-60">Possible Win</div>
                  <div className="font-black">{fmtMoney(ticket.potentialPayout)}</div>
                </div>
                <div className="p-3 bg-black/5 rounded-lg">
                  <div className="text-[8px] font-black uppercase opacity-60">Payout</div>
                  <div className="font-black">{fmtMoney(ticket.payout)}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
