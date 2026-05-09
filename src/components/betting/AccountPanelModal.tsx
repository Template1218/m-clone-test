import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Search } from "lucide-react";
import { useMyUserBetslips, useTicketDetails } from "../../modules/betslips/hooks";

type PanelTab = "deposit" | "bets" | "ticket";

interface AccountPanelModalProps {
  isOpen: boolean;
  tab: PanelTab;
  onClose: () => void;
  onTabChange: (tab: PanelTab) => void;
  user?: any;
}

function fmtAmount(v: any) {
  return `${Number(v || 0).toFixed(2)} ETB`;
}

function fmtDate(v?: string) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function AccountPanelModal({ isOpen, tab, onClose, onTabChange, user }: AccountPanelModalProps) {
  const [ticketId, setTicketId] = useState("");
  const [submittedTicketId, setSubmittedTicketId] = useState("");
  const { data: slips = [] } = useMyUserBetslips(isOpen && (tab === "bets" || tab === "ticket"));
  const { data: ticket, isError: isTicketError } = useTicketDetails(submittedTicketId, isOpen && tab === "ticket" && !!submittedTicketId);

  const historyRows = useMemo(() => {
    return slips.map((slip: any) => {
      const stake = Number(slip.stake || 0);
      const payout = Number(slip.potentialPayout || 0);
      const odd = stake > 0 ? payout / stake : 0;
      return {
        id: slip.id,
        date: fmtDate(slip.placedAt),
        type: "MULTI",
        amount: stake,
        odd,
        payout,
        status: slip.status,
      };
    });
  }, [slips]);

  const ticketSelections = ticket?.BetSelections || [];
  const ticketStake = Number(ticket?.stake || 0);
  const ticketPayout = Number(ticket?.potentialPayout || 0);
  const ticketTax = ticketPayout * 0.15;
  const ticketOdd = ticketStake > 0 ? ticketPayout / ticketStake : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            className="relative z-10 w-full max-w-6xl bg-[#1f1a2d] border border-white/10 rounded-md overflow-hidden"
          >
            <div className="flex items-center justify-between bg-[#4d7a26] px-5 py-3">
              <div className="flex items-center gap-3">
                {[
                  { key: "deposit", label: "DEPOSIT" },
                  { key: "bets", label: "MY BETS" },
                  { key: "ticket", label: "CHECK TICKET" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => onTabChange(item.key as PanelTab)}
                    className={`text-sm font-black px-3 py-1.5 rounded-sm ${tab === item.key ? "bg-black/30 text-white" : "text-white/80 hover:text-white"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button onClick={onClose} className="text-white hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 md:p-5">
              {tab === "deposit" && (
                <div className="bg-[#221d31] border border-white/10 rounded-sm p-5 text-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-white/60">User ID:</span> <span className="font-semibold">{user?.id || "-"}</span></div>
                    <div><span className="text-white/60">Phone:</span> <span className="font-semibold">{user?.phoneNumber || "-"}</span></div>
                    <div><span className="text-white/60">Name:</span> <span className="font-semibold">{user?.displayName || "-"}</span></div>
                    <div><span className="text-white/60">Role:</span> <span className="font-semibold">{user?.Role?.name || "user"}</span></div>
                    <div><span className="text-white/60">Balance:</span> <span className="font-semibold text-[#7CBB3D]">{fmtAmount(user?.balance)}</span></div>
                    <div><span className="text-white/60">Currency:</span> <span className="font-semibold">{user?.currency || "ETB"}</span></div>
                  </div>
                </div>
              )}

              {tab === "bets" && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-4">
                    <div className="border border-white/20 px-3 py-2 text-sm text-white/90">24 hours</div>
                    <div className="border border-white/20 px-3 py-2 text-sm text-white/90">Sports</div>
                    <button className="bg-red-600 text-white px-4 py-2 text-sm font-bold">CLEAR HISTORY</button>
                  </div>
                  <div className="border border-white/10">
                    <div className="grid grid-cols-6 bg-[#262038] text-white/70 text-sm px-3 py-2">
                      <div>Date</div><div>Type</div><div>Amount</div><div>Odd</div><div>Payout</div><div>Status</div>
                    </div>
                    {historyRows.length === 0 ? (
                      <div className="px-3 py-6 text-white/60 text-sm">No bets yet</div>
                    ) : (
                      historyRows.map((row) => (
                        <div key={row.id} className="grid grid-cols-6 px-3 py-3 border-t border-white/10 text-sm">
                          <div className="text-white">{row.date}</div>
                          <div className="text-white font-bold">{row.type}</div>
                          <div className="text-white">{row.amount.toFixed(2)}</div>
                          <div className="text-[#7CBB3D] font-bold">x {row.odd.toFixed(2)}</div>
                          <div className="text-white">{row.payout.toFixed(2)}</div>
                          <div className="text-white uppercase">{row.status}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {tab === "ticket" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto] gap-2">
                    <div className="border border-white/20 bg-[#1f1a2d] px-3 py-2">
                      <input
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        placeholder="Enter ticket id"
                        className="w-full bg-transparent text-white outline-none"
                      />
                    </div>
                    <button onClick={() => setSubmittedTicketId(ticketId.trim())} className="bg-[#7CBB3D] text-white px-5 py-2 font-black text-sm">CHECK</button>
                    <button className="hidden md:block bg-[#7CBB3D] text-white px-5 py-2 font-black text-sm">COPY BET</button>
                  </div>

                  {isTicketError && <div className="text-red-300 text-sm">Ticket not found.</div>}
                  {!ticket && !isTicketError && <div className="text-white/70 text-sm">Enter your placed ticket id to view details.</div>}

                  {ticket && (
                    <div className="border border-white/10">
                      {ticketSelections.map((sel: any) => (
                        <div key={sel.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1fr_1fr_1fr] gap-2 px-3 py-3 border-b border-white/10 text-sm">
                          <div>
                            <div className="text-white font-semibold">{sel.snapshot?.outcome?.name || sel.Outcome?.name || "-"}</div>
                            <div className="text-white/70">{sel.snapshot?.market?.name || sel.Outcome?.Market?.name || "-"}</div>
                          </div>
                          <div className="text-white/80">{ticket?.User?.displayName || user?.displayName || "-"}</div>
                          <div className="text-white">1</div>
                          <div className="text-[#7CBB3D] font-bold">{Number(sel.oddsAtPlacement || 0).toFixed(3)}</div>
                          <div className="text-white/70">{fmtDate(ticket?.placedAt)}</div>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-3 py-3 text-sm bg-[#251f36]">
                        <div><div className="text-white/60">AMOUNT</div><div className="text-[#7CBB3D] font-bold">{fmtAmount(ticketStake)}</div></div>
                        <div><div className="text-white/60">TOTAL ODDS</div><div className="text-white font-bold">{ticketOdd.toFixed(2)}</div></div>
                        <div><div className="text-white/60">POSSIBLE WINNING</div><div className="text-white font-bold">{fmtAmount(ticketPayout)}</div></div>
                        <div><div className="text-white/60">POSSIBLE TAX</div><div className="text-white font-bold">{fmtAmount(ticketTax)}</div></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

