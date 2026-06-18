import { useAuditStore } from "@/store/useAuditStore";
import { CheckRow } from "./CheckRow";
import { RiskBadge } from "@/components/ui/Badge";
import { standards } from "@/data/seed";
import { formatDate } from "@/lib/format";
import { categoryLabel } from "@/lib/format";
import { Thermometer, Gauge, Timer, UserCheck, CalendarCheck, MapPin, ClipboardCheck, ShieldAlert, Send, PackageCheck, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckCategory, RiskLevel } from "@/types";

const categoryOrder: CheckCategory[] = ["config", "signature", "expiry", "storage"];
const categoryIcons: Record<CheckCategory, typeof ClipboardCheck> = {
  config: ClipboardCheck,
  signature: UserCheck,
  expiry: CalendarCheck,
  storage: MapPin,
};

function computeRisk(fails: { category: CheckCategory; id: string }[]): { level: RiskLevel; reasons: string[] } {
  if (fails.length === 0) return { level: "low", reasons: [] };
  const reasons: string[] = [];
  let high = false;
  let medium = false;
  fails.forEach((f) => {
    const suffix = f.id.split("-").pop();
    if (suffix === "sign") { reasons.push("缺操作人签名"); high = true; }
    if (suffix === "param") { reasons.push("灭菌参数不达标"); high = true; }
    if (suffix === "expiry") { reasons.push("器械包超期"); high = true; }
    if (suffix === "storage") { reasons.push("存放位置错误"); medium = true; }
    if (suffix === "config") { reasons.push("包内配置缺件"); medium = true; }
    if (suffix === "label") { reasons.push("外标识不全"); }
  });
  const level: RiskLevel = high ? "high" : medium ? "medium" : "low";
  return { level, reasons: [...new Set(reasons)] };
}

