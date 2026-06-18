import type { LucideIcon } from "lucide-react";
import { ClipboardList, ScanLine, Wrench, BarChart3 } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { path: "/tasks", label: "抽检任务", sublabel: "Sampling", icon: ClipboardList },
  { path: "/verify", label: "现场核验", sublabel: "Verify", icon: ScanLine },
  { path: "/rectify", label: "问题整改", sublabel: "Rectify", icon: Wrench },
  { path: "/stats", label: "统计分析", sublabel: "Insight", icon: BarChart3 },
];
