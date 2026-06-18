import { useLocation } from "react-router-dom";
import { navItems } from "./nav";
import { useAuditStore } from "@/store/useAuditStore";
import { Search, Bell, ChevronDown, CalendarDays, Store as StoreIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function TopBar() {
  const location = useLocation();
  const current = navItems.find((n) => n.path === location.pathname);
  const stores = useAuditStore((s) => s.stores);
  const currentStoreId = useAuditStore((s) => s.currentStoreId);
  const setCurrentStore = useAuditStore((s) => s.setCurrentStore);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const store = stores.find((s) => s.id === currentStoreId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-14 shrink-0 bg-surface/80 backdrop-blur border-b border-line flex items-center gap-4 px-5">
      <div className="flex items-center gap-2.5">
        {current && <current.icon className="h-4 w-4 text-brand-500" strokeWidth={2.2} />}
        <h1 className="font-display text-base font-bold text-ink-900">{current?.label}</h1>
        <span className="font-mono text-[10px] text-ink-400 uppercase tracking-wider border-l border-line pl-2.5">
          {current?.sublabel}
        </span>
      </div>

      <div className="relative ml-2" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-line bg-surfaceAlt hover:bg-surfaceSunken transition-colors"
        >
          <StoreIcon className="h-3.5 w-3.5 text-brand-500" strokeWidth={2} />
          <span className="text-sm font-semibold text-ink-800">{store?.name}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-ink-400 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1.5 w-64 panel shadow-float z-50 animate-fade-in overflow-hidden">
            <div className="label-mono px-3 py-2 border-b border-line">切换门店</div>
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentStore(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-surfaceSunken transition-colors",
                  s.id === currentStoreId && "bg-brand-50"
                )}
              >
                <div>
                  <div className="text-sm font-semibold text-ink-800">{s.name}</div>
                  <div className="font-mono text-[10px] text-ink-400">{s.code} · {s.region}</div>
                </div>
                {s.id === currentStoreId && <span className="h-2 w-2 rounded-full bg-brand-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            placeholder="搜索批次号 / 任务 / 门店…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line bg-surfaceAlt">
          <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
          <span className="font-mono text-xs font-medium text-ink-600 tabular-nums">2026-06-18 周四</span>
        </div>
        <button className="relative h-9 w-9 rounded-md border border-line bg-surfaceAlt hover:bg-surfaceSunken flex items-center justify-center transition-colors">
          <Bell className="h-4 w-4 text-ink-600" strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-risk" />
        </button>
      </div>
    </header>
  );
}
