import { useMemo } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { RiskBadge, IssueStatusBadge } from "@/components/ui/Badge";
import {
  Thermometer, ClipboardList, CheckSquare, Wrench, Gavel, FileText,
  CheckCircle2, XCircle, ArrowRight, Package as PackageIcon, Store as StoreIcon,
  AlertTriangle, ExternalLink,
} from "lucide-react";

interface BatchTraceChainProps {
  packageId: string;
  onOpenIssue?: (issueId: string) => void;
}

export function BatchTraceChain({ packageId, onOpenIssue }: BatchTraceChainProps) {
  const packages = useAuditStore((s) => s.packages);
  const records = useAuditStore((s) => s.records);
  const tasks = useAuditStore((s) => s.tasks);
  const stores = useAuditStore((s) => s.stores);
  const verifications = useAuditStore((s) => s.verifications);
  const issues = useAuditStore((s) => s.issues);
  const reportExports = useAuditStore((s) => s.reportExports);

  const pkg = packages.find((p) => p.id === packageId);
  const record = records.find((r) => r.packageId === packageId);
  const store = stores.find((s) => s.id === pkg?.storeId);
  const task = useMemo(
    () => tasks.find((t) => pkg && t.packageIds.includes(pkg.id)),
    [tasks, pkg]
  );
  const pkgVerifications = useMemo(
    () => verifications.filter((v) => v.packageId === packageId),
    [verifications, packageId]
  );
  const pkgIssues = useMemo(
    () => issues.filter((i) => i.packageId === packageId),
    [issues, packageId]
  );
  const referencedReports = useMemo(
    () => reportExports.filter((r) => pkg && r.batchNos.includes(pkg.batchNo)),
    [reportExports, pkg]
  );

  if (!pkg) {
    return <div className="text-center text-sm text-ink-400 py-12">未找到批次信息</div>;
  }

  const failedVerifications = pkgVerifications.filter((v) => v.result === "fail");
  const reviewNodes = pkgIssues.flatMap((i) =>
    i.timeline
      .filter((n) => n.node === "复核通过" || n.node === "复核退回")
      .map((n) => ({ ...n, issueId: i.id, issueType: i.type }))
  );
  const allClosed = pkgIssues.length > 0 && pkgIssues.every((i) => i.status === "closed");

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-line">
        <PackageIcon className="h-4 w-4 text-brand-500" />
        <div>
          <h3 className="font-display text-base font-bold text-ink-900">批次闭环链路</h3>
          <p className="font-mono text-[11px] text-ink-400">{pkg.batchNo} · {pkg.packageName}</p>
        </div>
        {allClosed && (
          <span className="ml-auto chip bg-safe/10 text-safe border border-safe/20 text-[10px]">
            <CheckCircle2 className="h-3 w-3" /> 全链路闭环
          </span>
        )}
      </div>

      <ChainNode
        step={1}
        icon={Thermometer}
        title="灭菌归档"
        tone="brand"
        done={!!record}
      >
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <KV label="灭菌器" value={pkg.sterilizerId} />
          <KV label="锅次" value={pkg.cycleNo} />
          <KV label="灭菌日期" value={formatDate(pkg.sterilizedAt)} />
          <KV label="失效日期" value={formatDate(pkg.expiresAt)} />
          <KV label="操作员" value={record?.operator || "—"} />
          <KV label="参数达标" value={pkg.paramQualified ? "合格" : "不合格"} tone={pkg.paramQualified ? "safe" : "risk"} />
        </div>
        {record && (
          <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono">
            <span className="chip bg-surfaceSunken text-ink-600 border border-line">{record.temperature}℃</span>
            <span className="chip bg-surfaceSunken text-ink-600 border border-line">{record.pressure}kPa</span>
            <span className="chip bg-surfaceSunken text-ink-600 border border-line">{record.duration}min</span>
          </div>
        )}
      </ChainNode>

      <ChainNode
        step={2}
        icon={ClipboardList}
        title="抽检任务"
        tone="brand"
        done={!!task}
      >
        {task ? (
          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-ink-800">{task.planName}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <KV label="任务编号" value={task.id} />
              <KV label="类型" value={task.type} />
              <KV label="督导" value={task.inspector} />
              <KV label="截止" value={formatDate(task.deadline)} />
              {task.completedAt && <KV label="完成日期" value={formatDate(task.completedAt)} tone="safe" />}
            </div>
          </div>
        ) : (
          <EmptyHint text="该批次未关联抽检任务" />
        )}
      </ChainNode>

      <ChainNode
        step={3}
        icon={CheckSquare}
        title="现场核验"
        tone={failedVerifications.length > 0 ? "risk" : "safe"}
        done={pkgVerifications.length > 0}
      >
        {pkgVerifications.length > 0 ? (
          <div className="space-y-1">
            {pkgVerifications.map((v) => (
              <div key={v.id} className="flex items-center gap-2 text-[11px]">
                {v.result === "pass" ? (
                  <CheckCircle2 className="h-3 w-3 text-safe shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-risk shrink-0" />
                )}
                <span className="text-ink-700">{v.label}</span>
                {v.notes && <span className="text-ink-400 truncate">· {v.notes}</span>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint text="暂无核验记录（可能为历史批次）" />
        )}
      </ChainNode>

      <ChainNode
        step={4}
        icon={Wrench}
        title="问题整改"
        tone={pkgIssues.length > 0 ? "ember" : "safe"}
        done={pkgIssues.length > 0}
      >
        {pkgIssues.length > 0 ? (
          <div className="space-y-1.5">
            {pkgIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => onOpenIssue?.(issue.id)}
                className="w-full flex items-center gap-2 p-1.5 rounded border border-line bg-surfaceAlt hover:border-brand-300 hover:bg-brand-50/40 transition-colors group text-left"
              >
                <span className="font-mono text-[10px] text-ink-400 shrink-0">{issue.id}</span>
                <RiskBadge level={issue.riskLevel} />
                <span className="flex-1 min-w-0 text-xs text-ink-700 truncate">{issue.type}</span>
                <IssueStatusBadge status={issue.status} />
                {onOpenIssue && <ExternalLink className="h-3 w-3 text-ink-300 group-hover:text-brand-500 shrink-0" />}
              </button>
            ))}
          </div>
        ) : (
          <EmptyHint text="该批次无问题记录" tone="safe" />
        )}
      </ChainNode>

      <ChainNode
        step={5}
        icon={Gavel}
        title="复核结论"
        tone={reviewNodes.length > 0 ? "brand" : "ink"}
        done={reviewNodes.length > 0}
      >
        {reviewNodes.length > 0 ? (
          <div className="space-y-1.5">
            {reviewNodes.map((n, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded border text-[11px]",
                  n.node === "复核通过"
                    ? "border-safe/20 bg-safe/5"
                    : "border-risk/20 bg-risk/5"
                )}
              >
                {n.node === "复核通过" ? (
                  <CheckCircle2 className="h-3 w-3 text-safe shrink-0" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-risk shrink-0" />
                )}
                <span className={cn("font-semibold", n.node === "复核通过" ? "text-safe" : "text-risk")}>
                  {n.node}
                </span>
                <span className="text-ink-400 font-mono">{formatDate(n.at).slice(5)}</span>
                <span className="text-ink-400">· {n.actor}</span>
                {n.note && <span className="text-ink-500 truncate">· {n.note}</span>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint text="暂无复核结论" />
        )}
      </ChainNode>

      <ChainNode
        step={6}
        icon={FileText}
        title="报告引用"
        tone={referencedReports.length > 0 ? "brand" : "ink"}
        done={referencedReports.length > 0}
        last
      >
        {referencedReports.length > 0 ? (
          <div className="space-y-1.5">
            <div className="text-[11px] text-ink-600">
              该批次已被 <span className="font-mono font-bold text-brand-600">{referencedReports.length}</span> 份稽核报告引用
            </div>
            {referencedReports.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-2 p-1.5 rounded border border-line bg-surfaceAlt text-[11px]">
                <FileText className="h-3 w-3 text-brand-500 shrink-0" />
                <span className="font-mono text-ink-500">{r.id}</span>
                <span className="text-ink-400 font-mono">{formatDate(r.exportedAt).slice(5)}</span>
                <span className="ml-auto text-ink-400">
                  {r.summary.totalIssues}问题 · {r.summary.overallRectifyRate}%闭环
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint text="该批次尚未被报告引用" />
        )}
      </ChainNode>
    </div>
  );
}

function ChainNode({
  step,
  icon: Icon,
  title,
  tone,
  done,
  last,
  children,
}: {
  step: number;
  icon: typeof Thermometer;
  title: string;
  tone: "brand" | "safe" | "risk" | "ember" | "ink";
  done: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  const toneMap = {
    brand: "bg-brand-500 text-white",
    safe: "bg-safe text-white",
    risk: "bg-risk text-white",
    ember: "bg-ember-500 text-white",
    ink: "bg-ink-400 text-white",
  };
  return (
    <div className="relative pl-9">
      {!last && <div className="absolute left-[14px] top-9 bottom-0 w-px bg-line" />}
      <div className={cn("absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center", toneMap[tone])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="pb-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] text-ink-400">0{step}</span>
          <span className="text-sm font-semibold text-ink-800">{title}</span>
          {done && <CheckCircle2 className="h-3 w-3 text-safe" />}
        </div>
        {children}
      </div>
    </div>
  );
}

function KV({ label, value, tone }: { label: string; value: string; tone?: "safe" | "risk" }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-ink-400">{label}</span>
      <span className={cn("font-mono font-semibold", tone === "safe" ? "text-safe" : tone === "risk" ? "text-risk" : "text-ink-700")}>
        {value}
      </span>
    </div>
  );
}

function EmptyHint({ text, tone }: { text: string; tone?: "safe" }) {
  return (
    <div className={cn("text-[11px] flex items-center gap-1", tone === "safe" ? "text-safe" : "text-ink-400")}>
      <ArrowRight className="h-3 w-3" />
      {text}
    </div>
  );
}
