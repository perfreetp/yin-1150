import { useNavigate } from "react-router-dom";
import { useAuditStore } from "@/store/useAuditStore";
import { TaskStatusBadge } from "@/components/ui/Badge";
import { formatDate, daysUntil } from "@/lib/format";
import { Calendar, Package, User, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InspectionTask } from "@/types";

export function TaskCard({ task }: { task: InspectionTask }) {
  const navigate = useNavigate();
  const stores = useAuditStore((s) => s.stores);
  const packages = useAuditStore((s) => s.packages);
  const verifications = useAuditStore((s) => s.verifications);
  const startTask = useAuditStore((s) => s.startTask);
  const setActiveTask = useAuditStore((s) => s.setActiveTask);

  const store = stores.find((s) => s.id === task.storeId);
  const taskPackages = packages.filter((p) => task.packageIds.includes(p.id));
  const verifiedCount = taskPackages.filter((p) => p.status !== "pending").length;
  const progress = taskPackages.length > 0 ? Math.round((verifiedCount / taskPackages.length) * 100) : 0;
  const due = daysUntil(task.deadline);
  const isOverdue = due < 0 && task.status !== "done";

  const handleAction = () => {
    if (task.status === "todo") {
      startTask(task.id);
    } else {
      setActiveTask(task.id);
      useAuditStore.getState().ensureVerifications(task.id);
    }
    navigate("/verify");
  };

  return (
    <div className="panel p-3.5 hover:shadow-panelMd transition-shadow animate-fade-up">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink-900 leading-tight truncate">{task.planName}</div>
          <div className="text-[11px] text-ink-400 mt-0.5">{store?.name.replace("雅悦口腔·", "")} · {task.type}</div>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <div className="panel-sunken p-2">
          <div className="label-mono mb-0.5 flex items-center gap-1"><Package className="h-2.5 w-2.5" />抽样</div>
          <div className="font-display text-base font-bold text-ink-800 tabular-nums">{task.sampleSize}</div>
        </div>
        <div className="panel-sunken p-2">
          <div className="label-mono mb-0.5 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />剩余</div>
          <div className={cn("font-display text-base font-bold tabular-nums", isOverdue ? "text-risk" : due <= 2 ? "text-caution" : "text-ink-800")}>
            {task.status === "done" ? "已完成" : isOverdue ? `超期${Math.abs(due)}天` : `${due}天`}
          </div>
        </div>
      </div>

      {task.status !== "todo" && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="label-mono">核验进度</span>
            <span className="font-mono text-[11px] font-semibold text-ink-600 tabular-nums">{verifiedCount}/{taskPackages.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surfaceSunken overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", task.status === "done" ? "bg-safe" : "bg-brand-500")}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-line-faint">
        <div className="flex items-center gap-2 text-[11px] text-ink-400">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(task.deadline)}</span>
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.inspector.replace("督导·", "")}</span>
        </div>
        {task.status !== "done" && (
          <button onClick={handleAction} className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
            {task.status === "todo" ? "开始核验" : "继续核验"}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
