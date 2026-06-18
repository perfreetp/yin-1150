import { useState, useMemo } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { RiskBadge, IssueStatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatDate, daysUntil, isOverdue } from "@/lib/format";
import { Filter, Search, ChevronRight, CheckSquare, Square, Check, RotateCcw, Layers } from "lucide-react";
import type { RiskLevel, IssueStatus } from "@/types";

interface IssueListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const riskFilters: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "high", label: "高风险" },
  { value: "medium", label: "中风险" },
  { value: "low", label: "低风险" },
];

const statusFilters: { value: IssueStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "open", label: "待整改" },
  { value: "rectifying", label: "整改中" },
  { value: "review", label: "待复核" },
  { value: "closed", label: "已关闭" },
];

export function IssueList({ selectedId, onSelect }: IssueListProps) {
  const issues = useAuditStore((s) => s.issues);
  const stores = useAuditStore((s) => s.stores);
  const batchReviewIssues = useAuditStore((s) => s.batchReviewIssues);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = issues.filter((i) => {
    if (riskFilter !== "all" && i.riskLevel !== riskFilter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (query && !i.type.includes(query) && !i.description.includes(query) && !i.id.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const reviewIssues = useMemo(
    () => filtered.filter((i) => i.status === "review"),
    [filtered]
  );

  const canBatch = statusFilter === "review" && reviewIssues.length > 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === reviewIssues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reviewIssues.map((i) => i.id)));
    }
  };

  const handleBatch = (pass: boolean) => {
    if (selected.size === 0) return;
    batchReviewIssues(Array.from(selected), pass);
    setSelected(new Set());
    setBatchMode(false);
  };

  const handleStatusFilter = (value: IssueStatus | "all") => {
    setStatusFilter(value);
    setBatchMode(false);
    setSelected(new Set());
  };

  return (
    <div className="w-[400px] shrink-0 border-r border-line bg-surface flex flex-col h-full">
      <div className="p-3 border-b border-line space-y-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索问题类型 / 编号"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-ink-400 shrink-0" />
          <div className="flex flex-wrap gap-1">
            {riskFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setRiskFilter(f.value)}
                className={cn(
                  "chip border transition-colors",
                  riskFilter === f.value ? "bg-brand-500 text-white border-brand-500" : "bg-surfaceAlt text-ink-500 border-line hover:border-line-strong"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 items-center">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => handleStatusFilter(f.value)}
              className={cn(
                "chip border transition-colors",
                statusFilter === f.value ? "bg-ink-800 text-white border-ink-800" : "bg-surfaceAlt text-ink-500 border-line hover:border-line-strong"
              )}
            >
              {f.label}
            </button>
          ))}
          {canBatch && (
            <button
              onClick={() => setBatchMode(!batchMode)}
              className={cn(
                "ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors",
                batchMode ? "bg-ember-500 text-white border-ember-500" : "bg-ember-50 text-ember-600 border-ember-500/20 hover:border-ember-500/40"
              )}
            >
              <Layers className="h-3 w-3" />
              {batchMode ? "退出批量" : "批量复核"}
            </button>
          )}
        </div>
      </div>

      {batchMode && canBatch && (
        <div className="px-3 py-2 border-b border-line bg-ember-50/50 flex items-center gap-2">
          <button
            onClick={selectAll}
            className="flex items-center gap-1 text-[11px] font-semibold text-ink-600 hover:text-ink-800"
          >
            {selected.size === reviewIssues.length && reviewIssues.length > 0 ? (
              <CheckSquare className="h-3.5 w-3.5 text-brand-500" />
            ) : (
              <Square className="h-3.5 w-3.5 text-ink-400" />
            )}
            全选 ({reviewIssues.length})
          </button>
          <span className="text-[11px] text-ink-400">已选 {selected.size}</span>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="px-3 py-2 label-mono flex items-center justify-between">
          <span>整改清单</span>
          <span className="tabular-nums">{filtered.length}</span>
        </div>
        <div className="px-2 pb-2 space-y-1.5">
          {filtered.map((issue) => {
            const store = stores.find((s) => s.id === issue.storeId);
            const overdue = isOverdue(issue.deadline, issue.status);
            const due = daysUntil(issue.deadline);
            const isChecked = selected.has(issue.id);
            const showCheckbox = batchMode && issue.status === "review";
            return (
              <button
                key={issue.id}
                onClick={() => showCheckbox ? toggleSelect(issue.id) : onSelect(issue.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md border transition-all relative",
                  showCheckbox && isChecked
                    ? "border-ember-500 bg-ember-50 ring-1 ring-ember-500/20"
                    : selectedId === issue.id
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/20"
                    : "border-line bg-surfaceAlt hover:border-line-strong",
                  overdue && "border-l-2 border-l-risk"
                )}
              >
                {showCheckbox && (
                  <div className="absolute top-2 right-2">
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-ember-500" />
                    ) : (
                      <Square className="h-4 w-4 text-ink-300" />
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mb-1.5 pr-6">
                  <span className="font-mono text-[10px] text-ink-400">{issue.id}</span>
                  <RiskBadge level={issue.riskLevel} />
                </div>
                <div className="text-sm font-semibold text-ink-800 mb-1 leading-tight">{issue.type}</div>
                <div className="text-[11px] text-ink-400 leading-relaxed line-clamp-2 mb-2">{issue.description}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <IssueStatusBadge status={issue.status} />
                    <span className="text-[11px] text-ink-400">{store?.name.replace("雅悦口腔·", "")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    {issue.status === "closed" ? (
                      <span className="text-safe font-mono">{formatDate(issue.resolvedAt || issue.deadline).slice(5)}</span>
                    ) : overdue ? (
                      <span className="font-mono text-risk font-semibold">超期{Math.abs(due)}天</span>
                    ) : (
                      <span className={cn("font-mono", due <= 2 ? "text-caution font-semibold" : "text-ink-400")}>{due}天后截止</span>
                    )}
                    {!showCheckbox && <ChevronRight className="h-3 w-3 text-ink-400" />}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-xs text-ink-400 py-8">无匹配问题</div>
          )}
        </div>
      </div>

      {batchMode && selected.size > 0 && (
        <div className="shrink-0 border-t border-line bg-surfaceAlt px-3 py-2.5 flex items-center gap-2 animate-fade-up">
          <span className="text-xs font-semibold text-ink-700">已选 {selected.size} 项</span>
          <div className="flex-1" />
          <button
            onClick={() => handleBatch(false)}
            className="btn-ghost text-xs text-caution border-caution/30 hover:bg-caution/5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 批量退回
          </button>
          <button
            onClick={() => handleBatch(true)}
            className="btn-primary text-xs bg-safe hover:bg-safe"
          >
            <Check className="h-3.5 w-3.5" /> 批量通过
          </button>
        </div>
      )}
    </div>
  );
}
