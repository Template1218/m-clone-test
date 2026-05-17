import { useState, useRef, useEffect } from "react";
import {
  Search,
  Mail,
  User,
  ChevronDown,
  LogOut,
  History,
  Wallet,
  ArrowUpRight,
  FileText,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  onAuth: (type: "login" | "register") => void;
  onSignOut?: () => void;
  user?: any;
  authLoading?: boolean;
  onOpenDeposit?: () => void;
  onOpenBetsHistory?: () => void;
  onOpenCheckTicket?: () => void;
  onLogoClick?: () => void;
}

export default function Header({
  onAuth,
  onSignOut,
  user,
  authLoading = false,
  onOpenDeposit,
  onOpenBetsHistory,
  onOpenCheckTicket,
  onLogoClick,
}: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { label: "BETS HISTORY", icon: History, action: onOpenBetsHistory },
    { label: "DEPOSIT", icon: Wallet, action: onOpenDeposit },
    { label: "WITHDRAW", icon: ArrowUpRight, action: () => {} },
    { label: "TRANSACTION HISTORY", icon: FileText, action: () => {} },
    { label: "CHECK TICKET", icon: Search, action: onOpenCheckTicket },
    { label: "PROFILE", icon: Settings, action: () => {} },
    { label: "SIGN OUT", icon: LogOut, action: onSignOut, isDanger: true },
  ];

  return (
    <header className="h-[50px] bg-brand-primary flex items-center px-4 sticky top-0 z-[100] shadow-md border-b border-black/5">
      {/* Mobile */}
      <div className="flex items-center justify-between w-full lg:hidden">
        <button type="button" onClick={onLogoClick} className="flex items-center gap-1 cursor-pointer">
          <div className="flex flex-col items-center leading-none">
            <span className="text-lg font-black text-black italic tracking-tighter">king5</span>
            <div className="bg-black text-[#a3e635] px-1 py-0.5 mt-[-1px] rounded-sm transform">
              <span className="text-[8px] font-black italic">bet</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                type="button"
                onClick={onOpenDeposit}
                className="bg-brand-yellow text-black font-black px-3 h-7 rounded-full text-[10px] uppercase italic shadow-md active:scale-95 transition-all"
              >
                Deposit
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`w-7 h-7 rounded-full border border-black/10 flex items-center justify-center bg-black/5 cursor-pointer hover:bg-black/10 transition-all ${
                    isProfileOpen ? "ring-2 ring-black/20" : ""
                  }`}
                  aria-label="Account menu"
                >
                  <User className="w-4 h-4 text-black" />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-[#1e1b21] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden py-1 z-[110]"
                    >
                      {menuItems.map((item, idx) => (
                        <div key={item.label}>
                          <button
                            onClick={() => {
                              item.action?.();
                              setIsProfileOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase italic tracking-wider transition-colors flex items-center justify-between group ${
                              item.isDanger
                                ? "text-red-400 hover:bg-red-500/10"
                                : "text-gray-200 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span>{item.label}</span>
                            <item.icon
                              className={`w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity ${
                                item.isDanger ? "text-red-400" : "text-brand-primary"
                              }`}
                            />
                          </button>
                          {idx < menuItems.length - 1 && <div className="mx-4 border-b border-white/5" />}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : authLoading ? (
            <div className="border border-black/20 text-black/70 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase italic select-none">
              Loading...
            </div>
          ) : (
            <>
              <Search className="w-4 h-4 text-black" />
              <button
                onClick={() => onAuth("login")}
                className="border border-black/20 text-black font-bold text-[10px] px-2.5 py-1 rounded-full uppercase italic"
              >
                Login
              </button>
              <button
                onClick={() => onAuth("register")}
                className="bg-brand-yellow text-black font-bold text-[10px] px-2.5 py-1 rounded-full uppercase italic shadow-md"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-6 flex-1">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => (window.location.href = "/")}>
          <div className="flex flex-col items-center leading-none">
            <span className="text-xl font-black text-black italic tracking-tighter">king5</span>
            <div className="bg-black text-brand-primary px-1.5 py-0.5 mt-[-1px] rounded-sm transform">
              <span className="text-[10px] font-black italic">bet</span>
            </div>
          </div>
        </div>

        {user && (
          <div className="max-w-[240px] flex-1">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-white/95 rounded-full py-1 px-4 pr-10 text-[12px] text-black placeholder:text-gray-400 focus:outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] font-medium"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 pr-4 border-r border-black/10 h-7">
              <div className="relative cursor-pointer hover:scale-110 transition-transform group">
                <div className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center bg-black/5 group-hover:bg-black/10">
                  <Mail className="w-3.5 h-3.5 text-black" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border border-brand-primary flex items-center justify-center">
                  <span className="text-[7px] font-black text-white">1</span>
                </div>
              </div>

              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`w-7 h-7 rounded-full border border-black/10 flex items-center justify-center bg-black/5 cursor-pointer hover:bg-black/10 transition-all ${
                    isProfileOpen ? "ring-2 ring-black/20" : ""
                  }`}
                >
                  <User className="w-4 h-4 text-black" />
                </div>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-[#1e1b21] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden py-1 z-[110]"
                    >
                      {menuItems.map((item, idx) => (
                        <div key={item.label}>
                          <button
                            onClick={() => {
                              item.action?.();
                              setIsProfileOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase italic tracking-wider transition-colors flex items-center justify-between group ${
                              item.isDanger
                                ? "text-red-400 hover:bg-red-500/10"
                                : "text-gray-200 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span>{item.label}</span>
                            <item.icon
                              className={`w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity ${
                                item.isDanger ? "text-red-400" : "text-brand-primary"
                              }`}
                            />
                          </button>
                          {idx < menuItems.length - 1 && <div className="mx-4 border-b border-white/5" />}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                <div className="w-4 h-2.5 bg-white/20 rounded-sm flex items-center justify-center overflow-hidden border border-black/10">
                  <img src="https://flagcdn.com/w20/gb.png" alt="EN" className="w-full h-full object-cover" />
                </div>
                <span className="text-black font-bold text-[11px] uppercase italic">EN</span>
                <ChevronDown className="w-3 h-3 text-black" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right flex flex-col leading-none">
                <span className="text-black font-black text-[13px] italic">
                  {(Number(user?.balance) || 0).toFixed(2)} {user?.currency || "ETB"}
                </span>
                <span className="text-black font-bold text-[9px] uppercase italic opacity-50">
                  ID: {user?.id?.slice(-6).toUpperCase()}
                </span>
              </div>
              <button
                onClick={onOpenDeposit}
                className="bg-brand-yellow text-black font-black px-4 h-8 rounded-full text-[11px] uppercase italic shadow-md hover:scale-105 hover:brightness-110 active:scale-95 transition-all"
              >
                DEPOSIT
              </button>
            </div>
          </div>
        ) : authLoading ? (
          <div className="px-4 py-2 text-black/70 font-bold text-xs uppercase rounded-full italic select-none">
            Loading...
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAuth("login")}
              className="px-4 py-2 text-black font-bold text-xs uppercase hover:bg-black/10 rounded-full transition-all italic"
            >
              Login
            </button>
            <button
              onClick={() => onAuth("register")}
              className="bg-black text-brand-primary px-6 py-2 rounded-full text-xs font-black uppercase italic shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
