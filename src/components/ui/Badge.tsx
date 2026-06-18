import { cn } from "@/lib/utils";
import type { RiskLevel, IssueStatus, TaskStatus } from "@/types";
import { riskColor, riskLabel, issueStatusColor, issueStatusLabel, taskStatusColor, taskStatusLabel } from "@/lib/format";

export function RiskBadge({ level, pulse = false }: { level: RiskLevel; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "chip border",
        riskColor[level],
        pulse && level === "high" && "animate-pulse-risk"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {riskLabel[level]}
    </span>
  );
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <span className={cn("chip", issueStatusColor[status])}>{issueStatusLabel[status]}</span>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={cn("chip", taskStatusColor[status])}>{taskStatusLabel[status]}</span>;
}

export function CountBadge({ count, tone = "brand" }: { count: number; tone?: "brand" | "risk" | "caution" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    risk: "bg-risk/10 text-risk",
    caution: "bg-caution/10 text-caution",
  };
  return (
    <span className={cn("chip tabular-nums", tones[tone])}>{count}</span>
  );
}
