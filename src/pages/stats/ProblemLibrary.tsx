import { useAuditStore } from "@/store/useAuditStore";
import { categoryLabel } from "@/lib/format";
import { Lightbulb, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryColor: Record<string, string> = {
  config: "bg-brand-50 text-brand-600 border-brand-100",
  signature: "bg-risk/10 text-risk border-risk/20",
  expiry: "bg-ember-50 text-ember-600 border-ember-500/20",
  storage: "bg-caution/10 text-caution border-caution/20",
};

export function ProblemLibrary() {
  const problems = useAuditStore((s) => s.problems);
  const sorted = [...problems].sort((a, b) => b.frequency - a.frequency);
  const maxFreq = Math.max(...sorted.map((p) => p.frequency));

  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-brand-500" />
          <h3 className="font-display text-sm font-bold text-ink-900">常见问题库</h3>
        </div>
        <span className="label-mono">按频次沉淀</span>
      </div>

      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {sorted.map((p, idx) => (
          <div
            key={p.id}
            className="p-3 rounded-md border border-line bg-surfaceAlt hover:border-line-strong transition-colors animate-fade-up"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={cn("chip border", categoryColor[p.category])}>{categoryLabel[p.category]}</span>
                <span className="font-mono text-[10px] text-ink-400">{p.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-surfaceSunken overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", p.frequency / maxFreq > 0.6 ? "bg-risk" : p.frequency / maxFreq > 0.3 ? "bg-caution" : "bg-idle")}
                    style={{ width: `${(p.frequency / maxFreq) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-ink-700 tabular-nums w-8">{p.frequency}</span>
              </div>
            </div>
            <p className="text-sm font-medium text-ink-800 mb-1.5 leading-tight">{p.description}</p>
            <div className="flex items-start gap-1.5 p-2 rounded-md bg-brand-50/50 border border-brand-100/50">
              <Lightbulb className="h-3.5 w-3.5 text-ember-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink-600 leading-relaxed">{p.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
