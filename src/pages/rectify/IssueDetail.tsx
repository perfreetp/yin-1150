import { useState } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { RiskBadge, IssueStatusBadge } from "@/components/ui/Badge";
import { formatDate, daysUntil, isOverdue, categoryLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CalendarClock, MessageSquare, Check, RotateCcw, Clock, Package, Store as StoreIcon,
  Camera, Flag, Image as ImageIcon, Thermometer, Gauge, Timer, ChefHat,
  ListChecks, Tag, CheckCircle2, XCircle, FileText
} from "lucide-react";
import type { PhotoEvidence, PhotoEvidenceType } from "@/types";

interface IssueDetailProps {
  issueId: string | null;
}

const nodeIcons: Record<string, typeof Clock> = {
  "问题发现": Flag,
  "整改中": Clock,
  "整改提交": Check,
  "待复核": Clock,
  "复核通过": Check,
  "复核退回": RotateCcw,
  "关闭": Check,
};

const evidenceTypeLabel: Record<PhotoEvidenceType, string> = {
  inspection: "现场核验",
  rectify_before: "整改前",
  rectify_after: "整改后",
  review: "复核照片",
};

const evidenceTypeColor: Record<PhotoEvidenceType, string> = {
  inspection: "bg-brand-500/10 text-brand-700 border-brand-500/20",
  rectify_before: "bg-caution/10 text-caution border-caution/30",
  rectify_after: "bg-safe/10 text-safe border-safe/30",
  review: "bg-ink-200 text-ink-600 border-ink-300",
};

