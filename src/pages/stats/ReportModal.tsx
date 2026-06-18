import { useState, useMemo } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { Modal } from "@/components/ui/Modal";
import { RiskBadge, IssueStatusBadge } from "@/components/ui/Badge";
import { categoryLabel, formatDate } from "@/lib/format";
import { FileText, Download, Calendar, Store as StoreIcon, TrendingUp, AlertTriangle, CheckCircle, Award, ListChecks, ArrowLeft, Image as ImageIcon, ChevronRight, Clock, RotateCcw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Issue } from "@/types";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "config" | "preview" | "detail";

export function ReportModal({ open, onClose }: ReportModalProps) {
  const stores = useAuditStore((s) => s.stores);
  const issues = useAuditStore((s) => s.issues);
  const packages = useAuditStore((s) => s.packages);
  const recordReportExport = useAuditStore((s) => s.recordReportExport);

  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(stores.map((s) => s.id));
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-06-30");
  const [step, setStep] = useState<Step>("config");
  const [detailStoreId, setDetailStoreId] = useState<string | null>(null);

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
      const evidenceCount = storeIssues.reduce((sum, i) => sum + i.evidence.length, 0);

      const daysList = storeIssues
        .filter((i) => i.resolvedAt)
        .map((i) => Math.ceil((new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      const avgRectifyDays = daysList.length > 0
        ? Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length)
        : 0;
      const rejections = storeIssues.reduce(
        (sum, i) => sum + i.timeline.filter((n) => n.node === "复核退回").length,
        0
      );
      const reviewBacklog = storeIssues.filter((i) => i.status === "review").length;
      const pendingCount = storeIssues.filter(
        (i) => i.status === "open" || i.status === "rectifying"
      ).length;

      return {
        store,
        total,
        closed,
        rectifyRate,
        highRisk,
        evidenceCount,
        avgRectifyDays,
        rejections,
        reviewBacklog,
        pendingCount,
        issues: storeIssues,
      };
    }).sort((a, b) => b.rectifyRate - a.rectifyRate || a.avgRectifyDays - b.avgRectifyDays);
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

  const avgRectifyDays = useMemo(() => {
    const days = filteredIssues
      .filter((i) => i.resolvedAt)
      .map((i) => Math.ceil((new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    return days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
  }, [filteredIssues]);

  const totalRejections = useMemo(
    () => filteredIssues.reduce((sum, i) => sum + i.timeline.filter((n) => n.node === "复核退回").length, 0),
    [filteredIssues]
  );

  const totalReviewBacklog = useMemo(
    () => filteredIssues.filter((i) => i.status === "review").length,
    [filteredIssues]
  );
  const totalPendingCount = useMemo(
    () => filteredIssues.filter((i) => i.status === "open" || i.status === "rectifying").length,
    [filteredIssues]
  );

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
        totalOpen: totalIssues - totalClosed,
        overallRectifyRate: overallRate,
        totalEvidence: filteredIssues.reduce((sum, i) => sum + i.evidence.length, 0),
        avgRectifyDays,
        totalRejections,
        totalReviewBacklog,
        totalPendingCount,
      },
      storeRanking: storeStats.map((s, idx) => ({
        rank: idx + 1,
        store: s.store.name,
        code: s.store.code,
        totalIssues: s.total,
        closed: s.closed,
        open: s.total - s.closed,
        rectifyRate: s.rectifyRate,
        highRisk: s.highRisk,
        evidenceCount: s.evidenceCount,
        avgRectifyDays: s.avgRectifyDays,
        rejections: s.rejections,
        reviewBacklog: s.reviewBacklog,
        pendingCount: s.pendingCount,
        closureStatus: s.rectifyRate === 100 ? "全部闭环" : s.rectifyRate >= 70 ? "大部分闭环" : "整改中",
        issueList: s.issues.map((i) => ({
          id: i.id,
          type: i.type,
          category: categoryLabel[i.category as keyof typeof categoryLabel] || i.category,
          riskLevel: i.riskLevel,
          status: i.status,
          description: i.description,
          createdAt: i.createdAt,
          resolvedAt: i.resolvedAt || null,
          deadline: i.deadline,
          assignee: i.assignee,
          rectifyNote: i.rectifyNote || null,
          evidenceCount: i.evidence.length,
          timelineNodes: i.timeline.length,
        })),
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

    const batchNos = Array.from(
      new Set(
        filteredIssues
          .map((i) => packages.find((p) => p.id === i.packageId)?.batchNo)
          .filter((v): v is string => Boolean(v))
      )
    );
    recordReportExport({
      storeIds: selectedStoreIds,
      issueIds: filteredIssues.map((i) => i.id),
      batchNos,
      totalIssues,
      overallRectifyRate: overallRate,
    });
  };

  const detailStore = detailStoreId ? storeStats.find((s) => s.store.id === detailStoreId) : null;

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("config");
      setDetailStoreId(null);
    }, 200);
  };

  const subtitle = step === "config"
    ? "选择门店和时间范围生成报告"
    : step === "preview"
    ? `报告预览 · ${startDate} 至 ${endDate}`
    : detailStore
    ? `${detailStore.store.name.replace("雅悦口腔·", "")} · 问题明细`
    : "";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="门店稽核报告"
      subtitle={subtitle}
      size="2xl"
      footer={
        step === "config" ? (
          <>
            <button className="btn-ghost" onClick={handleClose}>取消</button>
            <button
              className="btn-primary"
              onClick={() => setStep("preview")}
              disabled={selectedStoreIds.length === 0}
            >
              <FileText className="h-4 w-4" /> 生成预览
            </button>
          </>
        ) : step === "preview" ? (
          <>
            <button className="btn-ghost" onClick={() => setStep("config")}>返回配置</button>
            <button className="btn-primary" onClick={handleExport}>
              <Download className="h-4 w-4" /> 导出报告
            </button>
          </>
        ) : (
          <>
            <button className="btn-ghost" onClick={() => setStep("preview")}>
              <ArrowLeft className="h-4 w-4" /> 返回排名
            </button>
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
              将统计 <span className="font-semibold text-ink-700">{selectedStoreIds.length}</span> 家门店在所选时间范围内的稽核数据，包括问题汇总、整改完成率、门店排名、问题明细及闭环情况。
            </div>
          </div>
        </div>
      ) : step === "preview" ? (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
            <StatMini icon={ListChecks} label="问题总数" value={String(totalIssues)} color="text-ink-700" />
            <StatMini icon={CheckCircle} label="已闭环" value={String(totalClosed)} color="text-safe" />
            <StatMini icon={TrendingUp} label="整体整改率" value={`${overallRate}%`} color="text-brand-600" />
            <StatMini icon={Clock} label="平均整改用时" value={`${avgRectifyDays}天`} color="text-brand-600" />
            <StatMini icon={Eye} label="待复核积压" value={String(totalReviewBacklog)} color="text-ember-600" />
            <StatMini icon={AlertTriangle} label="待处理" value={String(totalPendingCount)} color="text-caution" />
            <StatMini icon={RotateCcw} label="累计退回" value={`${totalRejections}次`} color="text-risk" />
          </div>

          <div className="panel p-4">
            <div className="label-mono mb-3 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-ember-500" />
              门店整改率排名
              <span className="ml-auto text-[10px] text-ink-400 font-normal">点击查看门店明细</span>
            </div>
            <div className="space-y-2">
              {storeStats.map((s, idx) => (
                <button
                  key={s.store.id}
                  onClick={() => { setDetailStoreId(s.store.id); setStep("detail"); }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-surfaceAlt transition-colors group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-[11px] shrink-0",
                    idx === 0 ? "bg-ember-500 text-white" :
                    idx === 1 ? "bg-ink-300 text-white" :
                    idx === 2 ? "bg-amber-700 text-white" :
                    "bg-surfaceAlt text-ink-400 border border-line"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-ink-800 truncate">{s.store.name.replace("雅悦口腔·", "")}</span>
                        <span className="font-mono text-[11px] text-ink-500">
                          {s.total}问题 · 高风险{s.highRisk} · 平均{s.avgRectifyDays || "—"}天 · 待复核{s.reviewBacklog} · 退回{s.rejections}次
                        </span>
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
                    "font-display font-bold text-lg tabular-nums w-14 text-right shrink-0",
                    s.rectifyRate >= 90 ? "text-safe" : s.rectifyRate >= 70 ? "text-brand-600" : "text-caution"
                  )}>
                    {s.rectifyRate}%
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-300 group-hover:text-ink-500 shrink-0" />
                </button>
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
      ) : detailStore ? (
        <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
            <StatMini icon={ListChecks} label="问题总数" value={String(detailStore.total)} color="text-ink-700" />
            <StatMini icon={CheckCircle} label="已闭环" value={String(detailStore.closed)} color="text-safe" />
            <StatMini icon={TrendingUp} label="整改率" value={`${detailStore.rectifyRate}%`} color="text-brand-600" />
            <StatMini icon={Clock} label="平均整改用时" value={`${detailStore.avgRectifyDays || 0}天`} color="text-brand-600" />
            <StatMini icon={Eye} label="待复核积压" value={String(detailStore.reviewBacklog)} color="text-ember-600" />
            <StatMini icon={RotateCcw} label="退回次数" value={`${detailStore.rejections}次`} color="text-risk" />
            <StatMini icon={ImageIcon} label="证据照片" value={String(detailStore.evidenceCount)} color="text-ink-600" />
          </div>

          <div className="panel p-4">
            <div className="label-mono mb-3 flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-brand-500" />
              问题清单与闭环情况
            </div>
            <div className="space-y-2">
              {detailStore.issues.map((issue: Issue) => {
                const pkg = packages.find((p) => p.id === issue.packageId);
                return (
                  <div
                    key={issue.id}
                    className={cn(
                      "p-3 rounded-md border",
                      issue.status === "closed" ? "border-safe/20 bg-safe/5" : "border-line bg-surfaceAlt"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-ink-400">{issue.id}</span>
                        <RiskBadge level={issue.riskLevel} />
                        <IssueStatusBadge status={issue.status} />
                      </div>
                      {issue.evidence.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-ink-400 font-mono">
                          <ImageIcon className="h-2.5 w-2.5" /> {issue.evidence.length}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-ink-800 mb-1">{issue.type}</div>
                    <div className="text-[11px] text-ink-400 leading-relaxed mb-2">{issue.description}</div>
                    <div className="flex items-center gap-3 text-[10px] text-ink-400 font-mono">
                      <span>批次：{pkg?.batchNo || "—"}</span>
                      <span>发现：{formatDate(issue.createdAt)}</span>
                      {issue.resolvedAt && <span className="text-safe">闭环：{formatDate(issue.resolvedAt)}</span>}
                      <span>截止：{formatDate(issue.deadline)}</span>
                    </div>
                    {issue.rectifyNote && (
                      <div className="mt-2 p-2 rounded bg-safe/5 border border-safe/10 flex items-start gap-1.5">
                        <CheckCircle className="h-3 w-3 text-safe shrink-0 mt-0.5" />
                        <span className="text-[11px] text-ink-600">{issue.rectifyNote}</span>
                      </div>
                    )}
                    {issue.evidence.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {issue.evidence.slice(0, 6).map((e) => (
                          <div
                            key={e.id}
                            className={cn(
                              "h-8 w-10 rounded border flex items-center justify-center text-[8px] font-mono",
                              e.type === "inspection" ? "bg-brand-50 border-brand-200 text-brand-600" :
                              e.type === "rectify_before" ? "bg-caution/10 border-caution/30 text-caution" :
                              e.type === "rectify_after" ? "bg-safe/10 border-safe/30 text-safe" :
                              "bg-ink-100 border-ink-300 text-ink-500"
                            )}
                          >
                            {e.type === "inspection" ? "核验" : e.type === "rectify_before" ? "前" : e.type === "rectify_after" ? "后" : "复核"}
                          </div>
                        ))}
                        {issue.evidence.length > 6 && (
                          <span className="text-[10px] text-ink-400 self-center">+{issue.evidence.length - 6}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {detailStore.issues.length === 0 && (
                <div className="text-sm text-ink-400 text-center py-4">该门店在所选时间范围内无问题记录</div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-ink-400 font-mono text-center pt-2">
            {detailStore.store.name} · 门店编码 {detailStore.store.code} · 报告生成 {new Date().toLocaleString("zh-CN")}
          </div>
        </div>
      ) : null}
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
