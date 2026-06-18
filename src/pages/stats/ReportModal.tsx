import { useState, useMemo } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { Modal } from "@/components/ui/Modal";
import { categoryLabel } from "@/lib/format";
import { FileText, Download, Calendar, Store as StoreIcon, TrendingUp, AlertTriangle, CheckCircle, Award, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Store as StoreType } from "@/types";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReportModal({ open, onClose }: ReportModalProps) {
  const stores = useAuditStore((s) => s.stores);
  const issues = useAuditStore((s) => s.issues);
  const tasks = useAuditStore((s) => s.tasks);

  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(stores.map((s) => s.id));
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-06-30");
  const [step, setStep] = useState<"config" | "preview">("config");

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (!selectedStoreIds.includes(i.storeId)) return false;
      const created = new Date(i.createdAt);
      if (created < new Date(startDate)) return false;
      if (created > new Date(endDate)) return false;
      return true;
    });
  }, [issues, selectedStoreIds, startDate, endDate]);

  const storeStats = useMemo(() => {
    return selectedStoreIds.map((sid) => {
      const store = stores.find((s) => s.id === sid)!;
      const storeIssues = filteredIssues.filter((i) => i.storeId === sid);
      const total = storeIssues.length;
      const closed = storeIssues.filter((i) => i.status === "closed").length;
      const rectifyRate = total > 0 ? Math.round((closed / total) * 100) : 100;
      const highRisk = storeIssues.filter((i) => i.riskLevel === "high").length;
      return {
        store,
        total,
        closed,
        rectifyRate,
        highRisk,
      };
    }).sort((a, b) => b.rectifyRate - a.rectifyRate || a.total - b.total);
  }, [filteredIssues, selectedStoreIds, stores]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredIssues.forEach((i) => {
      map.set(i.category, (map.get(i.category) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([cat, count]) => ({ category: cat, count, label: categoryLabel[cat as keyof typeof categoryLabel] || cat }))
      .sort((a, b) => b.count - a.count);
  }, [filteredIssues]);

  const totalIssues = filteredIssues.length;
  const totalClosed = filteredIssues.filter((i) => i.status === "closed").length;
  const overallRate = totalIssues > 0 ? Math.round((totalClosed / totalIssues) * 100) : 100;

  const toggleStore = (id: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const reportData = {
      title: "门店稽核报告",
      period: `${startDate} 至 ${endDate}`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalStores: selectedStoreIds.length,
        totalIssues,
        totalClosed,
        overallRectifyRate: overallRate,
      },
      storeRanking: storeStats.map((s) => ({
        store: s.store.name,
        code: s.store.code,
        totalIssues: s.total,
        closed: s.closed,
        rectifyRate: s.rectifyRate,
        highRisk: s.highRisk,
      })),
      categoryBreakdown: categoryStats,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `稽核报告_${startDate}_${endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="门店稽核报告"
      subtitle={step === "config" ? "选择门店和时间范围生成报告" : `报告预览 · ${startDate} 至 ${endDate}`}
      size="2xl"
      footer={
        step === "config" ? (
          <>
            <button className="btn-ghost" onClick={onClose}>取消</button>
            <button
              className="btn-primary"
              onClick={() => setStep("preview")}
              disabled={selectedStoreIds.length === 0}
            >
              <FileText className="h-4 w-4" /> 生成预览
            </button>
          </>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => setStep("config")}>返回配置</button>
            <button className="btn-primary" onClick={handleExport}>
              <Download className="h-4 w-4" /> 导出报告
            </button>
          </>
        )
      }
    >
      {step === "config" ? (
        <div className="space-y-5">
          <div>
            <div className="label-mono mb-2 flex items-center gap-1.5">
              <StoreIcon className="h-3 w-3" /> 选择门店
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {stores.map((s) => {
                const selected = selectedStoreIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStore(s.id)}
                    className={cn(
                      "text-left p-3 rounded-md border transition-all",
                      selected
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/30"
                        : "border-line bg-surfaceAlt hover:border-line-strong"
                    )}
                  >
                    <div className="text-sm font-semibold text-ink-800 truncate">{s.name.replace("雅悦口腔·", "")}</div>
                    <div className="font-mono text-[10px] text-ink-400 mt-0.5">{s.code}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="label-mono mb-2 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> 时间范围
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <span className="text-ink-400 text-sm">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="p-3 rounded-md bg-surfaceSunken border border-line-faint">
            <div className="text-xs text-ink-500">
              将统计 <span className="font-semibold text-ink-700">{selectedStoreIds.length}</span> 家门店在所选时间范围内的稽核数据，包括问题汇总、整改完成率、门店排名及常见问题分布。
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-4 gap-3">
            <StatMini
              icon={ListChecks}
              label="问题总数"
              value={String(totalIssues)}
              color="text-ink-700"
            />
            <StatMini
              icon={CheckCircle}
              label="已闭环"
              value={String(totalClosed)}
              color="text-safe"
            />
            <StatMini
              icon={TrendingUp}
              label="整体整改率"
              value={`${overallRate}%`}
              color="text-brand-600"
            />
            <StatMini
              icon={AlertTriangle}
              label="高风险"
              value={String(filteredIssues.filter((i) => i.riskLevel === "high").length)}
              color="text-risk"
            />
          </div>

          <div className="panel p-4">
            <div className="label-mono mb-3 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-ember-500" />
              门店整改率排名
            </div>
            <div className="space-y-2">
              {storeStats.map((s, idx) => (
                <div key={s.store.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-[11px]",
                    idx === 0 ? "bg-ember-500 text-white" :
                    idx === 1 ? "bg-ink-300 text-white" :
                    idx === 2 ? "bg-amber-700 text-white" :
                    "bg-surfaceAlt text-ink-400 border border-line"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-ink-800 truncate">{s.store.name.replace("雅悦口腔·", "")}</span>
                      <span className="font-mono text-xs text-ink-500">{s.total}个问题 · 高风险{s.highRisk}</span>
                    </div>
                    <div className="h-1.5 bg-surfaceSunken rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          s.rectifyRate >= 90 ? "bg-safe" : s.rectifyRate >= 70 ? "bg-brand-500" : "bg-caution"
                        )}
                        style={{ width: `${s.rectifyRate}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn(
                    "font-display font-bold text-lg tabular-nums w-14 text-right",
                    s.rectifyRate >= 90 ? "text-safe" : s.rectifyRate >= 70 ? "text-brand-600" : "text-caution"
                  )}>
                    {s.rectifyRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <div className="label-mono mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-caution" />
              常见问题类型分布
            </div>
            <div className="space-y-2">
              {categoryStats.map((c, idx) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-400 w-5">{idx + 1}</span>
                  <span className="text-sm text-ink-700 w-24 shrink-0">{c.label}</span>
                  <div className="flex-1 h-2 bg-surfaceSunken rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${totalIssues > 0 ? (c.count / totalIssues) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-ink-600 w-10 text-right">{c.count}次</span>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <div className="text-sm text-ink-400 text-center py-4">所选范围内无问题数据</div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-ink-400 font-mono text-center pt-2">
            报告生成时间：{new Date().toLocaleString("zh-CN")} · 数据来源：消毒追溯稽核系统
          </div>
        </div>
      )}
    </Modal>
  );
}

function StatMini({ icon: Icon, label, value, color }: { icon: typeof ListChecks; label: string; value: string; color: string }) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <span className="label-mono">{label}</span>
      </div>
      <div className={cn("font-display text-2xl font-bold tabular-nums", color)}>{value}</div>
    </div>
  );
}
