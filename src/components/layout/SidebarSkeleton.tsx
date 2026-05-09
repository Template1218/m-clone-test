import { Trophy, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * SidebarSkeleton – mirrors the exact layout of the Sidebar catalog.
 * Shows: Top Leagues section + Sports section with shimmer placeholders.
 */
export default function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Top Leagues Section Skeleton */}
      <div className="bg-brand-surface rounded-[24px] overflow-hidden border border-brand-border/50 shadow-xl">
        <div className="p-4 text-[12px] font-black uppercase tracking-wider flex items-center gap-2.5 bg-white/[0.03] border-b border-brand-border/50 text-gray-300">
          <Trophy className="w-4 h-4 text-brand-primary" />
          TOP LEAGUES
        </div>
        <div className="py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="sidebar-item group !py-2 border-b border-brand-border/10 last:border-0"
            >
              <div className="skeleton w-5 h-5 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="skeleton h-3" style={{ width: `${60 + Math.random() * 30}%` }} />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter by Time Button Skeleton */}
      <div className="skeleton h-[52px] rounded-full" />

      {/* Sports Section Skeleton */}
      <div className="bg-brand-surface rounded-[24px] overflow-hidden border border-brand-border/50 shadow-xl">
        <div className="flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col border-b border-brand-border/10 last:border-0">
              <div className="sidebar-item py-3.5">
                <div className="skeleton w-6 h-6 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-3" style={{ width: `${40 + Math.random() * 35}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="skeleton h-3 w-6" />
                  <ChevronDown className="w-4 h-4 text-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
