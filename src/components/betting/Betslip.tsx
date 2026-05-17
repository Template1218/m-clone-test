import { Trash2, Smartphone, Info, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { BetSelection } from '../../types';
import { useBulkUpsertSlipSelections, useCreateUserSlip, usePlaceSlip } from '../../modules/betslips/hooks';
import { useQueryClient } from '@tanstack/react-query';
import TicketPreview from './TicketPreview';
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

  useEffect(() => {
    if (!notice) return;
    setLocalNotice(notice);
    const t = setTimeout(() => setLocalNotice(null), 2000);
    return () => clearTimeout(t);
  }, [notice]);

  const selectionSignature = useMemo(
    () => selectedBets.map((b) => `${b.outcomeId || ""}:${b.acceptedOddsVersion || ""}:${b.odd}`).join("|"),
    [selectedBets]
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
    }
  }, [isOpen]);

  const extractError = (e: any) => {
    const codeRaw = e?.response?.data?.error?.code ?? e?.response?.data?.code ?? null;
    const messageRaw = e?.response?.data?.error?.message ?? e?.response?.data?.message ?? e?.message ?? null;
    const code = codeRaw ? String(codeRaw) : null;
    const message = messageRaw ? String(messageRaw) : null;
    const status = Number(e?.response?.status || 0) || null;
    return { code, message, status };
  };

  const mapBetslipError = (e: any): { kind: "balance" | "inline"; message: string; code?: string | null } => {
    const { code, message } = extractError(e);
    const codeU = String(code || "").toUpperCase();
    const msgL = String(message || "").toLowerCase();

    const balance =
      codeU === "INSUFFICIENT_BALANCE" ||
      msgL.includes("insufficient user balance") ||
      msgL.includes("insufficient balance") ||
      msgL.includes("not enough balance");
    if (balance) {
      return { kind: "balance", message: "Insufficient balance. Please deposit to place this bet.", code };
    }

    // Domain codes
    if (codeU === "ODDS_EXPIRED") return { kind: "inline", message: "Odds expired. Please refresh.", code };
    if (codeU === "ODDS_CHANGED") return { kind: "inline", message: "Odds changed. Please accept the new odds.", code };
    if (codeU === "MARKET_CLOSED") return { kind: "inline", message: "This market is closed.", code };
    if (codeU === "INVALID_SELECTION") return { kind: "inline", message: "This selection is no longer available.", code };

    // Heuristic mapping if backend didn't provide codes consistently.
    if (msgL.includes("odds expired")) return { kind: "inline", message: "Odds expired. Please refresh.", code };
    if (msgL.includes("odds changed")) return { kind: "inline", message: "Odds changed. Please accept the new odds.", code };
    if (msgL.includes("market") && msgL.includes("closed")) return { kind: "inline", message: "This market is closed.", code };
    if (msgL.includes("selection") && (msgL.includes("inactive") || msgL.includes("no longer active") || msgL.includes("not found"))) {
      return { kind: "inline", message: "This selection is no longer available.", code };
    }

    return { kind: "inline", message: "Could not place bet. Please try again.", code };
  };

  const handlePlaceOnline = async () => {
    if (!selectedBets.length) return;
    if (authLoading) return;
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    const missing = selectedBets.find((b) => !b.outcomeId || !b.acceptedOddsVersion);
    if (missing) {
      setInlineError("This selection is no longer available.");
      return;
    }
    setBusy(true);
    try {
      const slip = await createSlip.mutateAsync({ slotNumber: activeSlot });
      const slipId = slip?.id;
      if (!slipId) throw new Error("Failed to create slip");

      await bulkUpsert.mutateAsync({
        slipId,
        slotNumber: activeSlot,
        selections: selectedBets.map((b) => ({
          outcomeId: b.outcomeId!,
          acceptedOdds: b.odd,
          acceptedOddsVersion: b.acceptedOddsVersion!,
        })),
      });
      await placeSlip.mutateAsync({ slipId, stake });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      await queryClient.invalidateQueries({ queryKey: ['user-betslips'] });
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
      console.debug("[betslip][error]", { code: mapped.code || null, raw: extractError(e) });
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
    const missing = selectedBets.find((b) => !b.outcomeId || !b.acceptedOddsVersion);
    if (missing) {
      setInlineError("This selection is no longer available.");
      return;
    }
    try {
      const res = await createOffline.mutateAsync({
        stake,
        selections: selectedBets.map((b) => ({ outcomeId: b.outcomeId!, acceptedOdds: b.odd, acceptedOddsVersion: b.acceptedOddsVersion! })),
      });
      setOfflineCode(res.shortCode);
      setOfflineExpiresAt(res.expiresAt || null);
      setOfflineOpen(true);
      setInlineError(null);
    } catch (e: any) {
      const mapped = mapBetslipError(e);
      // eslint-disable-next-line no-console
      console.debug("[betslip][error]", { code: mapped.code || null, raw: extractError(e) });
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
                <div className="text-xs font-black uppercase italic tracking-widest text-red-400">Error</div>
                <button type="button" onClick={() => setBalanceModalOpen(false)} className="text-white/60 hover:text-white">
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
          y: (isOpen || window.innerWidth >= 1024) ? 0 : '100%',
          opacity: 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 lg:sticky lg:top-0 lg:translate-y-0 w-full lg:w-[380px] bg-[#0a0a0a] flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 z-[150] lg:z-10 h-[90vh] lg:h-full rounded-t-3xl lg:rounded-none overflow-hidden shadow-2xl lg:shadow-none min-h-0"
      >
        {/* Mobile Pull Handle */}
        <div className="lg:hidden flex justify-center py-3" onClick={onClose}>
          <div className="w-12 h-1 bg-white/10 rounded-full" />
        </div>

        {/* Header Tabs */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-white/5 bg-[#111111]">
          <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
            {([1, 2, 3] as const).map((slot) => {
              const isActive = activeSlot === slot;
              const count = slotCounts?.[slot] ?? 0;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onChangeSlot(slot)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-brand-primary text-black shadow-lg shadow-brand-primary/10"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  <span>SLIP {slot}</span>
                  {count > 0 && (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                      isActive ? "bg-black/10 text-black" : "bg-white/5 text-gray-400"
                    }`}>
                      {count}
                    </span>
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
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight group-hover:text-white transition-colors">Copy ticket</span>
        </button>
        <button className="flex items-center gap-2 group">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-tight group-hover:text-white transition-colors">Sort by Time</span>
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
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-2 no-scrollbar">
        <AnimatePresence initial={false}>
          {selectedBets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/20 text-center">Betslip is Empty</p>
            </div>
          ) : (
            selectedBets.map((bet) => (
              <motion.div
                key={`${bet.matchId}-${bet.market}-${bet.selection}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111111] rounded-xl p-3 relative group border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-white font-bold leading-tight truncate mb-1">{bet.matchName}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-gray-500 uppercase">{bet.market}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] font-bold text-brand-primary uppercase">{bet.selection}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => onRemoveBet(bet.matchId, bet.market, bet.selection)}
                      className="text-white/20 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="bg-brand-primary text-black px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-lg shadow-brand-primary/10">
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
            className="p-4 pb-32 lg:pb-6 bg-[#111111] border-t border-white/5 space-y-4 shadow-2xl"
          >
            {/* Summary Row */}
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Total Odds</span>
                <span className="text-lg font-black text-brand-primary leading-none">{totalOdds.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Selections</span>
                <span className="text-lg font-black text-white leading-none">{selectedBets.length}</span>
              </div>
            </div>

            {/* Stake Controller */}
            <div className="bg-black/40 rounded-2xl p-2 border border-white/5">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Stake Amount</span>
                <span className="text-[10px] font-bold text-brand-primary uppercase">ETB</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStakeChange(Math.max(1, stake - 10))}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors active:scale-90"
                >
                  <div className="w-3 h-0.5 bg-white" />
                </button>
                <div className="flex-1">
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => onStakeChange(Number(e.target.value))}
                    className="w-full bg-transparent text-center focus:outline-none text-white font-bold text-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <button
                  onClick={() => onStakeChange(stake + 10)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors active:scale-90 text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-2 px-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium text-gray-400">Potential Payout</span>
                <span className="text-[11px] font-bold text-white">{(totalOdds * stake).toFixed(2)} ETB</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-gray-400">Income Tax</span>
                  <span className="text-[9px] font-bold bg-white/5 px-1.5 py-0.5 rounded text-gray-500">15%</span>
                </div>
                <span className="text-[11px] font-bold text-red-400/80">-{incomeTax.toFixed(2)} ETB</span>
              </div>

              {/* Bonus Info */}
              <div className="flex items-center justify-between bg-brand-primary/5 p-2 rounded-xl border border-brand-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-brand-primary/20 rounded-full flex items-center justify-center">
                    <Info className="w-3 h-3 text-brand-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-tight">Bonus Applied</span>
                </div>
                <span className="text-[10px] font-black text-brand-primary uppercase italic">0%</span>
              </div>

              <div className="pt-2 mt-2 border-t border-white/5">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Net Win</span>
                    <span className="text-xl font-black text-brand-primary leading-tight tabular-nums">
                      {netWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-brand-primary mb-1">ETB</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-center">
                {!isAuthenticated ? (
                  <button
                    onClick={handlePrintPreview}
                    disabled={busy || createOffline.isPending}
                    className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
                  >
                    {createOffline.isPending ? "Preparing..." : "Print Preview"}
                  </button>
                ) : (
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Full Ticket Preview
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handlePlaceOnline}
                  disabled={busy || (!isAuthenticated && authLoading)}
                  className="w-full bg-brand-primary text-black font-black py-4 rounded-2xl text-[13px] uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(193,223,31,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {busy ? "Placing..." : "Place Bet Online"}
                </button>

                <button
                  onClick={handlePrintPreview}
                  disabled={busy || createOffline.isPending}
                  className="w-full bg-white/5 text-white font-bold py-3 rounded-2xl text-[11px] uppercase tracking-wide hover:bg-white/10 active:scale-[0.98] transition-all border border-white/5 disabled:opacity-50"
                >
                  {createOffline.isPending ? "Preparing..." : "Book Offline Ticket"}
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
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </motion.div>
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic mb-2">Bet Accepted!</h3>
            <p className="text-gray-400 text-sm mb-8">Your bet has been placed successfully. Good luck!</p>
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
