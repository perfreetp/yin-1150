import { useState } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { standards } from "@/data/seed";
import { Modal } from "@/components/ui/Modal";
import { RiskBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { Dices, Store as StoreIcon, Calendar, User, Tag, Check, ArrowRight, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InstrumentPackage } from "@/types";

const planTypes = ["月度例行", "专项核查", "季度复核", "整改复查", "新规核查"];

export function PlanGenerator() {
  const stores = useAuditStore((s) => s.stores);
  const packages = useAuditStore((s) => s.packages);
  const generateTask = useAuditStore((s) => s.generateTask);
  const navigate = useNavigate();

  const [storeId, setStoreId] = useState("ST01");
  const [planName, setPlanName] = useState("6月抽查计划");
  const [type, setType] = useState("月度例行");
  const [ratio, setRatio] = useState(50);
  const [deadline, setDeadline] = useState("2026-06-25");
  const [inspector, setInspector] = useState("督导·吴桐");
  const [preview, setPreview] = useState<InstrumentPackage[] | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const storePackages = packages.filter((p) => p.storeId === storeId);
  const sampleSize = Math.max(1, Math.round(storePackages.length * (ratio / 100)));

  const handleGenerate = () => {
    const taskId = generateTask({
      storeId,
      planName: planName || `${type}计划`,
      type,
      ratio: ratio / 100,
      inspector,
      deadline,
    });
    const task = useAuditStore.getState().tasks.find((t) => t.id === taskId);
    const picked = task
      ? task.packageIds.map((id) => packages.find((p) => p.id === id)!).filter(Boolean)
      : [];
    setPreview(picked);
    setCreatedId(taskId);
  };

  const defectsInPreview = (pkg: InstrumentPackage) => {
    const std = standards.find((s) => s.type === pkg.packageType)!;
    const issues: string[] = [];
    if (!pkg.outerLabel.operatorSign) issues.push("缺签名");
    if (!pkg.outerLabel.expiryDate) issues.push("标识不全");
    if (pkg.configStandard.length < std.config.length) issues.push("配置缺件");
    if (pkg.storageLocation.includes("错位")) issues.push("存放错位");
    if (new Date(pkg.expiresAt) < new Date("2026-06-18")) issues.push("已超期");
    return issues;
  };

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dices className="h-4 w-4 text-brand-500" />
            <h3 className="font-display text-base font-bold text-ink-900">抽查计划生成器</h3>
          </div>
          <p className="text-xs text-ink-400">选择门店并配置抽样规则，系统将随机抽取器械包批次</p>
        </div>
        <span className="label-mono">Step 1 / 2</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <div>
            <div className="label-mono mb-2 flex items-center gap-1.5">
              <StoreIcon className="h-3 w-3" /> 选择门店
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {stores.map((s) => {
                const count = packages.filter((p) => p.storeId === s.id).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStoreId(s.id)}
                    className={cn(
                      "text-left p-2.5 rounded-md border transition-all",
                      storeId === s.id
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/30"
                        : "border-line bg-surfaceAlt hover:border-line-strong"
                    )}
                  >
                    <div className="text-sm font-semibold text-ink-800 truncate">{s.name.replace("雅悦口腔·", "")}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-[10px] text-ink-400">{s.code}</span>
                      <span className="font-mono text-[10px] text-brand-600">{count}批次</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="label-mono mb-2">抽样比例</div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={10}
                max={100}
                step={10}
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
                className="flex-1 accent-brand-500"
              />
              <div className="flex items-baseline gap-1 w-20 justify-end">
                <span className="font-display text-2xl font-bold text-brand-600 tabular-nums">{ratio}</span>
                <span className="text-xs text-ink-400 font-semibold">%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
              <span>可选批次 <span className="font-mono text-ink-600 font-semibold">{storePackages.length}</span></span>
              <ArrowRight className="h-3 w-3" />
              <span>随机抽取 <span className="font-mono text-brand-600 font-bold">{sampleSize}</span> 批次</span>
            </div>
          </div>

          <div>
            <div className="label-mono mb-2">器械包类型范围</div>
            <div className="flex flex-wrap gap-1.5">
              {standards.map((s) => (
                <span key={s.type} className="chip bg-surfaceSunken text-ink-600 border border-line">
                  {s.name}
                </span>
              ))}
              <span className="chip bg-brand-50 text-brand-600 border border-brand-200">全类型</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-l border-line pl-5">
          <div>
            <label className="label-mono mb-1.5 flex items-center gap-1.5"><Tag className="h-3 w-3" /> 计划名称</label>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
            />
          </div>
          <div>
            <label className="label-mono mb-1.5">抽查类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              {planTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-mono mb-1.5 flex items-center gap-1"><User className="h-3 w-3" /> 督导员</label>
              <input
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <div>
              <label className="label-mono mb-1.5 flex items-center gap-1"><Calendar className="h-3 w-3" /> 截止日</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>
          <button onClick={handleGenerate} className="btn-primary w-full mt-1">
            <Dices className="h-4 w-4" /> 随机抽取并生成计划
          </button>
          <p className="text-[11px] text-ink-400 leading-relaxed">
            系统将基于随机种子从门店批次库中抽取 <span className="font-mono text-brand-600 font-semibold">{sampleSize}</span> 个器械包，生成后可在现场核验窗口执行。
          </p>
        </div>
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="随机抽样结果"
        subtitle={createdId ? `任务编号 ${createdId} · 已生成 ${preview?.length} 批次待检` : ""}
        size="xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPreview(null)}>留在此页</button>
            <button className="btn-primary" onClick={() => { setPreview(null); navigate("/verify"); }}>
              <Check className="h-4 w-4" /> 前往现场核验
            </button>
          </>
        }
      >
        <div className="flex items-center gap-2 mb-3 p-3 rounded-md bg-brand-50 border border-brand-100">
          <FlaskConical className="h-4 w-4 text-brand-600" />
          <span className="text-xs text-brand-700 font-semibold">
            抽样已基于随机种子完成，下列批次进入待检队列。系统将自动比对灭菌记录与外签配置。
          </span>
        </div>
        <div className="overflow-hidden border border-line rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-surfaceSunken">
              <tr className="text-left">
                <th className="px-3 py-2 label-mono">批次号</th>
                <th className="px-3 py-2 label-mono">器械包</th>
                <th className="px-3 py-2 label-mono">灭菌锅次</th>
                <th className="px-3 py-2 label-mono">灭菌日期</th>
                <th className="px-3 py-2 label-mono">失效日期</th>
                <th className="px-3 py-2 label-mono">预判风险</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {preview?.map((pkg) => {
                const defects = defectsInPreview(pkg);
                const risk = defects.some((d) => d.includes("签名") || d.includes("超期")) ? "high" : defects.length > 0 ? "medium" : "low";
                return (
                  <tr key={pkg.id} className="hover:bg-surfaceAlt">
                    <td className="px-3 py-2 font-mono text-xs text-ink-700">{pkg.batchNo}</td>
                    <td className="px-3 py-2 text-ink-800">{pkg.packageName}</td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-600">{pkg.cycleNo}</td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-600">{formatDate(pkg.sterilizedAt)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-600">{formatDate(pkg.expiresAt)}</td>
                    <td className="px-3 py-2">
                      {defects.length === 0 ? (
                        <span className="chip bg-safe/10 text-safe">无明显异常</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <RiskBadge level={risk as "high" | "medium" | "low"} />
                          <span className="text-[11px] text-ink-400">{defects.join("、")}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
