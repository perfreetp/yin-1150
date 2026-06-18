import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuditStore } from "@/store/useAuditStore";
import { Clock, RotateCcw, Eye, TrendingUp, Award, Store, ChevronDown, ChevronRight, ExternalLink, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue } from "@/lib/format";
import { RiskBadge } from "@/components/ui/Badge";
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
  const navigate = useNavigate();
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  const closedIssues = useMemo(() => issues.filter((i) => i.status === "closed"), [issues]);
  const reviewIssues = useMemo(() => issues.filter((i) => i.status === "review"), [issues]);
  const pendingIssues = useMemo(
    () => issues.filter((i) => i.status === "open" || i.status === "rectifying"),
    [issues]
  );

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
      const storePending = storeIssues.filter(
        (i) => i.status === "open" || i.status === "rectifying"
      );

      const days = storeClosed.map(calcRectifyDays).filter((d): d is number => d !== null);
      const avgDays = days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
      const rejections = storeIssues.reduce((sum, i) => sum + countRejections(i), 0);
      const reviewBacklog = storeReview.length;
      const pendingCount = storePending.length;
      const closureRate = storeIssues.length > 0 ? Math.round((storeClosed.length / storeIssues.length) * 100) : 100;

      return {
        store,
        total: storeIssues.length,
        closed: storeClosed.length,
        avgDays,
        rejections,
        reviewBacklog,
        pendingCount,
        closureRate,
      };
    }).sort((a, b) => a.avgDays - b.avgDays || b.closureRate - a.closureRate);
  }, [issues, stores]);

  const fastestStore = storeEfficiency.find((s) => s.closed > 0) || storeEfficiency[0];

  const getStoreCategorized = (storeId: string) => {
    const storeIssues = issues.filter((i) => i.storeId === storeId);
    return {
      review: storeIssues.filter((i) => i.status === "review"),
      rejected: storeIssues.filter((i) => i.timeline.some((n) => n.node === "复核退回")),
      overdueClosed: storeIssues.filter(
        (i) => i.status === "closed" && i.resolvedAt && new Date(i.resolvedAt) > new Date(i.deadline)
      ),
    };
  };

  const goToArchive = (issueId: string) => {
    navigate(`/rectify?view=archive&issue=${issueId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-bold text-ink-900">复核效率看板</h3>
          <span className="label-mono">按门店统计闭环时效</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
          icon={Clock}
          label="待处理(整改中)"
          value={`${pendingIssues.length}`}
          unit="项"
          tone="text-caution bg-caution/10"
        />
        <EffMiniCard
          icon={RotateCcw}
          label="累计退回次数"
          value={`${totalRejections}`}
          unit="次"
          tone="text-risk bg-risk/10"
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
          {storeEfficiency.map((s, idx) => {
            const expanded = expandedStore === s.store.id;
            const cats = expanded ? getStoreCategorized(s.store.id) : null;
            return (
              <div key={s.store.id} className={cn("rounded-md border transition-colors overflow-hidden", expanded ? "border-brand-300 bg-surfaceAlt" : "bg-surfaceAlt border-line")}>
                <button
                  onClick={() => setExpandedStore(expanded ? null : s.store.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 transition-colors",
                    idx === 0 && s.closed > 0 ? "hover:bg-ember-50/40" : "hover:bg-surfaceSunken"
                  )}
                >
                  {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                  )}
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
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-ink-800 truncate">
                        {s.store.name.replace("雅悦口腔·", "")}
                      </span>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-ink-400">
                        <span>平均 {s.avgDays || "—"}天</span>
                        <span className="text-ember-600">待复核 {s.reviewBacklog}</span>
                        <span className="text-caution">待处理 {s.pendingCount}</span>
                        <span className="text-risk">退回 {s.rejections}次</span>
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
                </button>
                {expanded && cats && (
                  <div className="px-3 pb-3 pt-1 border-t border-line-faint space-y-3 animate-fade-in">
                    <CategoryGroup
                      title="待复核"
                      icon={Eye}
                      tone="text-ember-600"
                      issues={cats.review}
                      onSelect={goToArchive}
                    />
                    <CategoryGroup
                      title="退回过"
                      icon={RotateCcw}
                      tone="text-risk"
                      issues={cats.rejected}
                      onSelect={goToArchive}
                    />
                    <CategoryGroup
                      title="超期闭环"
                      icon={AlertTriangle}
                      tone="text-caution"
                      issues={cats.overdueClosed}
                      onSelect={goToArchive}
                    />
                    {cats.review.length === 0 && cats.rejected.length === 0 && cats.overdueClosed.length === 0 && (
                      <div className="text-center text-xs text-ink-400 py-3">该门店暂无异常问题</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

function CategoryGroup({
  title,
  icon: Icon,
  tone,
  issues,
  onSelect,
}: {
  title: string;
  icon: typeof Clock;
  tone: string;
  issues: Issue[];
  onSelect: (id: string) => void;
}) {
  if (issues.length === 0) return null;
  return (
    <div>
      <div className={cn("flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold", tone)}>
        <Icon className="h-3 w-3" />
        {title}
        <span className="font-mono text-ink-400 font-normal">({issues.length})</span>
      </div>
      <div className="space-y-1">
        {issues.map((issue) => (
          <button
            key={issue.id}
            onClick={() => onSelect(issue.id)}
            className="w-full flex items-center gap-2 p-1.5 rounded border border-line bg-surface hover:border-brand-300 hover:bg-brand-50/40 transition-colors group"
          >
            <span className="font-mono text-[10px] text-ink-400 shrink-0">{issue.id}</span>
            <RiskBadge level={issue.riskLevel} />
            <span className="flex-1 min-w-0 text-left text-xs text-ink-700 truncate">{issue.type}</span>
            <span className="font-mono text-[10px] text-ink-400 shrink-0">{formatDate(issue.createdAt).slice(5)}</span>
            <ExternalLink className="h-3 w-3 text-ink-300 group-hover:text-brand-500 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
