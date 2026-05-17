import React from "react";
import { Clock } from "lucide-react";

export default function ComingSoon(props: { title?: string }) {
  const title = props.title || "Coming Soon";
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center shadow-2xl">
        <div className="mx-auto w-12 h-12 rounded-full bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center">
          <Clock className="w-6 h-6 text-brand-primary" />
        </div>
        <div className="mt-4 text-white font-black uppercase italic tracking-tight text-xl">
          {title}
        </div>
        <div className="mt-2 text-white/60 text-sm font-semibold">
          This section is under development.
        </div>
      </div>
    </div>
  );
}

