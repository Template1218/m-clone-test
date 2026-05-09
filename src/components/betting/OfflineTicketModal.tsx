import { Copy, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function OfflineTicketModal(props: { open: boolean; onClose: () => void; code: string; expiresAt?: string | null }) {
  const code = props.code || "";
  const expires = props.expiresAt ? new Date(props.expiresAt) : null;

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
            className="relative z-10 w-full max-w-sm bg-[#1f1a2d] border border-white/10 shadow-2xl p-6 rounded-md"
          >
            <button onClick={props.onClose} className="absolute right-3 top-3 text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="text-brand-primary font-black text-2xl uppercase italic">KINGSbet</div>
              <div className="mt-4 text-white font-black text-sm uppercase tracking-wide">Fast Bet Code</div>

              <div className="mt-3 flex items-center gap-2">
                <div className="text-white font-black text-3xl tracking-wider">{code}</div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(code);
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-white/70 hover:text-white"
                  aria-label="Copy code"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 text-white/80 text-xs leading-relaxed">
                This is a temporary ticket. Give this code to a cashier to place it in any KINGSbet shop.
                {expires ? <div className="mt-2 text-white/60">Valid until {expires.toLocaleString()}</div> : null}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

