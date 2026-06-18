import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { IssueList } from "./rectify/IssueList";
import { IssueDetail } from "./rectify/IssueDetail";
import { useAuditStore } from "@/store/useAuditStore";
import { completionRate } from "@/lib/format";
import { AlertTriangle, Wrench, Eye, CheckCircle2, TrendingUp } from "lucide-react";

export default function RectifyPage() {
  const issues = useAuditStore((s) => s.issues);
  const [selectedId, setSelectedId] = useState<string | null>(
    issues.find((i) => i.status !== "closed")?.id || issues[0]?.id || null
  );

  const open = issues.filter((i) => i.status === "open").length;
  const rectifying = issues.filter((i) => i.status === "rectifying").length;
  const review = issues.filter((i) => i.status === "review").length;
  const closed = issues.filter((i) => i.status === "closed").length;
  const rate = completionRate(issues);

  const stats = [
    { label: "待整改", value: open, icon: AlertTriangle, tone: "text-risk bg-risk/10" },
    { label: "整改中", value: rectifying, icon: Wrench, tone: "text-caution bg-caution/10" },
    { label: "待复核", value: review, icon: Eye, tone: "text-ember-600 bg-ember-50" },
    { label: "已关闭", value: closed, icon: CheckCircle2, tone: "text-safe bg-safe/10" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-6 pt-6 pb-3">
        <PageHeader
          eyebrow="Window 03 · 问题整改"
          title="整改清单与复核闭环"
          description="不合格项自动汇入整改清单，设置复查截止日，追踪整改完成率并复核确认。"
        />
        <div className="flex items-center gap-3">
          {stats.map((s) => (
            <div key={s.label} className="panel px-3.5 py-2.5 flex items-center gap-2.5 flex-1">
              <span className={`h-7 w-7 rounded-md flex items-center justify-center ${s.tone}`}>
                <s.icon className="h-3.5 w-3.5" />
              </span>
              <div>
                <div className="label-mono">{s.label}</div>
                <div className="font-display text-lg font-bold text-ink-800 tabular-nums leading-none">{s.value}</div>
              </div>
            </div>
          ))}
          <div className="panel px-4 py-2.5 flex items-center gap-2.5 bg-brand-50 border-brand-100">
            <span className="h-7 w-7 rounded-md flex items-center justify-center bg-brand-500 text-white">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="label-mono">整改完成率</div>
              <div className="font-display text-lg font-bold text-brand-600 tabular-nums leading-none">{rate}%</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex min-h-0 border-t border-line">
        <IssueList selectedId={selectedId} onSelect={setSelectedId} />
        <IssueDetail issueId={selectedId} />
      </div>
    </div>
  );
}
