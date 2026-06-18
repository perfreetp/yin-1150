import { useAuditStore } from "@/store/useAuditStore";
import { storeRanking } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

export function StoreRanking() {
  const stores = useAuditStore((s) => s.stores);
  const issues = useAuditStore((s) => s.issues);
  const ranking = storeRanking(stores, issues);

  const rankBadge = (idx: number) => {
    if (idx === 0) return "bg-brand-500 text-white";
    if (idx === 1) return "bg-brand-100 text-brand-600";
    if (idx === 2) return "bg-ember-50 text-ember-600";
    return "bg-surfaceSunken text-ink-400";
  };

  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-ember-500" />
          <h3 className="font-display text-sm font-bold text-ink-900">门店排名榜</h3>
        </div>
        <span className="label-mono">按合规率排序</span>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-2">
          {ranking.map((stat, idx) => (
            <div
              key={stat.store.id}
              className="p-3 rounded-md border border-line bg-surfaceAlt hover:bg-surface transition-colors animate-fade-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={cn("h-7 w-7 rounded-md flex items-center justify-center font-display font-bold text-sm shrink-0", rankBadge(idx))}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-800 truncate">{stat.store.name.replace("雅悦口腔·", "")}</div>
                  <div className="font-mono text-[10px] text-ink-400">{stat.store.code} · {stat.store.region} · {stat.store.manager}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-brand-600 tabular-nums leading-none">{stat.compliance}%</div>
                  <div className="label-mono">合规率</div>
                </div>
                <TrendIcon trend={stat.trend} />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-surfaceSunken overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", stat.compliance >= 90 ? "bg-safe" : stat.compliance >= 75 ? "bg-brand-500" : "bg-caution")}
                    style={{ width: `${stat.compliance}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-ink-400 tabular-nums w-8 text-right">{stat.compliance}%</span>
              </div>

              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-line-faint text-[11px]">
                <span className="text-ink-400">问题 <span className="font-mono font-semibold text-ink-600">{stat.totalIssues}</span></span>
                <span className="text-ink-300">·</span>
                <span className="text-ink-400">已闭环 <span className="font-mono font-semibold text-safe">{stat.closedIssues}</span></span>
                <span className="text-ink-300">·</span>
                <span className="text-ink-400">完成率 <span className="font-mono font-semibold text-brand-600">{stat.completion}%</span></span>
                {stat.overdue > 0 && (
                  <>
                    <span className="text-ink-300">·</span>
                    <span className="flex items-center gap-0.5 text-risk">
                      <AlertCircle className="h-3 w-3" /> 超期 {stat.overdue}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend: number }) {
  if (trend > 0) return <TrendingUp className="h-4 w-4 text-safe" />;
  if (trend < 0) return <TrendingDown className="h-4 w-4 text-risk" />;
  return <Minus className="h-4 w-4 text-ink-400" />;
}