export function VerificationWorkbench() {
  const packages = useAuditStore((s) => s.packages);
  const records = useAuditStore((s) => s.records);
  const tasks = useAuditStore((s) => s.tasks);
  const activeTaskId = useAuditStore((s) => s.activeTaskId);
  const activePackageId = useAuditStore((s) => s.activePackageId);
  const setActivePackage = useAuditStore((s) => s.setActivePackage);
  const verifications = useAuditStore((s) => s.verifications);
  const submitPackageVerification = useAuditStore((s) => s.submitPackageVerification);

  const task = tasks.find((t) => t.id === activeTaskId);
  const pkg = packages.find((p) => p.id === activePackageId);

  if (!task) {
    return <EmptyState message="请先在「抽检任务」窗口开始一个任务，再进入现场核验。" />;
  }
  if (!pkg) {
    return <EmptyState message="扫码或从左侧队列选择一个器械包批次开始核验。" />;
  }

  const record = records.find((r) => r.packageId === pkg.id);
  const std = standards.find((s) => s.type === pkg.packageType)!;
  const items = verifications.filter((v) => v.packageId === pkg.id && v.taskId === task.id);
  const fails = items.filter((v) => v.result === "fail").map((v) => ({ category: v.category, id: v.id }));
  const { level, reasons } = computeRisk(fails);
  const allChecked = items.every((v) => v.result !== "pending");
  const hasFail = fails.length > 0;

  const handleSubmit = () => {
    submitPackageVerification(pkg.id, task.id);
    const remaining = packages.filter((p) => task.packageIds.includes(p.id) && p.status === "pending" && p.id !== pkg.id);
    setActivePackage(remaining[0]?.id || null);
  };

  return (
    <div className="flex-1 overflow-auto h-full">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4 animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="label-mono">核验中</span>
              <span className="font-mono text-xs text-ink-400">·</span>
              <span className="font-mono text-xs text-brand-600 font-semibold">{task.planName}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink-900">{pkg.packageName}</h2>
            <div className="font-mono text-sm text-ink-600 mt-0.5">{pkg.batchNo}</div>
          </div>
          <div className="text-right">
            <div className="label-mono mb-1">存放位置</div>
            <div className={cn("font-mono text-sm font-semibold flex items-center gap-1.5 justify-end", pkg.storageLocation.includes("错位") ? "text-risk" : "text-ink-700")}>
              <MapPin className="h-3.5 w-3.5" /> {pkg.storageLocation}
            </div>
            <div className="font-mono text-[11px] text-ink-400 mt-1">标准区: {std.storageZone}</div>
          </div>
        </div>

        <div className="panel p-4 mb-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <PackageCheck className="h-4 w-4 text-brand-500" />
            <h3 className="font-display text-sm font-bold text-ink-900">灭菌记录核对</h3>
            <span className="font-mono text-[11px] text-ink-400">{pkg.cycleNo}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <RecordField icon={Thermometer} label="灭菌温度" value={record ? `${record.temperature}℃` : "—"} alert={record?.paramQualified === false} />
            <RecordField icon={Gauge} label="灭菌压力" value={record ? `${record.pressure}MPa` : "—"} alert={record?.paramQualified === false} />
            <RecordField icon={Timer} label="灭菌时长" value={record ? `${record.duration}min` : "—"} alert={record?.paramQualified === false} />
            <RecordField icon={UserCheck} label="操作人" value={record?.operator || "—"} alert={record?.signatureMissing} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-line-faint">
            <RecordField icon={CalendarCheck} label="灭菌日期" value={formatDate(pkg.sterilizedAt)} />
            <RecordField icon={CalendarCheck} label="失效日期" value={formatDate(pkg.expiresAt)} alert={new Date(pkg.expiresAt) < new Date("2026-06-18")} />
            <RecordField icon={ClipboardCheck} label="锅次/标识" value={pkg.outerLabel.cycleNo ? "齐全" : "缺失"} alert={!pkg.outerLabel.cycleNo} />
          </div>
        </div>

        <div className="mb-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2 mb-2.5">
            <ClipboardCheck className="h-4 w-4 text-brand-500" />
            <h3 className="font-display text-sm font-bold text-ink-900">现场核查清单</h3>
            <span className="label-mono">逐项核对</span>
          </div>
          <div className="space-y-3">
            {categoryOrder.map((cat) => {
              const catItems = items.filter((v) => v.category === cat);
              if (catItems.length === 0) return null;
              const Icon = categoryIcons[cat];
              const catFails = catItems.filter((v) => v.result === "fail").length;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <Icon className="h-3.5 w-3.5 text-ink-500" />
                    <span className="text-xs font-bold text-ink-700">{categoryLabel[cat]}</span>
                    {catFails > 0 && <span className="chip bg-risk/10 text-risk">{catFails}项不合格</span>}
                  </div>
                  <div className="space-y-1.5">
                    {catItems.map((item) => <CheckRow key={item.id} item={item} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn(
          "panel p-4 mb-4 animate-fade-up border-l-4",
          level === "high" ? "border-l-risk" : level === "medium" ? "border-l-caution" : hasFail ? "border-l-idle" : "border-l-safe"
        )} style={{ animationDelay: "180ms" }}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-10 w-10 rounded-md flex items-center justify-center shrink-0",
              level === "high" ? "bg-risk/10 text-risk" : level === "medium" ? "bg-caution/10 text-caution" : "bg-safe/10 text-safe"
            )}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-sm font-bold text-ink-900">风险自动判定</h3>
                <RiskBadge level={level} pulse={level === "high" && hasFail} />
              </div>
              {hasFail ? (
                <>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    检出 <span className="font-mono font-bold text-risk">{fails.length}</span> 项不合格，系统将自动生成整改清单并设置复查截止日。
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {reasons.map((r) => (
                      <span key={r} className="chip bg-surfaceSunken text-ink-700 border border-line">
                        <FileWarning className="h-3 w-3" /> {r}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-ink-600">所有核查项均通过，可归档为合格批次。</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pb-6 animate-fade-up" style={{ animationDelay: "240ms" }}>
          <div className="text-xs text-ink-400">
            {allChecked ? (
              <span className="flex items-center gap-1.5 text-safe"><ClipboardCheck className="h-3.5 w-3.5" /> 所有核查项已完成</span>
            ) : (
              <span className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" /> 请完成全部核查项后提交</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allChecked}
            className={cn("btn-primary px-5", !allChecked && "opacity-50 cursor-not-allowed")}
          >
            <Send className="h-4 w-4" />
            {hasFail ? "提交并生成整改" : "归档合格"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordField({ icon: Icon, label, value, alert }: { icon: typeof Thermometer; label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", alert ? "bg-risk/10 text-risk" : "bg-surfaceSunken text-ink-500")}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="label-mono">{label}</div>
        <div className={cn("text-sm font-semibold font-mono truncate", alert ? "text-risk" : "text-ink-800")}>{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="h-16 w-16 rounded-xl bg-surfaceSunken flex items-center justify-center mx-auto mb-3">
          <ClipboardCheck className="h-7 w-7 text-ink-300" />
        </div>
        <p className="text-sm text-ink-400">{message}</p>
      </div>
    </div>
  );
}
