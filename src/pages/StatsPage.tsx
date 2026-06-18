import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StoreRanking } from "./stats/StoreRanking";
import { ChartsPanel } from "./stats/ChartsPanel";
import { ProblemLibrary } from "./stats/ProblemLibrary";
import { ReviewEfficiencyPanel } from "./stats/ReviewEfficiencyPanel";
import { ReportModal } from "./stats/ReportModal";
import { useAuditStore } from "@/store/useAuditStore";
import { completionRate, riskDistribution, isOverdue } from "@/lib/format";
import { FileWarning, CheckCircle2, AlertCircle, ShieldAlert, FileDown } from "lucide-react";

export default function StatsPage() {
  const issues = useAuditStore((s) => s.issues);
  const stores = useAuditStore((s) => s.stores);
  const [reportOpen, setReportOpen] = useState(false);

  const dist = riskDistribution(issues);
  const rate = completionRate(issues);
  const overdue = issues.filter((i) => i.status !== "closed" && isOverdue(i.deadline, i.status)).length;
  const overdueRate = issues.length > 0 ? Math.round((overdue / issues.length) * 100) : 0;
  const highRate = dist.total > 0 ? Math.round((dist.high / dist.total) * 100) : 0;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1500px] mx-auto p-6">
        <PageHeader
          eyebrow="Window 04 · 统计分析"
          title="门店排名与质量洞察"
          description="沉淀稽核数据，输出门店排名、整改完成率与常见问题库，驱动下一轮抽查。"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportOpen(true)}
                className="btn-primary text-xs"
              >
                <FileDown className="h-3.5 w-3.5" /> 门店稽核报告
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surfaceAlt border border-line">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                <span className="font-mono text-[11px] text-ink-600">覆盖 {stores.length} 家门店</span>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard label="累计问题数" value={dist.total} icon={FileWarning} tone="brand" hint="全部稽核周期" delay={0} />
          <StatCard label="整改完成率" value={rate} suffix="%" icon={CheckCircle2} tone="safe" hint="已闭环占比" delay={60} />
          <StatCard label="超期率" value={overdueRate} suffix="%" icon={AlertCircle} tone="caution" hint={`${overdue} 项超期待办`} delay={120} />
          <StatCard label="高风险占比" value={highRate} suffix="%" icon={ShieldAlert} tone="risk" hint={`${dist.high} 项高风险`} delay={180} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-5">
          <div className="xl:col-span-5 min-h-[420px]">
            <StoreRanking />
          </div>
          <div className="xl:col-span-7 min-h-[420px]">
            <ChartsPanel />
          </div>
        </div>

        <div className="mb-5">
          <ReviewEfficiencyPanel />
        </div>

        <div className="min-h-[360px]">
          <ProblemLibrary />
        </div>
      </div>
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
