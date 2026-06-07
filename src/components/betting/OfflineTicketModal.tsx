import { Copy, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

export default function OfflineTicketModal(props: { open: boolean; onClose: () => void; code: string; expiresAt?: string | null }) {
  const code = props.code || "";
  const expires = props.expiresAt ? new Date(props.expiresAt) : null;
  const [copyHint, setCopyHint] = useState<string>("");

  useEffect(() => {
    if (!props.open) setCopyHint("");
  }, [props.open]);

  return (
    <AnimatePresence>
      {props.open && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-sm bg-white shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-8 overflow-hidden"
            style={{
              clipPath: "polygon(0% 2%, 2.5% 0%, 5% 2%, 7.5% 0%, 10% 2%, 12.5% 0%, 15% 2%, 17.5% 0%, 20% 2%, 22.5% 0%, 25% 2%, 27.5% 0%, 30% 2%, 32.5% 0%, 35% 2%, 37.5% 0%, 40% 2%, 42.5% 0%, 45% 2%, 47.5% 0%, 50% 2%, 52.5% 0%, 55% 2%, 57.5% 0%, 60% 2%, 62.5% 0%, 65% 2%, 67.5% 0%, 70% 2%, 72.5% 0%, 75% 2%, 77.5% 0%, 80% 2%, 82.5% 0%, 85% 2%, 87.5% 0%, 90% 2%, 92.5% 0%, 95% 2%, 97.5% 0%, 100% 2%, 100% 98%, 97.5% 100%, 95% 98%, 92.5% 100%, 90% 98%, 87.5% 100%, 85% 98%, 82.5% 100%, 80% 98%, 77.5% 100%, 75% 98%, 72.5% 100%, 70% 98%, 67.5% 100%, 65% 98%, 62.5% 100%, 60% 98%, 57.5% 100%, 55% 98%, 52.5% 100%, 50% 98%, 47.5% 100%, 45% 98%, 42.5% 100%, 40% 98%, 37.5% 100%, 35% 98%, 32.5% 100%, 30% 98%, 27.5% 100%, 25% 98%, 22.5% 100%, 20% 98%, 17.5% 100%, 15% 98%, 12.5% 100%, 10% 98%, 7.5% 100%, 5% 98%, 2.5% 100%, 0% 98%)"
            }}
          >
            <button onClick={props.onClose} className="absolute right-4 top-4 text-black/50 hover:text-black transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              <img src="/brand/king5bet-logo-black.png" alt="KING5bet" className="h-12 w-auto max-w-[220px] object-contain" />
              
              <div className="mt-6 space-y-1">
                <div className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Ticket Voucher</div>
                <div className="text-black font-black text-lg uppercase italic tracking-tight">Fast Bet Code</div>
              </div>

              <div className="mt-8 relative group">
                <div className="absolute inset-0 bg-brand-primary/5 blur-xl group-hover:bg-brand-primary/10 transition-all" />
                <div className="relative flex items-center gap-4 bg-gray-50 border-2 border-dashed border-gray-200 px-6 py-4 rounded-xl">
                  <div className="text-black font-black text-4xl tracking-tighter tabular-nums">{code}</div>
                  <div className="w-px h-10 bg-gray-200" />
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(code);
                        setCopyHint("Copied!");
                        window.setTimeout(() => setCopyHint(""), 1200);
                      } catch {
                        setCopyHint("Copy failed");
                        window.setTimeout(() => setCopyHint(""), 1200);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-brand-primary transition-colors hover:scale-110 active:scale-95"
                    aria-label="Copy code"
                  >
                    <Copy className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="h-4 mt-2 text-[10px] font-black uppercase tracking-widest text-brand-primary">
                {copyHint}
              </div>

              <div className="mt-8 pt-8 border-t border-dashed border-gray-200 w-full space-y-4">
                <div className="text-gray-600 text-[11px] leading-relaxed font-medium px-4">
                  This is a temporary ticket. Give this code to a cashier to place it in any <span className="font-bold text-black">KING5bet</span> shop.
                </div>
                {expires ? (
                  <div className="bg-gray-100 py-2 rounded-lg text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                    Valid until {expires.toLocaleString()}
                  </div>
                ) : null}
              </div>
              
              <div className="mt-6 flex justify-center opacity-10">
                <div className="flex gap-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="w-1 h-3 bg-black rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
