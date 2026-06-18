import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "./nav";
import { useAuditStore } from "@/store/useAuditStore";
import { ShieldCheck, ChevronRight } from "lucide-react";

export function Sidebar() {
  const tasks = useAuditStore((s) => s.tasks);
  const issues = useAuditStore((s) => s.issues);

  const counts: Record<string, number> = {
    "/tasks": tasks.filter((t) => t.status === "todo" || t.status === "doing").length,
    "/verify": tasks.filter((t) => t.status === "doing").length,
    "/rectify": issues.filter((i) => i.status !== "closed").length,
    "/stats": 0,
  };

  return (
    <aside className="w-64 shrink-0 bg-ink-900 text-white flex flex-col h-full border-r border-ink-700/60">
      <div className="px-5 pt-5 pb-4 border-b border-ink-700/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-500 flex items-center justify-center shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-display text-[15px] font-bold leading-tight tracking-tight">
              感控稽核台
            </div>
            <div className="font-mono text-[10px] text-ink-300 tracking-wider uppercase">
              IC-Audit Console
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="label-mono text-ink-300/70 px-3 mb-2">稽核窗口</div>
        {navItems.map((item) => {
          const count = counts[item.path];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150",
                  isActive
                    ? "bg-brand-500/15 text-white"
                    : "text-ink-300 hover:bg-ink-800 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-400" />
                  )}
                  <item.icon
                    className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-brand-300" : "text-ink-300 group-hover:text-white")}
                    strokeWidth={2}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-tight">{item.label}</div>
                    <div className="font-mono text-[10px] text-ink-300/60 tracking-wider uppercase">
                      {item.sublabel}
                    </div>
                  </div>
                  {count > 0 && (
                    <span className="font-mono text-[11px] font-semibold tabular-nums bg-ink-700 text-brand-200 px-1.5 py-0.5 rounded-xs">
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <div className="rounded-md bg-ink-800/60 border border-ink-700/50 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-safe animate-pulse" />
            <span className="font-mono text-[10px] text-ink-300 uppercase tracking-wider">
              实时同步
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-300">
            消毒追溯数据已于 <span className="font-mono text-brand-200">09:12</span> 同步，覆盖 5 家门店 / 40 批次。
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-ink-700/60 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center font-display font-bold text-sm">
          桐
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight truncate">督导·吴桐</div>
          <div className="text-[11px] text-ink-300 leading-tight">区域感控督导员</div>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-300" />
      </div>
    </aside>
  );
}
