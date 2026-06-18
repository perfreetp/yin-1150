import { useMemo } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { Clock, RotateCcw, Eye, TrendingUp, Award, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Issue } from "@/types";

function calcRectifyDays(issue: Issue): number | null {
  if (!issue.resolvedAt) return null;
  const start = new Date(issue.createdAt).getTime();
  const end = new Date(issue.resolvedAt).getTime();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function countRejections(issue: Issue): number {
  return issue.timeline.filter((n) => n.node === "复核退回").length;
}

export function ReviewEfficiencyPanel() {
  const issues = useAuditStore((s) => s.issues);
  const stores = useAuditStore((s) => s.stores);

  const closedIssues = useMemo(() => issues.filter((i) => i.status === "closed"), [issues]);
  const reviewIssues = useMemo(() => issues.filter((i) => i.status === "review"), [issues]);
  const rectifyingIssues = useMemo(() => issues.filter((i) => i.status === "rectifying"), [issues]);

  const avgRectifyDays = useMemo(() => {
    const days = closedIssues.map(calcRectifyDays).filter((d): d is number => d !== null);
    if (days.length === 0) return 0;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }, [closedIssues]);

  const totalRejections = useMemo(
    () => issues.reduce((sum, i) => sum + countRejections(i), 0),
    [issues]
  );

  const storeEfficiency = useMemo(() => {
    return stores.map((store) => {
      const storeIssues = issues.filter((i) => i.storeId === store.id);
      const storeClosed = storeIssues.filter((i) => i.status === "closed");
      const storeReview = storeIssues.filter((i) => i.status === "review");
      const storeRectifying = storeIssues.filter((i) => i.status === "rectifying");

      const days = storeClosed.map(calcRectifyDays).filter((d): d is number => d !== null);
      const avgDays = days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
      const rejections = storeIssues.reduce((sum, i) => sum + countRejections(i), 0);
      const backlog = storeReview.length + storeRectifying.length;
      const closureRate = storeIssues.length > 0 ? Math.round((storeClosed.length / storeIssues.length) * 100) : 100;

      return {
        store,
        total: storeIssues.length,
        closed: storeClosed.length,
        avgDays,
        rejections,
        backlog,
        closureRate,
      };
    }).sort((a, b) => a.avgDays - b.avgDays || b.closureRate - a.closureRate);
  }, [issues, stores]);

  const fastestStore = storeEfficiency.find((s) => s.closed > 0) || storeEfficiency[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-bold text-ink-900">复核效率看板</h3>
          <span className="label-mono">按门店统计闭环时效</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <EffMiniCard
          icon={TrendingUp}
          label="平均整改用时"
          value={`${avgRectifyDays}`}
          unit="天"
          tone="text-brand-600 bg-brand-50"
        />
        <EffMiniCard
          icon={Eye}
          label="待复核积压"
          value={`${reviewIssues.length}`}
          unit="项"
          tone="text-ember-600 bg-ember-50"
        />
        <EffMiniCard
          icon={RotateCcw}
          label="累计退回次数"
          value={`${totalRejections}`}
          unit="次"
          tone="text-caution bg-caution/10"
        />
        <EffMiniCard
          icon={Award}
          label="最快闭环门店"
          value={fastestStore ? fastestStore.store.name.replace("雅悦口腔·", "") : "—"}
          unit={fastestStore && fastestStore.avgDays > 0 ? `${fastestStore.avgDays}天` : ""}
          tone="text-safe bg-safe/10"
          mono={false}
        />
      </div>

      <div className="panel p-4">
        <div className="label-mono mb-3 flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5 text-brand-500" />
          门店效率排名
          <span className="ml-auto text-[10px] text-ink-400 font-normal">按平均整改天数升序</span>
        </div>
        <div className="space-y-2">
          {storeEfficiency.map((s, idx) => (
            <div
              key={s.store.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md border transition-colors",
                idx === 0 && s.closed > 0
                  ? "bg-ember-50/50 border-ember-500/20"
                  : "bg-surfaceAlt border-line"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-[11px] shrink-0",
                idx === 0 && s.closed > 0
                  ? "bg-ember-500 text-white"
                  : idx === 1 && s.closed > 0
                  ? "bg-ink-300 text-white"
                  : idx === 2 && s.closed > 0
                  ? "bg-amber-700 text-white"
                  : "bg-surfaceSunken text-ink-400 border border-line"
              )}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-ink-800 truncate">
                    {s.store.name.replace("雅悦口腔·", "")}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-ink-400">
                    <span>平均 {s.avgDays || "—"}天</span>
                    <span className="text-ember-600">积压 {s.backlog}</span>
                    <span className="text-caution">退回 {s.rejections}次</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surfaceSunken rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        s.closureRate >= 90 ? "bg-safe" : s.closureRate >= 70 ? "bg-brand-500" : "bg-caution"
                      )}
                      style={{ width: `${s.closureRate}%` }}
                    />
                  </div>
                  <span className={cn(
                    "font-display font-bold text-xs tabular-nums w-10 text-right shrink-0",
                    s.closureRate >= 90 ? "text-safe" : s.closureRate >= 70 ? "text-brand-600" : "text-caution"
                  )}>
                    {s.closureRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EffMiniCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
  mono = true,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  unit: string;
  tone: string;
  mono?: boolean;
}) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`h-7 w-7 rounded-md flex items-center justify-center ${tone}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="label-mono">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-display text-2xl font-bold tabular-nums text-ink-800", mono && "font-mono")}>
          {value}
        </span>
        <span className="text-xs text-ink-400">{unit}</span>
      </div>
    </div>
  );
}
