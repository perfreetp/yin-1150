import { useAuditStore } from "@/store/useAuditStore";
import { TaskCard } from "./TaskCard";
import { taskStatusLabel } from "@/lib/format";
import type { TaskStatus } from "@/types";

const columns: { status: TaskStatus; accent: string; dot: string }[] = [
  { status: "todo", accent: "text-idle", dot: "bg-idle" },
  { status: "doing", accent: "text-brand-600", dot: "bg-brand-500" },
  { status: "review", accent: "text-ember-600", dot: "bg-ember-500" },
  { status: "done", accent: "text-safe", dot: "bg-safe" },
];

export function TaskKanban() {
  const tasks = useAuditStore((s) => s.tasks);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1 sticky top-0 z-10 bg-canvas/90 backdrop-blur py-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className={`text-sm font-bold ${col.accent}`}>{taskStatusLabel[col.status]}</span>
              </div>
              <span className="font-mono text-xs text-ink-400 tabular-nums">{colTasks.length}</span>
            </div>
            <div className="flex flex-col gap-3 min-h-[80px]">
              {colTasks.length === 0 ? (
                <div className="panel border-dashed p-4 text-center text-xs text-ink-400">
                  暂无任务
                </div>
              ) : (
                colTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
