import type { Issue, RiskLevel, IssueStatus, TaskStatus, Store } from "@/types";

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function daysUntil(iso: string): number {
  const target = new Date(iso);
  const now = new Date("2026-06-18T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(deadline: string, status: IssueStatus): boolean {
  if (status === "closed") return false;
  return daysUntil(deadline) < 0;
}

export const riskLabel: Record<RiskLevel, string> = {
  high: "高风险",
  medium: "中风险",
  low: "低风险",
};

export const riskColor: Record<RiskLevel, string> = {
  high: "bg-risk/10 text-risk border-risk/30",
  medium: "bg-caution/10 text-caution border-caution/30",
  low: "bg-idle/10 text-idle border-idle/30",
};

export const issueStatusLabel: Record<IssueStatus, string> = {
  open: "待整改",
  rectifying: "整改中",
  review: "待复核",
  closed: "已关闭",
};

export const issueStatusColor: Record<IssueStatus, string> = {
  open: "bg-risk/10 text-risk",
  rectifying: "bg-caution/10 text-caution",
  review: "bg-ember-50 text-ember-600",
  closed: "bg-safe/10 text-safe",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  todo: "待开始",
  doing: "进行中",
  review: "待复核",
  done: "已完成",
};

export const taskStatusColor: Record<TaskStatus, string> = {
  todo: "bg-idle/10 text-idle",
  doing: "bg-brand-50 text-brand-600",
  review: "bg-ember-50 text-ember-600",
  done: "bg-safe/10 text-safe",
};

export const categoryLabel: Record<string, string> = {
  config: "包内配置",
  signature: "外签一致性",
  expiry: "有效期",
  storage: "存放位置",
};

export function completionRate(issues: Issue[]): number {
  if (issues.length === 0) return 100;
  const closed = issues.filter((i) => i.status === "closed").length;
  return Math.round((closed / issues.length) * 100);
}

export function riskDistribution(issues: Issue[]) {
  const high = issues.filter((i) => i.riskLevel === "high").length;
  const medium = issues.filter((i) => i.riskLevel === "medium").length;
  const low = issues.filter((i) => i.riskLevel === "low").length;
  return { high, medium, low, total: issues.length };
}

export interface StoreStat {
  store: Store;
  totalIssues: number;
  closedIssues: number;
  completion: number;
  overdue: number;
  highRisk: number;
  compliance: number;
  trend: number;
}

export function storeRanking(
  stores: Store[],
  issues: Issue[]
): StoreStat[] {
  return stores
    .map((store) => {
      const storeIssues = issues.filter((i) => i.storeId === store.id);
      const closed = storeIssues.filter((i) => i.status === "closed").length;
      const overdue = storeIssues.filter(
        (i) => i.status !== "closed" && isOverdue(i.deadline, i.status)
      ).length;
      const highRisk = storeIssues.filter((i) => i.riskLevel === "high").length;
      const completion = completionRate(storeIssues);
      const compliance = storeIssues.length === 0 ? 100 : Math.round((1 - highRisk / Math.max(storeIssues.length, 1)) * 100);
      return {
        store,
        totalIssues: storeIssues.length,
        closedIssues: closed,
        completion,
        overdue,
        highRisk,
        compliance,
        trend: Math.round((Math.sin(store.id.charCodeAt(2)) * 4) ),
      };
    })
    .sort((a, b) => b.compliance - a.compliance || b.completion - a.completion);
}
