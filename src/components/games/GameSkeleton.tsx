import { motion } from 'motion/react';

export function GameCardSkeleton() {
  return (
    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex flex-col relative animate-pulse">
      <div className="flex-1 bg-white/[0.03]" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-2/3 bg-white/[0.05] rounded-full" />
        <div className="h-3 w-1/2 bg-white/[0.03] rounded-full" />
      </div>
    </div>
  );
}

export function ArenaSkeleton() {
  return (
    <div className="mb-10 space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-32 rounded-2xl bg-white/5 border border-white/5" />
        <div className="lg:col-span-4 h-32 rounded-2xl bg-white/5 border border-white/5" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0 w-[240px] h-16 rounded-xl bg-white/[0.03] border border-white/5" />
        ))}
      </div>
    </div>
  );
}
