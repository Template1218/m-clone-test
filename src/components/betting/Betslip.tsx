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
        className="fixed inset-x-0 bottom-0 lg:sticky lg:top-0 lg:translate-y-0 w-full lg:w-[380px] bg-[#0a0a0a] flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-brand-border z-[120] lg:z-10 h-[85vh] lg:h-full rounded-t-[2rem] lg:rounded-none overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] lg:shadow-none"
      >
        {/* Mobile Pull Handle */}
        <div className="lg:hidden flex justify-center py-3" onClick={onClose}>
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Header Tabs with Close Button */}
        <div className="flex bg-brand-dark overflow-hidden relative">
          {([1, 2, 3] as const).map((slot) => {
            const label = `BETSLIP ${slot}`;
            const isActive = activeSlot === slot;
            const count = slotCounts?.[slot] ?? null;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChangeSlot(slot)}
                className={`flex-1 py-4 text-[11px] font-black uppercase italic tracking-wider transition-all relative ${
                  isActive ? "bg-brand-yellow text-black" : "text-gray-500 hover:text-white"
                }`}
              >
                <span>{label}</span>
                {typeof count === "number" && count > 0 ? (
                  <span className={`ml-2 text-[10px] font-black ${isActive ? "text-black/80" : "text-white/50"}`}>
                    {count}
                  </span>
                ) : null}
                {isActive ? <div className="absolute top-0 left-0 w-full h-1 bg-black/10" /> : null}
              </button>
            );
          })}
        <button 
          onClick={onClear}
          className="px-4 text-gray-500 hover:text-red-500 transition-colors bg-brand-dark border-r border-white/5"
        >
          <Trash2 className="w-5 h-5 stroke-[2.5]" />
        </button>
        
        {/* Close Button Mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden px-4 text-white hover:text-brand-primary transition-colors bg-brand-dark"
        >
          <X className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Control Row */}
      <div className="p-3 flex items-center justify-between border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-5 bg-[#7CBB3D] rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
          <span className="text-[10px] font-black text-white italic uppercase">Copy ticket</span>
        </div>
        <div className="flex items-center gap-2 group cursor-pointer">
          <span className="text-[10px] font-black text-white/40 italic uppercase">Sort by Time</span>
          <div className="w-10 h-5 bg-[#4B4B4B] rounded-full relative">
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>

      {/* Inline error */}
      {inlineError ? (
        <div className="px-3 py-2 border-b border-white/5 bg-black/30">
          <div className="text-[11px] font-bold text-red-400">{inlineError}</div>
        </div>
      ) : null}
      {localNotice ? (
        <div className="px-3 py-2 border-b border-white/5 bg-black/30">
          <div className="text-[11px] font-bold text-emerald-300">{localNotice}</div>
        </div>
      ) : null}

      {/* Bets List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
        <AnimatePresence initial={false}>
          {selectedBets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <Smartphone className="w-12 h-12 mb-4" />
              <p className="text-xs font-black uppercase italic tracking-widest text-center">Betslip is<br />Empty</p>
            </div>
          ) : (
            selectedBets.map((bet) => (
              <motion.div 
                key={`${bet.matchId}-${bet.market}-${bet.selection}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-brand-surface/20 py-3 relative group flex items-start gap-3 px-1 border-b border-white/5"
              >
                <button 
                  onClick={() => onRemoveBet(bet.matchId, bet.market, bet.selection)}
                  className="text-red-500/80 hover:text-red-500 transition-colors pt-0.5"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-white font-black uppercase italic leading-tight truncate tracking-tight">{bet.matchName}</div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase italic leading-tight tracking-tight mt-0.5">{bet.market} : {bet.selection}</div>
                </div>
                <div className="bg-[#7CBB3D] text-white px-3 py-1 rounded-full text-[11px] font-black min-w-[50px] text-center self-center shadow-lg">
                  {bet.odd.toFixed(2)}
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
            className="p-3 bg-black/40 border-t border-white/5 space-y-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
          >
            {/* Stake Controller */}
            <div className="flex items-center bg-[#7CBB3D] rounded-full overflow-hidden p-0.5 h-9 shadow-[0_0_15px_rgba(124,187,61,0.2)]">
              <button 
                onClick={() => onStakeChange(Math.max(1, stake - 1))}
                className="w-10 h-full flex items-center justify-center text-white hover:bg-black/10 transition-colors"
              >
                <div className="w-4 h-1 bg-white rounded-full" />
              </button>
              <div className="flex-1 h-full bg-black/90 flex items-center justify-center">
                <input 
                  type="number" 
                  value={stake}
                  onChange={(e) => onStakeChange(Number(e.target.value))}
                  className="bg-transparent w-full text-center focus:outline-none text-white font-black text-lg h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button 
                onClick={() => onStakeChange(stake + 1)}
                className="w-10 h-full flex items-center justify-center text-white hover:bg-black/10 transition-colors text-xl font-black pb-0.5"
              >
                +
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 border-t border-white/10 pt-3">
              <div className="flex justify-between items-center text-[10px] font-black text-white italic uppercase opacity-60">
                <span>Total bet amount</span>
                <span className="text-brand-primary">1</span>
              </div>
              <div className="flex justify-between items-center text-[12px] font-black text-white pt-1 italic uppercase underline decoration-brand-primary decoration-2 underline-offset-4">
                <span>Deposit</span>
                <span className="text-brand-primary">{stake.toFixed(2)} ETB</span>
              </div>

              {/* Bonus */}
              <div className="flex items-center justify-between bg-black/60 p-2 rounded-lg border border-white/5 my-2">
                <Info className="w-3 h-3 text-brand-primary" />
                <span className="text-[9px] font-black text-white/60 uppercase italic tracking-wider">Current bonus is 0%</span>
                <X className="w-3 h-3 text-red-500/60 hover:text-red-500 cursor-pointer" />
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-[#86EFAC] uppercase italic relative h-5">
                <span>Income Tax 15%</span>
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bg-brand-primary text-black rounded px-1 py-0.5">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
                <span className="text-white">{incomeTax.toFixed(2)} ETB</span>
              </div>

              <div className="flex justify-between items-center pt-1.5 border-t border-white/10 mt-3">
                <span className="text-[12px] font-black text-white uppercase italic">Net Win/Payout</span>
                <span className="text-brand-primary text-[15px] font-black tabular-nums">{netWin.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-3">
              <div className="flex justify-center gap-4">
                {!isAuthenticated ? (
                  <button
                    onClick={handlePrintPreview}
                    disabled={busy || createOffline.isPending}
                    className="text-white text-[10px] font-black uppercase underline-offset-4 border-b border-brand-primary italic hover:text-brand-primary transition-colors pb-0.5 disabled:opacity-60"
                  >
                    {createOffline.isPending ? "Preparing..." : "Print Preview"}
                  </button>
                ) : (
                  <button onClick={() => setPreviewOpen(true)} className="text-white text-[10px] font-black uppercase underline-offset-4 border-b border-brand-primary italic hover:text-brand-primary transition-colors pb-0.5">
                    Ticket Preview
                  </button>
                )}
              </div>
              {!isAuthenticated ? (
                <div className="flex items-stretch gap-2">
                  <button
                    onClick={handlePrintPreview}
                    disabled={busy || createOffline.isPending}
                    className="flex-1 bg-black/30 text-white font-black py-2.5 rounded-full text-[12px] hover:bg-black/40 active:scale-95 transition-all uppercase italic border border-white/10 disabled:opacity-60"
                  >
                    {createOffline.isPending ? "Preparing..." : "Print"}
                  </button>
                  <button
                    onClick={handlePlaceOnline}
                    disabled={busy || authLoading}
                    className="flex-[1.4] bg-brand-yellow text-black font-black py-2.5 rounded-full text-[12px] hover:scale-[1.01] active:scale-95 transition-all uppercase italic shadow-[0_5px_15px_rgba(250,204,21,0.1)] disabled:opacity-60"
                  >
                    Place Bet Online
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePlaceOnline}
                  disabled={busy}
                  className="w-full bg-brand-yellow text-black font-black py-2.5 rounded-full text-[12px] hover:scale-[1.01] active:scale-95 transition-all uppercase italic shadow-[0_5px_15px_rgba(250,204,21,0.1)] disabled:opacity-60"
                >
                  Place Bet Online
                </button>
              )}
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
    <AnimatePresence>
      {acceptedOpen && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80" onClick={() => setAcceptedOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 bg-white w-full max-w-3xl min-h-[320px] flex items-center justify-center">
            <button onClick={() => setAcceptedOpen(false)} className="absolute right-4 top-4 text-black"><X className="w-8 h-8" /></button>
            <div className="text-black text-4xl font-medium tracking-wide">BET ACCEPTED</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
