import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  tone?: "brand" | "risk" | "caution" | "safe" | "idle";
  hint?: string;
  delay?: number;
}

const toneStyles: Record<string, { iconBg: string; iconText: string; accent: string }> = {
  brand: { iconBg: "bg-brand-50", iconText: "text-brand-500", accent: "text-brand-500" },
  risk: { iconBg: "bg-risk/10", iconText: "text-risk", accent: "text-risk" },
  caution: { iconBg: "bg-caution/10", iconText: "text-caution", accent: "text-caution" },
  safe: { iconBg: "bg-safe/10", iconText: "text-safe", accent: "text-safe" },
  idle: { iconBg: "bg-idle/10", iconText: "text-idle", accent: "text-idle" },
};

export function StatCard({ label, value, suffix, icon: Icon, tone = "brand", hint, delay = 0 }: StatCardProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const duration = 800;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setDisplay(Math.round(value * eased));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [value]);

  const t = toneStyles[tone];

  return (
    <div
      ref={ref}
      className="panel p-4 flex flex-col gap-3 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="label-mono">{label}</span>
        <span className={cn("h-8 w-8 rounded-md flex items-center justify-center", t.iconBg)}>
          <Icon className={cn("h-4 w-4", t.iconText)} strokeWidth={2} />
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-display text-3xl font-bold tabular-nums", t.accent)}>
          {display}
        </span>
        {suffix && <span className="text-sm font-semibold text-ink-400">{suffix}</span>}
      </div>
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
    </div>
  );
}
