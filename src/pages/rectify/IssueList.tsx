import { useState, useMemo } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { RiskBadge, IssueStatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatDate, daysUntil, isOverdue } from "@/lib/format";
import { Filter, Search, ChevronRight, ChevronDown, CheckSquare, Square, Check, RotateCcw, Layers, Store, ClipboardList } from "lucide-react";
import type { RiskLevel, IssueStatus, Issue } from "@/types";

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
  const tasks = useAuditStore((s) => s.tasks);
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewGroupMode, setReviewGroupMode] = useState<"flat" | "store" | "task">("flat");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  const reviewGroups = useMemo(() => {
    if (reviewGroupMode === "flat") return [];
    const map = new Map<string, { key: string; label: string; sublabel: string; issues: Issue[] }>();
    reviewIssues.forEach((issue) => {
      let key: string;
      let label: string;
      let sublabel: string;
      if (reviewGroupMode === "store") {
        const store = stores.find((s) => s.id === issue.storeId);
        key = issue.storeId;
        label = store?.name.replace("雅悦口腔·", "") || "未知门店";
        sublabel = store?.code || "";
      } else {
        const task = tasks.find((t) => t.id === issue.taskId);
        key = issue.taskId;
        label = task?.planName || "未关联任务";
        sublabel = task?.id || "";
      }
      if (!map.has(key)) {
        map.set(key, { key, label, sublabel, issues: [] });
      }
      map.get(key)!.issues.push(issue);
    });
    return Array.from(map.values()).sort((a, b) => b.issues.length - a.issues.length);
  }, [reviewIssues, reviewGroupMode, stores, tasks]);

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
    setReviewGroupMode("flat");
    setExpandedGroups(new Set());
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroupSelect = (groupIssues: Issue[]) => {
    const groupIds = groupIssues.map((i) => i.id);
    const allSelected = groupIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const isGroupAllSelected = (groupIssues: Issue[]) => {
    return groupIssues.every((i) => selected.has(i.id)) && groupIssues.length > 0;
  };

  const selectedInGroup = (groupIssues: Issue[]) => {
    return groupIssues.filter((i) => selected.has(i.id)).length;
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

        {canBatch && batchMode && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[10px] text-ink-400 shrink-0">组织方式</span>
            <button
              onClick={() => setReviewGroupMode("flat")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-semibold border transition-colors",
                reviewGroupMode === "flat"
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-surfaceAlt text-ink-500 border-line hover:border-line-strong"
              )}
            >
              平铺
            </button>
            <button
              onClick={() => setReviewGroupMode("store")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-semibold border transition-colors",
                reviewGroupMode === "store"
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-surfaceAlt text-ink-500 border-line hover:border-line-strong"
              )}
            >
              <Store className="h-2.5 w-2.5" /> 按门店
            </button>
            <button
              onClick={() => setReviewGroupMode("task")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-semibold border transition-colors",
                reviewGroupMode === "task"
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-surfaceAlt text-ink-500 border-line hover:border-line-strong"
              )}
            >
              <ClipboardList className="h-2.5 w-2.5" /> 按任务
            </button>
          </div>
        )}
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
          <span>{statusFilter === "review" ? "待复核问题" : "整改清单"}</span>
          <span className="tabular-nums">{filtered.length}</span>
        </div>

        {canBatch && batchMode && reviewGroupMode !== "flat" ? (
          <div className="px-2 pb-2 space-y-2">
            {reviewGroups.map((group) => {
              const expanded = expandedGroups.has(group.key);
              const allSelected = isGroupAllSelected(group.issues);
              const selCount = selectedInGroup(group.issues);
              const GroupIcon = reviewGroupMode === "store" ? Store : ClipboardList;
              return (
                <div key={group.key} className="border border-line rounded-md overflow-hidden bg-surfaceAlt">
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-surfaceSunken transition-colors"
                  >
                    {expanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleGroupSelect(group.issues); }}
                      className="shrink-0"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4 text-ember-500" />
                      ) : selCount > 0 ? (
                        <CheckSquare className="h-4 w-4 text-ember-500/60" />
                      ) : (
                        <Square className="h-4 w-4 text-ink-300" />
                      )}
                    </button>
                    <GroupIcon className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-semibold text-ink-800 truncate">{group.label}</div>
                      <div className="font-mono text-[10px] text-ink-400 truncate">{group.sublabel}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="chip bg-ember-50 text-ember-600 border border-ember-500/20 text-[10px]">
                        {group.issues.length}待复核
                      </span>
                      {selCount > 0 && (
                        <span className="chip bg-brand-500 text-white text-[10px]">
                          已选{selCount}
                        </span>
                      )}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-2 pb-2 space-y-1.5 border-t border-line-faint animate-fade-in">
                      {group.issues.map((issue) => {
                        const store = stores.find((s) => s.id === issue.storeId);
                        const isChecked = selected.has(issue.id);
                        return (
                          <button
                            key={issue.id}
                            onClick={() => toggleSelect(issue.id)}
                            className={cn(
                              "w-full text-left p-2.5 rounded-md border transition-all relative",
                              isChecked
                                ? "border-ember-500 bg-ember-50 ring-1 ring-ember-500/20"
                                : "border-line bg-surface hover:border-line-strong"
                            )}
                          >
                            <div className="absolute top-2 right-2">
                              {isChecked ? (
                                <CheckSquare className="h-3.5 w-3.5 text-ember-500" />
                              ) : (
                                <Square className="h-3.5 w-3.5 text-ink-300" />
                              )}
                            </div>
                            <div className="flex items-center justify-between mb-1 pr-5">
                              <span className="font-mono text-[10px] text-ink-400">{issue.id}</span>
                              <RiskBadge level={issue.riskLevel} />
                            </div>
                            <div className="text-xs font-semibold text-ink-800 mb-0.5 leading-tight">{issue.type}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-ink-400">
                                {reviewGroupMode !== "store" && store?.name.replace("雅悦口腔·", "") + " · "}
                                {formatDate(issue.createdAt).slice(5)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {reviewGroups.length === 0 && (
              <div className="text-center text-xs text-ink-400 py-8">无待复核问题</div>
            )}
          </div>
        ) : (
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
        )}
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
