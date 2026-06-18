import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PlanGenerator } from "./tasks/PlanGenerator";
import { TaskKanban } from "./tasks/TaskKanban";
import { useAuditStore } from "@/store/useAuditStore";
import { ClipboardList, Package, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function TasksPage() {
  const tasks = useAuditStore((s) => s.tasks);
  const packages = useAuditStore((s) => s.packages);
  const issues = useAuditStore((s) => s.issues);

  const todoCount = tasks.filter((t) => t.status === "todo" || t.status === "doing").length;
  const sampledCount = tasks.reduce((sum, t) => sum + t.sampleSize, 0);
  const openIssues = issues.filter((i) => i.status !== "closed").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1500px] mx-auto p-6">
        <PageHeader
          eyebrow="Window 01 · 抽检任务"
          title="抽查计划与任务看板"
          description="按门店生成抽查计划，随机抽取器械包批次，驱动现场核验与整改闭环。"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="待执行任务" value={todoCount} icon={ClipboardList} tone="brand" hint="待开始 + 进行中" delay={0} />
          <StatCard label="累计抽样批次" value={sampledCount} icon={Package} tone="idle" hint="全部抽查计划" delay={60} />
          <StatCard label="待整改问题" value={openIssues} icon={AlertTriangle} tone="risk" hint="未关闭问题数" delay={120} />
          <StatCard label="已完成任务" value={doneCount} icon={CheckCircle2} tone="safe" hint="本季稽核归档" delay={180} />
        </div>

        <div className="mb-6">
          <PlanGenerator />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-ink-900">任务看板</h3>
              <span className="label-mono">按状态流转</span>
            </div>
            <span className="font-mono text-xs text-ink-400">{packages.length} 批次在库</span>
          </div>
          <TaskKanban />
        </div>
      </div>
    </div>
  );
}
