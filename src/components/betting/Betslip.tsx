import { Trash2, Smartphone, Info, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { BetSelection } from "../../types";
import {
  useBulkUpsertSlipSelections,
  useCreateUserSlip,
  usePlaceSlip,
} from "../../modules/betslips/hooks";
import { useQueryClient } from "@tanstack/react-query";
import TicketPreview from "./TicketPreview";
import OfflineTicketModal from "./OfflineTicketModal";
import { useCreateOfflineTicket } from "../../modules/offlineTickets/hooks";
interface BetslipProps {
  selectedBets: BetSelection[];
  onRemoveBet: (matchId: string, market: string, selection: string) => void;
  onClear: () => void;
  activeSlot: 1 | 2 | 3;
  onChangeSlot: (slot: 1 | 2 | 3) => void;
  slotCounts?: Record<1 | 2 | 3, number>;
  stake: number;
  onStakeChange: (stake: number) => void;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  authLoading?: boolean;
  onRequireAuth?: () => void;
  notice?: string | null;
}
export default function Betslip({
  selectedBets,
  onRemoveBet,
  onClear,
  activeSlot,
  onChangeSlot,
  slotCounts,
  stake,
  onStakeChange,
  isOpen,
  onClose,
  isAuthenticated = false,
  authLoading = false,
  onRequireAuth,
  notice = null,
}: BetslipProps) {
  const totalOdds = selectedBets.reduce((acc, current) => acc * current.odd, 1);
  const incomeTaxRate = 0.15;
  const potentialPayout = totalOdds * stake;
  const incomeTax = potentialPayout * incomeTaxRate;
  const netWin = potentialPayout - incomeTax;
  const [busy, setBusy] = useState(false);
  const bulkUpsert = useBulkUpsertSlipSelections();
  const createSlip = useCreateUserSlip();
  const placeSlip = usePlaceSlip();
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [acceptedOpen, setAcceptedOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [offlineCode, setOfflineCode] = useState<string>("");
  const [offlineExpiresAt, setOfflineExpiresAt] = useState<string | null>(null);
  const createOffline = useCreateOfflineTicket();
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  useEffect(() => {
    if (!notice) return;
    setLocalNotice(notice);
    const t = setTimeout(() => setLocalNotice(null), 2000);
    return () => clearTimeout(t);
  }, [notice]);

  const selectionSignature = useMemo(
    () =>
      selectedBets
        .map(
          (b) => `${b.outcomeId || ""}:${b.acceptedOddsVersion || ""}:${b.odd}`,
        )
        .join("|"),
    [selectedBets],
  );

  useEffect(() => {
    // Clear inline errors when user changes selections (add/remove/change).
    setInlineError(null);
  }, [selectionSignature]);

  useEffect(() => {
    // Clear errors when betslip closes.
    if (!isOpen) {
      setInlineError(null);
      setBalanceModalOpen(false);
      setMobileDetailsOpen(false);
    }
  }, [isOpen]);

  const extractError = (e: any) => {
    const codeRaw =
      e?.response?.data?.error?.code ?? e?.response?.data?.code ?? null;
    const messageRaw =
      e?.response?.data?.error?.message ??
      e?.response?.data?.message ??
      e?.message ??
      null;
    const code = codeRaw ? String(codeRaw) : null;
    const message = messageRaw ? String(messageRaw) : null;
    const status = Number(e?.response?.status || 0) || null;
    return { code, message, status };
  };

  const mapBetslipError = (
    e: any,
  ): { kind: "balance" | "inline"; message: string; code?: string | null } => {
    const { code, message } = extractError(e);
    const codeU = String(code || "").toUpperCase();
    const msgL = String(message || "").toLowerCase();

    const balance =
      codeU === "INSUFFICIENT_BALANCE" ||
      msgL.includes("insufficient user balance") ||
      msgL.includes("insufficient balance") ||
      msgL.includes("not enough balance");
    if (balance) {
      return {
        kind: "balance",
        message: "Insufficient balance. Please deposit to place this bet.",
        code,
      };
    }

    if (codeU === "ODDS_EXPIRED")
      return { kind: "inline", message: "Odds expired. Please refresh.", code };
    if (codeU === "ODDS_CHANGED")
      return {
        kind: "inline",
        message: "Odds changed. Please accept the new odds.",
        code,
      };
    if (codeU === "MARKET_CLOSED")
      return { kind: "inline", message: "This market is closed.", code };
    if (codeU === "INVALID_SELECTION")
      return {
        kind: "inline",
        message: "This selection is no longer available.",
        code,
      };

    // Heuristic mapping if backend didn't provide codes consistently.
    if (msgL.includes("odds expired"))
      return { kind: "inline", message: "Odds expired. Please refresh.", code };
    if (msgL.includes("odds changed"))
      return {
        kind: "inline",
        message: "Odds changed. Please accept the new odds.",
        code,
      };
    if (msgL.includes("market") && msgL.includes("closed"))
      return { kind: "inline", message: "This market is closed.", code };
    if (
      msgL.includes("selection") &&
      (msgL.includes("inactive") ||
        msgL.includes("no longer active") ||
        msgL.includes("not found"))
    ) {
      return {
        kind: "inline",
        message: "This selection is no longer available.",
        code,
      };
    }

    return {
      kind: "inline",
      message: "Could not place bet. Please try again.",
      code,
    };
  };

  const handlePlaceOnline = async () => {
    if (!selectedBets.length) return;
    if (authLoading) return;
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    // Allow placing attempt even if a selection is missing outcomeId (e.g. detail-only rows).
    // Backend will validate and respond with a specific error if placement isn't possible.
    setBusy(true);
    try {
      const slip = await createSlip.mutateAsync({ slotNumber: activeSlot });
      const slipId = slip?.id;
      if (!slipId) throw new Error("Failed to create slip");

      await bulkUpsert.mutateAsync({
        slipId,
        slotNumber: activeSlot,
        selections: selectedBets.map((b) => ({
          // Prefer DB outcomeId when present; otherwise fall back to provider selectionKey
          // (backend will resolve it to an Outcome if it exists in DB).
          outcomeId: b.outcomeId || undefined,
          selectionKey: b.outcomeId ? undefined : (b.selectionKey || undefined),
          acceptedOdds: b.odd,
          acceptedOddsVersion: b.acceptedOddsVersion || 1,
        })),
      });
      await placeSlip.mutateAsync({ slipId, stake });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({ queryKey: ["user-betslips"] });
      setAcceptedOpen(true);
      setPreviewOpen(false);
      setInlineError(null);
      onClear();
    } catch (e: any) {
      const status = Number(e?.response?.status || 0);
      if (status === 401 || status === 403) {
        onRequireAuth?.();
        return;
      }
      const mapped = mapBetslipError(e);
      // eslint-disable-next-line no-console
      console.debug("[betslip][error]", {
        code: mapped.code || null,
        raw: extractError(e),
      });
      if (mapped.kind === "balance") {
        setInlineError(null);
        setBalanceModalOpen(true);
        return;
      }
      setInlineError(mapped.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePrintPreview = async () => {
    if (!selectedBets.length) return;
    // Allow print-preview attempt even if a selection is missing outcomeId; backend will validate.
    try {
      const res = await createOffline.mutateAsync({
        stake,
        selections: selectedBets.map((b) => ({
          outcomeId: b.outcomeId || "",
          acceptedOdds: b.odd,
          acceptedOddsVersion: b.acceptedOddsVersion || 1,
        })),
      });
      setOfflineCode(res.shortCode);
      setOfflineExpiresAt(res.expiresAt || null);
      setOfflineOpen(true);
      setInlineError(null);
    } catch (e: any) {
      const mapped = mapBetslipError(e);
      // eslint-disable-next-line no-console
      console.debug("[betslip][error]", {
        code: mapped.code || null,
        raw: extractError(e),
      });
      if (mapped.kind === "balance") {
        setInlineError(null);
        setBalanceModalOpen(true);
        return;
      }
      setInlineError(mapped.message);
    }
  };

  return (
    <>
      {/* Insufficient balance modal */}
      <AnimatePresence>
        {balanceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setBalanceModalOpen(false)}
          >
            <motion.div
              initial={{ y: 10, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 22, stiffness: 220 }}
              className="w-full max-w-sm bg-[#0a0a0a] border border-red-500/30 rounded-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-black uppercase italic tracking-widest text-red-400">
                  Error
                </div>
                <button
                  type="button"
                  onClick={() => setBalanceModalOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
              <div className="mt-3 text-sm font-bold text-red-400">
                Insufficient balance. Please deposit to place this bet.
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setBalanceModalOpen(false)}
                  className="bg-red-500 text-black px-4 py-2 rounded-lg text-xs font-black uppercase italic"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          y: isOpen || window.innerWidth >= 1024 ? 0 : "100%",
          opacity: 1,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 lg:sticky lg:top-0 lg:translate-y-0 w-full lg:w-[380px] bg-[#0a0a0a] flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 z-[150] lg:z-10 h-[90vh] lg:h-full rounded-t-3xl lg:rounded-none overflow-hidden shadow-2xl lg:shadow-none min-h-0"
      >
        {/* Mobile Pull Handle */}
        <div className="lg:hidden flex justify-center py-3" onClick={onClose}>
          <div className="w-12 h-1 bg-white/10 rounded-full" />
        </div>

        {/* Header Tabs */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-white/5 bg-[#0d0d0d]">
          <div className="flex gap-2 p-1 bg-white/[0.03] rounded-full border border-white/5">
            {([1, 2, 3] as const).map((slot) => {
              const isActive = activeSlot === slot;
              const count = slotCounts?.[slot] ?? 0;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onChangeSlot(slot)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-brand-primary text-black"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  <span>SLIP {slot}</span>
                  {count > 0 && (
                    <span className="text-[9px] font-black">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClear}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-white/5"
              title="Clear all bets"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-white hover:text-brand-primary transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Control Row */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/20">
          <button className="flex items-center gap-2 group">
            <div className="w-8 h-4 bg-white/10 rounded-full relative transition-colors group-hover:bg-white/20">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-brand-primary rounded-full shadow-sm" />
            </div>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight group-hover:text-white transition-colors">
              Copy ticket
            </span>
          </button>
          <button className="flex items-center gap-2 group">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tight group-hover:text-white transition-colors">
              Sort by Time
            </span>
            <div className="w-8 h-4 bg-white/10 rounded-full relative transition-colors group-hover:bg-white/20">
              <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white/40 rounded-full shadow-sm" />
            </div>
          </button>
        </div>

        {/* Inline error */}
        {inlineError ? (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
            <div className="text-[11px] font-bold text-red-400 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-red-400" />
              {inlineError}
            </div>
          </div>
        ) : null}
        {localNotice ? (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
              {localNotice}
            </div>
          </div>
        ) : null}

        {/* Bets List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar pb-10">
          <AnimatePresence initial={false}>
            {selectedBets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
                <Smartphone className="w-12 h-12 mb-4 text-white" strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ticket Empty</p>
              </div>
            ) : (
              selectedBets.map((bet) => (
                <motion.div
                  key={`${bet.matchId}-${bet.market}-${bet.selection}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-sm p-3 relative group border-l-4 border-l-brand-primary shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-black font-black leading-tight uppercase italic truncate mb-1">
                        {bet.matchName}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                          {bet.market}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className="text-[10px] font-black text-black uppercase italic">
                          {bet.selection}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() =>
                          onRemoveBet(bet.matchId, bet.market, bet.selection)
                        }
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="bg-black text-white px-2 py-0.5 rounded-sm text-[11px] font-black italic">
                        {bet.odd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer / Stake Section */}
        <AnimatePresence>
          {selectedBets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-4 pb-12 lg:pb-6 bg-[#0d0d0d] border-t border-white/5 space-y-4 shadow-2xl relative z-10"
            >
              {/* Summary Row */}
              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                    Total Odds
                  </span>
                  <span className="text-2xl font-black text-brand-primary italic leading-none tracking-tighter">
                    {totalOdds.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                    Selections
                  </span>
                  <span className="text-2xl font-black text-white italic leading-none tracking-tighter tabular-nums">
                    {selectedBets.length}
                  </span>
                </div>
              </div>

              {/* Stake Controller */}
              <div className="bg-white/5 rounded-sm p-2 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">Stake (ETB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStakeChange(Math.max(1, stake - 10))}
                    className="w-10 h-10 flex items-center justify-center bg-black/40 rounded-sm text-white hover:bg-black/60 transition-all border border-white/5"
                  >
                    <div className="w-3 h-0.5 bg-white rounded-full" />
                  </button>
                  <div className="flex-1 bg-black/40 rounded-sm border border-white/5 flex items-center h-10">
                    <input
                      type="number"
                      value={stake}
                      onChange={(e) => onStakeChange(Number(e.target.value))}
                      className="w-full bg-transparent text-center focus:outline-none text-white font-black text-xl italic tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    onClick={() => onStakeChange(stake + 10)}
                    className="w-10 h-10 flex items-center justify-center bg-black/40 rounded-sm text-white hover:bg-black/60 transition-all border border-white/5 text-xl font-black italic"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className={`space-y-1.5 px-1 ${mobileDetailsOpen ? "" : "hidden lg:block"}`}>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-400 uppercase tracking-tight">Potential Payout</span>
                  <span className="text-white">{(totalOdds * stake).toFixed(2)} ETB</span>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 uppercase tracking-tight">Income Tax</span>
                    <span className="text-[8px] bg-red-500/10 text-red-400 px-1 py-0.5 rounded border border-red-500/10">15%</span>
                  </div>
                  <span className="text-red-400/80">-{incomeTax.toFixed(2)} ETB</span>
                </div>

                <div className="h-px bg-white/5 my-1" />

                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Net Win</span>
                  <div className="flex items-baseline gap-1 leading-none">
                    <span className="text-3xl font-black text-brand-primary italic tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(193,223,31,0.3)]">
                      {netWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-black text-brand-primary italic uppercase">ETB</span>
                  </div>
                </div>
              </div>

              {/* Mobile details toggle */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileDetailsOpen((v) => !v)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-sm py-1.5 text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white"
                >
                  {mobileDetailsOpen ? "Hide Details" : "Show Details"}
                </button>
              </div>

              {/* Buttons */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={handlePlaceOnline}
                    disabled={busy || (!isAuthenticated && authLoading)}
                    className="w-full bg-brand-primary text-black font-black py-3 rounded-sm text-[12px] uppercase tracking-wider hover:bg-brand-primary/90 active:scale-[0.98] transition-all shadow-[0_5px_15px_rgba(193,223,31,0.2)] disabled:opacity-50"
                  >
                    {busy ? "Placing..." : "Place Bet Online"}
                  </button>

                  <button
                    onClick={handlePrintPreview}
                    disabled={busy || createOffline.isPending}
                    className="w-full bg-white/5 text-white font-bold py-2 rounded-sm text-[10px] uppercase tracking-wide hover:bg-white/10 active:scale-[0.98] transition-all border border-white/5 disabled:opacity-50"
                  >
                    {createOffline.isPending
                      ? "Preparing..."
                      : "Book Offline Ticket"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      <TicketPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        selectedBets={selectedBets}
        stake={stake}
        onPlaceBet={handlePlaceOnline}
        placing={busy}
      />
      <OfflineTicketModal
        open={offlineOpen}
        onClose={() => setOfflineOpen(false)}
        code={offlineCode}
        expiresAt={offlineExpiresAt}
      />

      {/* Success Modal */}
      <AnimatePresence>
        {acceptedOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setAcceptedOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-[#111111] border border-brand-primary/20 p-10 rounded-[3rem] text-center max-w-sm w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-black">
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={4}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </motion.div>
              </div>
              <h3 className="text-2xl font-black text-white uppercase italic mb-2">
                Bet Accepted!
              </h3>
              <p className="text-gray-400 text-sm mb-8">
                Your bet has been placed successfully. Good luck!
              </p>
              <button
                onClick={() => setAcceptedOpen(false)}
                className="w-full bg-brand-primary text-black font-black py-4 rounded-2xl text-[12px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Back to Games
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