function PhotoThumb({ photo, size = "md" }: { photo: PhotoEvidence; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-10 w-14" : size === "lg" ? "h-20 w-28" : "h-14 w-20";
  return (
    <div className={cn("relative rounded-md overflow-hidden border border-line shrink-0", sizeClass)}>
      <div className="absolute inset-0 bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center">
        <ImageIcon className="h-5 w-5 text-ink-400" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-ink-900/60 px-1.5 py-0.5">
        <span className="text-[9px] text-white font-mono truncate block">{photo.caption || photo.type}</span>
      </div>
    </div>
  );
}

export function IssueDetail({ issueId }: IssueDetailProps) {
  const issues = useAuditStore((s) => s.issues);
  const packages = useAuditStore((s) => s.packages);
  const stores = useAuditStore((s) => s.stores);
  const tasks = useAuditStore((s) => s.tasks);
  const records = useAuditStore((s) => s.records);
  const setIssueDeadline = useAuditStore((s) => s.setIssueDeadline);
  const submitRectification = useAuditStore((s) => s.submitRectification);
  const reviewIssue = useAuditStore((s) => s.reviewIssue);

  const [note, setNote] = useState("");
  const [deadline, setDeadline] = useState("");
  const [beforePhoto, setBeforePhoto] = useState("");
  const [afterPhoto, setAfterPhoto] = useState("");

  const issue = issues.find((i) => i.id === issueId);

  if (!issue) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center animate-fade-in">
          <div className="h-16 w-16 rounded-xl bg-surfaceSunken flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="h-7 w-7 text-ink-300" />
          </div>
          <p className="text-sm text-ink-400">从左侧选择一条问题，查看整改详情与追踪时间线</p>
        </div>
      </div>
    );
  }

  const pkg = packages.find((p) => p.id === issue.packageId);
  const store = stores.find((s) => s.id === issue.storeId);
  const task = tasks.find((t) => t.id === issue.taskId);
  const overdue = isOverdue(issue.deadline, issue.status);
  const due = daysUntil(issue.deadline);

  const photoMap = new Map(issue.evidence.map((e) => [e.id, e]));

  const handleSubmitRectify = () => {
    if (!note.trim()) return;
    const photos: { beforeUrl?: string; afterUrl?: string } = {};
    if (beforePhoto) photos.beforeUrl = beforePhoto;
    if (afterPhoto) photos.afterUrl = afterPhoto;
    submitRectification(issue.id, note, Object.keys(photos).length > 0 ? photos : undefined);
    setNote("");
    setBeforePhoto("");
    setAfterPhoto("");
  };

  const handleSimulatePhoto = (setter: (v: string) => void, label: string) => {
    const url = `photo_${Date.now()}_${label}`;
    setter(url);
  };

  return (
    <div className="flex-1 overflow-auto h-full">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-start justify-between mb-5 animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs text-ink-400">{issue.id}</span>
              <RiskBadge level={issue.riskLevel} pulse={issue.riskLevel === "high" && issue.status !== "closed"} />
              <IssueStatusBadge status={issue.status} />
            </div>
            <h2 className="font-display text-xl font-bold text-ink-900">{issue.type}</h2>
          </div>
          <div className={cn(
            "px-3 py-2 rounded-md text-right border",
            overdue ? "bg-risk/5 border-risk/30" : "bg-surfaceAlt border-line"
          )}>
            <div className="label-mono flex items-center gap-1 justify-end mb-0.5">
              <CalendarClock className="h-3 w-3" /> 复查截止日
            </div>
            <div className={cn("font-mono text-sm font-bold", overdue ? "text-risk" : "text-ink-800")}>
              {formatDate(issue.deadline)}
            </div>
            <div className={cn("text-[11px] font-mono", overdue ? "text-risk" : due <= 2 ? "text-caution" : "text-ink-400")}>
              {issue.status === "closed" ? "已闭环" : overdue ? `已超期${Math.abs(due)}天` : `剩余${due}天`}
            </div>
          </div>
        </div>

        <div className="panel p-4 mb-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="label-mono mb-2">问题描述</div>
          <p className="text-sm text-ink-700 leading-relaxed mb-3">{issue.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-line-faint">
            <InfoField icon={StoreIcon} label="门店" value={store?.name.replace("雅悦口腔·", "") || "—"} />
            <InfoField icon={Package} label="批次号" value={pkg?.batchNo || "—"} mono />
            <InfoField icon={Flag} label="问题分类" value={categoryLabel[issue.category]} />
            <InfoField icon={Clock} label="发现时间" value={formatDate(issue.createdAt)} mono />
          </div>
          {issue.rectifyNote && (
            <div className="mt-3 p-3 rounded-md bg-safe/5 border border-safe/20">
              <div className="label-mono text-safe mb-1">整改说明</div>
              <p className="text-xs text-ink-700 leading-relaxed">{issue.rectifyNote}</p>
            </div>
          )}
        </div>

        {pkg && (
          <div className="panel p-4 mb-4 animate-fade-up" style={{ animationDelay: "90ms" }}>
            <div className="label-mono mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-brand-500" />
              关联批次追溯信息
              <span className="font-mono text-ink-400 font-normal ml-1">· {pkg.batchNo}</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-ink-600 mb-2 flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-ember-500" /> 灭菌参数
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <ParamTile icon={Thermometer} label="温度" value={`${records.find((r) => r.packageId === pkg.id)?.temperature ?? "—"}℃`} />
                  <ParamTile icon={Gauge} label="压力" value={`${records.find((r) => r.packageId === pkg.id)?.pressure ?? "—"}kPa`} />
                  <ParamTile icon={Timer} label="时长" value={`${records.find((r) => r.packageId === pkg.id)?.duration ?? "—"}min`} />
                  <ParamTile
                    icon={pkg.paramQualified ? CheckCircle2 : XCircle}
                    label="参数达标"
                    value={pkg.paramQualified ? "合格" : "不合格"}
                    tone={pkg.paramQualified ? "text-safe" : "text-risk"}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink-400 font-mono">
                  <span>锅次：{pkg.cycleNo}</span>
                  <span>灭菌器：{pkg.sterilizerId}</span>
                  <span>操作员：{records.find((r) => r.packageId === pkg.id)?.operator || "—"}</span>
                  <span>灭菌日期：{formatDate(pkg.sterilizedAt)}</span>
                  <span>失效日期：{formatDate(pkg.expiresAt)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-line-faint">
                <div className="text-[11px] font-semibold text-ink-600 mb-2 flex items-center gap-1">
                  <ListChecks className="h-3 w-3 text-brand-500" /> 包内配置
                  <span className="text-ink-400 font-normal">({pkg.configStandard.length}件)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.configStandard.map((item, idx) => (
                    <span key={idx} className="chip bg-surfaceSunken text-ink-600 border border-line text-[10px]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-line-faint">
                <div className="text-[11px] font-semibold text-ink-600 mb-2 flex items-center gap-1">
                  <Tag className="h-3 w-3 text-ember-500" /> 外签信息
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <LabelCheck label="锅次号" ok={pkg.outerLabel.cycleNo} />
                  <LabelCheck label="灭菌日期" ok={pkg.outerLabel.sterilizedDate} />
                  <LabelCheck label="失效日期" ok={pkg.outerLabel.expiryDate} />
                  <LabelCheck label="操作人签名" ok={pkg.outerLabel.operatorSign} />
                </div>
              </div>
            </div>
          </div>
        )}

        {issue.evidence.length > 0 && (
          <div className="panel p-4 mb-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="label-mono flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-ink-400" />
                证据照片档案
                <span className="text-ink-400 font-normal">({issue.evidence.length}张)</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {issue.evidence.map((photo) => (
                <div key={photo.id} className="group relative">
                  <PhotoThumb photo={photo} size="md" />
                  <div className={cn(
                    "absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border",
                    evidenceTypeColor[photo.type]
                  )}>
                    {evidenceTypeLabel[photo.type]}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-ink-400 font-mono">
              所有证据随问题档案永久留存，复核通过后仍可追溯
            </div>
          </div>
        )}

        <div className="panel p-4 mb-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="label-mono mb-3">整改与复核操作</div>

          {issue.status === "open" && (
            <>
              <p className="text-xs text-ink-400 mb-2">门店尚未提交整改，可调整复查截止日：</p>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="date"
                  value={deadline || issue.deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="px-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  onClick={() => deadline && setIssueDeadline(issue.id, deadline)}
                  className="btn-subtle text-xs"
                >
                  <CalendarClock className="h-3.5 w-3.5" /> 更新截止日
                </button>
              </div>
            </>
          )}

          {(issue.status === "open" || issue.status === "rectifying") && (
            <>
              <div className="label-mono mb-1.5">提交整改说明</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="描述整改措施、已补充的记录或培训情况…"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-md border border-line bg-surfaceAlt focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] text-ink-400">整改前照片</div>
                  <div className="flex items-center gap-2">
                    {beforePhoto ? (
                      <div className="relative">
                        <PhotoThumb photo={{ id: "preview-before", type: "rectify_before", url: beforePhoto, caption: "整改前", at: "", actor: "" }} size="sm" />
                        <button
                          onClick={() => setBeforePhoto("")}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-risk text-white text-[10px] flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSimulatePhoto(setBeforePhoto, "before")}
                        className="btn-subtle text-xs h-10 w-14 flex-col"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="text-[10px] text-ink-400">点击模拟拍摄</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] text-ink-400">整改后照片</div>
                  <div className="flex items-center gap-2">
                    {afterPhoto ? (
                      <div className="relative">
                        <PhotoThumb photo={{ id: "preview-after", type: "rectify_after", url: afterPhoto, caption: "整改后", at: "", actor: "" }} size="sm" />
                        <button
                          onClick={() => setAfterPhoto("")}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-risk text-white text-[10px] flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSimulatePhoto(setAfterPhoto, "after")}
                        className="btn-subtle text-xs h-10 w-14 flex-col"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="text-[10px] text-ink-400">点击模拟拍摄</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line-faint">
                <button
                  onClick={handleSubmitRectify}
                  disabled={!note.trim()}
                  className={cn("btn-primary text-xs ml-auto", !note.trim() && "opacity-50 cursor-not-allowed")}
                >
                  <Check className="h-3.5 w-3.5" /> 提交整改待复核
                </button>
              </div>
            </>
          )}

          {issue.status === "review" && (
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-md bg-ember-50 border border-ember-500/20">
                <p className="text-xs text-ember-600 font-semibold">门店已提交整改，请院感负责人复核</p>
                <p className="text-[11px] text-ink-500 mt-0.5">{issue.rectifyNote}</p>
              </div>
              <button onClick={() => reviewIssue(issue.id, false)} className="btn-ghost text-xs text-caution border-caution/30 hover:bg-caution/5">
                <RotateCcw className="h-3.5 w-3.5" /> 退回
              </button>
              <button onClick={() => reviewIssue(issue.id, true)} className="btn-primary text-xs bg-safe hover:bg-safe">
                <Check className="h-3.5 w-3.5" /> 复核通过
              </button>
            </div>
          )}

          {issue.status === "closed" && (
            <div className="p-3 rounded-md bg-safe/5 border border-safe/20 flex items-center gap-2">
              <Check className="h-4 w-4 text-safe" />
              <span className="text-xs text-safe font-semibold">该问题已于 {formatDate(issue.resolvedAt || "")} 复核通过并关闭</span>
            </div>
          )}
        </div>

        <div className="panel p-4 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="label-mono mb-4">追踪时间线</div>
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-line" />
            {issue.timeline.map((node, idx) => {
              const Icon = nodeIcons[node.node] || Clock;
              const isLast = idx === issue.timeline.length - 1;
              const nodePhotos = node.photoIds?.map((pid) => photoMap.get(pid)).filter(Boolean) as PhotoEvidence[] || [];
              return (
                <div key={idx} className="relative pb-5 last:pb-0 animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className={cn(
                    "absolute -left-6 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center",
                    isLast && issue.status === "closed" ? "bg-safe border-safe" : isLast ? "bg-brand-500 border-brand-500" : "bg-surface border-line-strong"
                  )}>
                    <Icon className="h-2 w-2 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-ink-800">{node.node}</span>
                    <span className="font-mono text-[11px] text-ink-400">{formatDate(node.at)}</span>
                  </div>
                  <div className="text-[11px] text-ink-400 mt-0.5">{node.actor}{node.note && ` · ${node.note}`}</div>
                  {nodePhotos.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {nodePhotos.map((p) => (
                        <PhotoThumb key={p.id} photo={p} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {task && (
            <div className="mt-4 pt-3 border-t border-line-faint flex items-center justify-between text-[11px] text-ink-400">
              <span>关联任务：<span className="font-mono text-ink-600">{task.id}</span> · {task.planName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon: Icon, label, value, mono }: { icon: typeof Clock; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-ink-400 shrink-0" />
      <div className="min-w-0">
        <div className="label-mono">{label}</div>
        <div className={cn("text-xs font-semibold text-ink-700 truncate", mono && "font-mono")}>{value}</div>
      </div>
    </div>
  );
}

function ParamTile({ icon: Icon, label, value, tone }: { icon: typeof Thermometer; label: string; value: string; tone?: string }) {
  return (
    <div className="panel-sunken p-2">
      <div className="flex items-center gap-1 mb-1">
        <Icon className={cn("h-3 w-3", tone || "text-ink-400")} />
        <span className="label-mono text-ink-400">{label}</span>
      </div>
      <div className={cn("font-display text-sm font-bold tabular-nums", tone || "text-ink-800")}>{value}</div>
    </div>
  );
}

function LabelCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1.5 rounded-md border",
      ok ? "bg-safe/5 border-safe/20" : "bg-risk/5 border-risk/20"
    )}>
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-safe shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-risk shrink-0" />
      )}
      <span className={cn("text-[11px] font-medium", ok ? "text-safe" : "text-risk")}>{label}</span>
    </div>
  );
}
