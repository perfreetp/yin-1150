import { useState } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { cn } from "@/lib/utils";
import { ScanLine, Search, Package as PackageIcon, CheckCircle2, AlertCircle, CircleDot } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { PackageStatus } from "@/types";

const statusIcon: Record<PackageStatus, typeof CircleDot> = {
  pending: CircleDot,
  verified: CheckCircle2,
  issue: AlertCircle,
};

const statusColor: Record<PackageStatus, string> = {
  pending: "text-idle",
  verified: "text-safe",
  issue: "text-risk",
};

export function PackageQueue() {
  const tasks = useAuditStore((s) => s.tasks);
  const packages = useAuditStore((s) => s.packages);
  const activeTaskId = useAuditStore((s) => s.activeTaskId);
  const setActiveTask = useAuditStore((s) => s.setActiveTask);
  const activePackageId = useAuditStore((s) => s.activePackageId);
  const setActivePackage = useAuditStore((s) => s.setActivePackage);
  const ensureVerifications = useAuditStore((s) => s.ensureVerifications);

  const [scanInput, setScanInput] = useState("");
  const [flash, setFlash] = useState(false);

  const activeTasks = tasks.filter((t) => t.status === "doing" || t.status === "todo");
  const task = tasks.find((t) => t.id === activeTaskId) || activeTasks[0];
  const taskPackages = task ? packages.filter((p) => task.packageIds.includes(p.id)) : [];

  const handleScan = () => {
    if (!scanInput.trim() || !task) return;
    const found = packages.find((p) => p.batchNo.toLowerCase() === scanInput.trim().toLowerCase() && task.packageIds.includes(p.id));
    if (found) {
      setActivePackage(found.id);
      setFlash(true);
      setTimeout(() => setFlash(false), 900);
    }
    setScanInput("");
  };

  const handleSelectTask = (id: string) => {
    setActiveTask(id);
    ensureVerifications(id);
    setActivePackage(null);
  };

  const verifiedCount = taskPackages.filter((p) => p.status !== "pending").length;

  return (
    <div className="w-72 shrink-0 border-r border-line bg-surface flex flex-col h-full">
      <div className="p-3 border-b border-line">
        <div className="label-mono mb-2">当前任务</div>
        <select
          value={task?.id || ""}
          onChange={(e) => handleSelectTask(e.target.value)}
          className="w-full px-2.5 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {activeTasks.length === 0 && <option>无进行中任务</option>}
          {activeTasks.map((t) => (
            <option key={t.id} value={t.id}>{t.planName}</option>
          ))}
        </select>
        {task && (
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-ink-400">核验进度</span>
            <span className="font-mono font-semibold text-brand-600 tabular-nums">{verifiedCount}/{taskPackages.length}</span>
          </div>
        )}
      </div>

      <div className={cn("p-3 border-b border-line transition-colors", flash && "animate-scan-flash bg-brand-50")}>
        <div className="label-mono mb-2 flex items-center gap-1.5">
          <ScanLine className="h-3 w-3 text-brand-500" /> 扫码 / 输入批次号
        </div>
        <div className="relative">
          <input
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="如 EXTRACT-ST01-002"
            className="w-full pl-8 pr-3 py-2 font-mono text-xs rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
        </div>
        <button onClick={handleScan} className="btn-primary w-full mt-2 text-xs py-1.5">
          <ScanLine className="h-3.5 w-3.5" /> 核对灭菌记录
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="label-mono px-1 mb-2">待检批次队列</div>
        <div className="space-y-1.5">
          {taskPackages.map((pkg) => {
            const Icon = statusIcon[pkg.status];
            return (
              <button
                key={pkg.id}
                onClick={() => setActivePackage(pkg.id)}
                className={cn(
                  "w-full text-left p-2.5 rounded-md border transition-all",
                  activePackageId === pkg.id
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/20"
                    : "border-line bg-surfaceAlt hover:border-line-strong"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", statusColor[pkg.status])} />
                  <span className="font-mono text-[11px] font-semibold text-ink-700 truncate">{pkg.batchNo}</span>
                </div>
                <div className="flex items-center justify-between pl-5">
                  <span className="text-[11px] text-ink-400">{pkg.packageName}</span>
                  <span className="font-mono text-[10px] text-ink-400">{formatDate(pkg.sterilizedAt).slice(5)}</span>
                </div>
              </button>
            );
          })}
          {taskPackages.length === 0 && (
            <div className="text-center text-xs text-ink-400 py-8">
              <PackageIcon className="h-8 w-8 mx-auto mb-2 text-ink-300" />
              暂无待检批次
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
