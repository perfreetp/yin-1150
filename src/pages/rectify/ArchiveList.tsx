import { useState, useMemo } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { RiskBadge, IssueStatusBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Archive, Store as StoreIcon, ClipboardList, Package, ChevronDown, ChevronRight, Image as ImageIcon, CheckCircle2, Search, GitBranch } from "lucide-react";
import type { Issue } from "@/types";

interface ArchiveListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTraceBatch?: (packageId: string) => void;
}

type GroupMode = "store" | "task" | "batch";

const groupLabels: Record<GroupMode, string> = {
  store: "按门店",
  task: "按任务",
  batch: "按批次",
};

const groupIcons: Record<GroupMode, typeof StoreIcon> = {
  store: StoreIcon,
  task: ClipboardList,
  batch: Package,
};

export function ArchiveList({ selectedId, onSelect, onTraceBatch }: ArchiveListProps) {
  const issues = useAuditStore((s) => s.issues);
  const stores = useAuditStore((s) => s.stores);
  const tasks = useAuditStore((s) => s.tasks);
  const packages = useAuditStore((s) => s.packages);

  const [groupMode, setGroupMode] = useState<GroupMode>("store");
  const [query, setQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query) return issues;
    const q = query.toLowerCase();
    return issues.filter(
      (i) =>
        i.type.includes(query) ||
        i.description.includes(query) ||
        i.id.toLowerCase().includes(q) ||
        i.status.includes(q)
    );
  }, [issues, query]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; sublabel: string; issues: Issue[] }>();

    filtered.forEach((issue) => {
      let key: string;
      let label: string;
      let sublabel: string;

      if (groupMode === "store") {
        const store = stores.find((s) => s.id === issue.storeId);
        key = issue.storeId;
        label = store?.name.replace("雅悦口腔·", "") || "未知门店";
        sublabel = store?.code || "";
      } else if (groupMode === "task") {
        const task = tasks.find((t) => t.id === issue.taskId);
        key = issue.taskId;
        label = task?.planName || "未关联任务";
        sublabel = task?.id || "";
      } else {
        key = issue.packageId;
        const pkg = packages.find((p) => p.id === issue.packageId);
        label = pkg?.batchNo || "未知批次";
        sublabel = pkg?.packageName || "";
      }

      if (!map.has(key)) {
        map.set(key, { label, sublabel, issues: [] });
      }
      map.get(key)!.issues.push(issue);
    });

    return Array.from(map.entries()).map(([key, val]) => ({
      key,
      ...val,
    }));
  }, [filtered, groupMode, stores, tasks, packages]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedGroups.size === groups.length) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(groups.map((g) => g.key)));
    }
  };

  return (
    <div className="w-[400px] shrink-0 border-r border-line bg-surface flex flex-col h-full">
      <div className="p-3 border-b border-line space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Archive className="h-3.5 w-3.5 text-brand-500" />
          <span className="label-mono">问题档案</span>
          <span className="font-mono text-[11px] text-ink-400 ml-auto">{filtered.length}条记录</span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索问题类型 / 编号 / 状态"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-1">
          {(Object.keys(groupLabels) as GroupMode[]).map((mode) => {
            const Icon = groupIcons[mode];
            return (
              <button
                key={mode}
                onClick={() => setGroupMode(mode)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors",
                  groupMode === mode
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-surfaceAlt text-ink-500 border-line hover:border-line-strong"
                )}
              >
                <Icon className="h-3 w-3" />
                {groupLabels[mode]}
              </button>
            );
          })}
        </div>

        <button
          onClick={toggleAll}
          className="text-[11px] text-ink-400 hover:text-ink-600 transition-colors flex items-center gap-1"
        >
          {expandedGroups.size === groups.length && groups.length > 0 ? "全部收起" : "全部展开"}
        </button>
      </div>

      <div className="flex-1 overflow-auto pb-2">
        {groups.map((group) => {
          const expanded = expandedGroups.has(group.key);
          const closedCount = group.issues.filter((i) => i.status === "closed").length;
          const evidenceCount = group.issues.reduce((sum, i) => sum + i.evidence.length, 0);
          const GroupIcon = groupIcons[groupMode];

          return (
            <div key={group.key} className="border-b border-line-faint">
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surfaceAlt transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                )}
                <GroupIcon className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-ink-800 truncate">{group.label}</div>
                  <div className="font-mono text-[10px] text-ink-400">{group.sublabel}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="chip bg-surfaceSunken text-ink-500 border border-line text-[10px]">
                    {group.issues.length}问题
                  </span>
                  {closedCount === group.issues.length && group.issues.length > 0 && (
                    <span className="chip bg-safe/10 text-safe border border-safe/20 text-[10px]">
                      全闭环
                    </span>
                  )}
                  {evidenceCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-ink-400 font-mono">
                      <ImageIcon className="h-2.5 w-2.5" />
                      {evidenceCount}
                    </span>
                  )}
                  {groupMode === "batch" && onTraceBatch && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onTraceBatch(group.key); }}
                      title="查看闭环链路"
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-brand-500/20 bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                    >
                      <GitBranch className="h-2.5 w-2.5" />
                      链路
                    </button>
                  )}
                </div>
              </button>

              {expanded && (
                <div className="px-2 pb-2 space-y-1.5 animate-fade-in">
                  {group.issues.map((issue) => {
                    const store = stores.find((s) => s.id === issue.storeId);
                    return (
                      <button
                        key={issue.id}
                        onClick={() => onSelect(issue.id)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-md border transition-all relative",
                          selectedId === issue.id
                            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/20"
                            : "border-line bg-surfaceAlt hover:border-line-strong"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-ink-400">{issue.id}</span>
                          <div className="flex items-center gap-1">
                            {issue.evidence.length > 0 && (
                              <span className="flex items-center gap-0.5 text-[9px] text-ink-400 font-mono">
                                <ImageIcon className="h-2.5 w-2.5" />
                                {issue.evidence.length}
                              </span>
                            )}
                            <RiskBadge level={issue.riskLevel} />
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-ink-800 mb-0.5 leading-tight">{issue.type}</div>
                        <div className="flex items-center justify-between">
                          <IssueStatusBadge status={issue.status} />
                          <span className="text-[10px] text-ink-400">
                            {groupMode !== "store" && store?.name.replace("雅悦口腔·", "") + " · "}
                            {formatDate(issue.createdAt).slice(5)}
                          </span>
                        </div>
                        {issue.status === "closed" && issue.rectifyNote && (
                          <div className="mt-1.5 flex items-start gap-1 text-[10px] text-safe">
                            <CheckCircle2 className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{issue.rectifyNote}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="text-center text-xs text-ink-400 py-8">无匹配档案记录</div>
        )}
      </div>
    </div>
  );
}
