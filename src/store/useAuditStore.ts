import { create } from "zustand";
import type {
  Store,
  InstrumentPackage,
  SterilizationRecord,
  InspectionTask,
  Issue,
  CommonProblem,
  VerificationItem,
  CheckCategory,
  RiskLevel,
  IssueStatus,
  TaskStatus,
  PhotoEvidence,
  PhotoEvidenceType,
  ReportExportRecord,
} from "@/types";
import {
  stores as seedStores,
  packages as seedPackages,
  sterilizationRecords as seedRecords,
  tasks as seedTasks,
  issues as seedIssues,
  commonProblems as seedProblems,
  standards,
} from "@/data/seed";

const STORAGE_KEY = "audit-demo-data-v1";
const TODAY = "2026-06-18";
const ACTOR_INSPECTOR = "督导·吴桐";
const ACTOR_REVIEWER = "院感·徐颖";

function pickRisk(category: CheckCategory, type: string): RiskLevel {
  if (category === "signature" && type.includes("签名")) return "high";
  if (category === "expiry") return "high";
  if (category === "signature" && type.includes("参数")) return "high";
  if (category === "storage") return "medium";
  if (category === "config") return "medium";
  return "low";
}

function buildItemsForPackage(pkg: InstrumentPackage): VerificationItem[] {
  const std = standards.find((s) => s.type === pkg.packageType)!;
  const items: VerificationItem[] = [];
  const expired = new Date(pkg.expiresAt) < new Date(TODAY);
  const paramOk = pkg.paramQualified;

  items.push({
    id: `V-${pkg.id}-config`,
    taskId: "",
    packageId: pkg.id,
    category: "config",
    label: "包内配置与标准一致",
    result: pkg.configStandard.length < std.config.length ? "fail" : "pass",
    notes: pkg.configStandard.length < std.config.length ? `缺件: ${std.config.find((c) => !pkg.configStandard.includes(c))}` : undefined,
  });
  items.push({
    id: `V-${pkg.id}-sign`,
    taskId: "",
    packageId: pkg.id,
    category: "signature",
    label: "操作人签名齐全",
    result: !pkg.outerLabel.operatorSign ? "fail" : "pass",
  });
  items.push({
    id: `V-${pkg.id}-label`,
    taskId: "",
    packageId: pkg.id,
    category: "signature",
    label: "外标识信息完整(锅次/日期)",
    result: !pkg.outerLabel.expiryDate || !pkg.outerLabel.cycleNo ? "fail" : "pass",
  });
  items.push({
    id: `V-${pkg.id}-param`,
    taskId: "",
    packageId: pkg.id,
    category: "signature",
    label: "灭菌参数达标(温度/压力/时长)",
    result: !paramOk ? "fail" : "pass",
  });
  items.push({
    id: `V-${pkg.id}-expiry`,
    taskId: "",
    packageId: pkg.id,
    category: "expiry",
    label: "在有效期内",
    result: expired ? "fail" : "pass",
  });
  items.push({
    id: `V-${pkg.id}-storage`,
    taskId: "",
    packageId: pkg.id,
    category: "storage",
    label: "存放位置分区正确",
    result: pkg.storageLocation.includes("错位") ? "fail" : "pass",
  });
  return items;
}

function failToType(item: VerificationItem, pkg: InstrumentPackage): { type: string; description: string } {
  const key = item.id.split("-").pop();
  switch (key) {
    case "config":
      return { type: "包内配置缺件", description: `${pkg.packageName}包内配置缺件，与标准清单不一致。` };
    case "sign":
      return { type: "缺操作人签名", description: `${pkg.packageName}外标识缺失操作人签名，无法追溯灭菌责任人。` };
    case "label":
      return { type: "外标识不全", description: `${pkg.packageName}外标识信息不完整，缺失锅次或日期标注。` };
    case "param":
      return { type: "灭菌参数不达标", description: `${pkg.packageName}灭菌参数(温度/压力/时长)未达标仍归档，存在灭菌失败风险。` };
    case "expiry":
      return { type: "器械包超期", description: `${pkg.packageName}已超过失效日期仍在无菌柜存放。` };
    case "storage":
      return { type: "存放位置错误", description: `${pkg.packageName}存放位置错误，应置于${standards.find((s) => s.type === pkg.packageType)?.storageZone}。` };
    default:
      return { type: "其他问题", description: "核验发现异常。" };
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function buildInitialState() {
  const stored = loadFromStorage<{
    stores: Store[];
    packages: InstrumentPackage[];
    records: SterilizationRecord[];
    tasks: InspectionTask[];
    issues: Issue[];
    problems: CommonProblem[];
    verifications: VerificationItem[];
    reportExports: ReportExportRecord[];
    currentStoreId: string;
    activeTaskId: string | null;
    activePackageId: string | null;
  } | null>(STORAGE_KEY, null);

  if (stored) {
    return { reportExports: [], ...stored };
  }

  return {
    stores: seedStores,
    packages: seedPackages,
    records: seedRecords,
    tasks: seedTasks,
    issues: seedIssues,
    problems: seedProblems,
    verifications: [],
    reportExports: [] as ReportExportRecord[],
    currentStoreId: "ST01",
    activeTaskId: "TK-2026-014",
    activePackageId: null,
  };
}

interface AuditState {
  stores: Store[];
  packages: InstrumentPackage[];
  records: SterilizationRecord[];
  tasks: InspectionTask[];
  issues: Issue[];
  problems: CommonProblem[];
  verifications: VerificationItem[];
  reportExports: ReportExportRecord[];
  currentStoreId: string;
  activeTaskId: string | null;
  activePackageId: string | null;

  setCurrentStore: (id: string) => void;
  setActiveTask: (id: string | null) => void;
  setActivePackage: (id: string | null) => void;

  generateTask: (params: {
    storeId: string;
    planName: string;
    type: string;
    ratio: number;
    inspector: string;
    deadline: string;
  }) => string;

  startTask: (taskId: string) => void;

  ensureVerifications: (taskId: string) => void;
  setItemResult: (itemId: string, result: VerificationItem["result"]) => void;
  setItemPhoto: (itemId: string, photo: string) => void;
  toggleItemResult: (itemId: string) => void;

  submitPackageVerification: (packageId: string, taskId: string) => void;
  checkAndUpdateTaskStatus: (taskId: string) => void;

  addIssueEvidence: (issueId: string, type: PhotoEvidenceType, url: string, caption?: string) => void;
  setIssueDeadline: (issueId: string, deadline: string) => void;
  submitRectification: (issueId: string, note: string, photos?: { beforeUrl?: string; afterUrl?: string }) => void;
  reviewIssue: (issueId: string, pass: boolean, note?: string, photoUrl?: string) => void;
  batchReviewIssues: (issueIds: string[], pass: boolean, note?: string) => void;
  sweepTaskStatuses: () => void;
  recordReportExport: (data: { storeIds: string[]; issueIds: string[]; batchNos: string[]; totalIssues: number; overallRectifyRate: number }) => void;

  resetDemoData: () => void;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const useAuditStore = create<AuditState>((set, get) => {
  const initial = buildInitialState();

  return {
    ...initial,

    setCurrentStore: (id) => {
      set({ currentStoreId: id });
      saveToStorage(STORAGE_KEY, get());
    },
    setActiveTask: (id) => {
      set({ activeTaskId: id });
      saveToStorage(STORAGE_KEY, get());
    },
    setActivePackage: (id) => {
      set({ activePackageId: id });
      saveToStorage(STORAGE_KEY, get());
    },

    generateTask: ({ storeId, planName, type, ratio, inspector, deadline }) => {
      const storePackages = get().packages.filter((p) => p.storeId === storeId);
      const sampleSize = Math.max(1, Math.round(storePackages.length * ratio));
      const seedNum = planName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const rng = mulberry32(seedNum);
      const pool = [...storePackages];
      const picked: InstrumentPackage[] = [];
      while (picked.length < sampleSize && pool.length > 0) {
        const idx = Math.floor(rng() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
      }
      const taskId = `TK-2026-${String(17 + get().tasks.length).padStart(3, "0")}`;
      const task: InspectionTask = {
        id: taskId,
        storeId,
        planName,
        type,
        status: "todo",
        inspector,
        sampleSize,
        deadline,
        createdAt: TODAY,
        packageIds: picked.map((p) => p.id),
      };
      set((s) => ({ tasks: [task, ...s.tasks], activeTaskId: taskId }));
      saveToStorage(STORAGE_KEY, get());
      return taskId;
    },

    startTask: (taskId) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: "doing" as TaskStatus } : t)),
        activeTaskId: taskId,
      }));
      get().ensureVerifications(taskId);
      saveToStorage(STORAGE_KEY, get());
    },

    ensureVerifications: (taskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const existing = get().verifications.filter((v) => v.taskId === taskId);
      const existingPkgIds = new Set(existing.map((v) => v.packageId));
      const newItems: VerificationItem[] = [];
      task.packageIds.forEach((pid) => {
        if (existingPkgIds.has(pid)) return;
        const pkg = get().packages.find((p) => p.id === pid);
        if (!pkg) return;
        const items = buildItemsForPackage(pkg).map((it) => ({ ...it, taskId }));
        newItems.push(...items);
      });
      if (newItems.length > 0) {
        set((s) => ({ verifications: [...s.verifications, ...newItems] }));
        saveToStorage(STORAGE_KEY, get());
      }
    },

    setItemResult: (itemId, result) => {
      set((s) => ({
        verifications: s.verifications.map((v) => (v.id === itemId ? { ...v, result } : v)),
      }));
      saveToStorage(STORAGE_KEY, get());
    },

    setItemPhoto: (itemId, photo) => {
      set((s) => ({
        verifications: s.verifications.map((v) => (v.id === itemId ? { ...v, photoUrl: photo } : v)),
      }));
      saveToStorage(STORAGE_KEY, get());
    },

    toggleItemResult: (itemId) => {
      set((s) => ({
        verifications: s.verifications.map((v) =>
          v.id === itemId
            ? { ...v, result: v.result === "fail" ? "pass" : "fail" }
            : v
        ),
      }));
      saveToStorage(STORAGE_KEY, get());
    },

    submitPackageVerification: (packageId, taskId) => {
      const items = get().verifications.filter(
        (v) => v.packageId === packageId && v.taskId === taskId
      );
      const pkg = get().packages.find((p) => p.id === packageId);
      if (!pkg) return;
      const fails = items.filter((v) => v.result === "fail");

      if (fails.length === 0) {
        set((s) => ({
          packages: s.packages.map((p) => (p.id === packageId ? { ...p, status: "verified" } : p)),
        }));
      } else {
        const existingIssues = get().issues.filter(
          (i) => i.packageId === packageId && i.taskId === taskId
        );
        const existingKeys = new Set(existingIssues.map((i) => `${i.category}:${i.type}`));

        const newIssues: Issue[] = [];
        fails.forEach((f) => {
          const { type, description } = failToType(f, pkg);
          const key = `${f.category}:${type}`;
          if (existingKeys.has(key)) return;

          const risk = pickRisk(f.category, type);
          const evidence: PhotoEvidence[] = [];
          if (f.photoUrl) {
            evidence.push({
              id: uid("E"),
              type: "inspection",
              url: f.photoUrl,
              caption: f.label,
              at: TODAY,
              actor: ACTOR_INSPECTOR,
            });
          }

          const issueId = `IS-2026-${String(20 + get().issues.length + newIssues.length).padStart(3, "0")}`;
          newIssues.push({
            id: issueId,
            taskId,
            packageId,
            storeId: pkg.storeId,
            category: f.category,
            type,
            description,
            riskLevel: risk,
            status: "open",
            deadline: "2026-06-25",
            assignee: get().stores.find((st) => st.id === pkg.storeId)?.manager || "",
            createdAt: TODAY,
            evidence,
            timeline: [
              {
                node: "问题发现",
                at: TODAY,
                actor: ACTOR_INSPECTOR,
                note: "现场核验自动判定",
                photoIds: evidence.map((e) => e.id),
              },
            ],
          });
        });

        set((s) => ({
          issues: [...newIssues, ...s.issues],
          packages: s.packages.map((p) => (p.id === packageId ? { ...p, status: "issue" } : p)),
        }));
      }

      get().checkAndUpdateTaskStatus(taskId);
      saveToStorage(STORAGE_KEY, get());
    },

    checkAndUpdateTaskStatus: (taskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      if (task.status === "todo" || task.status === "done") return;

      const taskIssues = get().issues.filter((i) => i.taskId === taskId);
      const hasUnclosedIssues =
        taskIssues.length > 0 && taskIssues.some((i) => i.status !== "closed");

      if (!hasUnclosedIssues) {
        const resolvedDates = taskIssues
          .map((i) => i.resolvedAt)
          .filter((v): v is string => Boolean(v))
          .sort();
        const completedAt = task.completedAt || resolvedDates.pop() || TODAY;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: "done" as TaskStatus, completedAt }
              : t
          ),
        }));
        return;
      }

      const pkgs = get().packages.filter((p) => task.packageIds.includes(p.id));
      const allSubmitted = pkgs.length === 0 || pkgs.every((p) => p.status !== "pending");
      if (allSubmitted && task.status !== "review") {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "review" as TaskStatus } : t
          ),
        }));
      }
    },

    addIssueEvidence: (issueId, type, url, caption) => {
      const evidence: PhotoEvidence = {
        id: uid("E"),
        type,
        url,
        caption,
        at: TODAY,
        actor: ACTOR_INSPECTOR,
      };
      set((s) => ({
        issues: s.issues.map((i) =>
          i.id === issueId ? { ...i, evidence: [...i.evidence, evidence] } : i
        ),
      }));
      saveToStorage(STORAGE_KEY, get());
    },

    setIssueDeadline: (issueId, deadline) => {
      set((s) => ({
        issues: s.issues.map((i) => (i.id === issueId ? { ...i, deadline } : i)),
      }));
      saveToStorage(STORAGE_KEY, get());
    },

    submitRectification: (issueId, note, photos) => {
      const newEvidence: PhotoEvidence[] = [];
      if (photos?.beforeUrl) {
        newEvidence.push({
          id: uid("E"),
          type: "rectify_before",
          url: photos.beforeUrl,
          caption: "整改前照片",
          at: TODAY,
          actor: get().issues.find((i) => i.id === issueId)?.assignee || "",
        });
      }
      if (photos?.afterUrl) {
        newEvidence.push({
          id: uid("E"),
          type: "rectify_after",
          url: photos.afterUrl,
          caption: "整改后照片",
          at: TODAY,
          actor: get().issues.find((i) => i.id === issueId)?.assignee || "",
        });
      }

      set((s) => ({
        issues: s.issues.map((i) => {
          if (i.id !== issueId) return i;
          const assignee = i.assignee;
          return {
            ...i,
            status: "review" as IssueStatus,
            rectifyNote: note,
            evidence: [...i.evidence, ...newEvidence],
            timeline: [
              ...i.timeline,
              {
                node: "整改提交",
                at: TODAY,
                actor: assignee,
                note,
                photoIds: newEvidence.map((e) => e.id),
              },
            ],
          };
        }),
      }));
      saveToStorage(STORAGE_KEY, get());
    },

    reviewIssue: (issueId, pass, note, photoUrl) => {
      const newEvidence: PhotoEvidence[] = [];
      if (photoUrl) {
        newEvidence.push({
          id: uid("E"),
          type: "review",
          url: photoUrl,
          caption: "复核照片",
          at: TODAY,
          actor: ACTOR_REVIEWER,
        });
      }

      set((s) => ({
        issues: s.issues.map((i) => {
          if (i.id !== issueId) return i;
          if (pass) {
            return {
              ...i,
              status: "closed" as IssueStatus,
              resolvedAt: TODAY,
              evidence: [...i.evidence, ...newEvidence],
              timeline: [
                ...i.timeline,
                {
                  node: "复核通过",
                  at: TODAY,
                  actor: ACTOR_REVIEWER,
                  note,
                  photoIds: newEvidence.map((e) => e.id),
                },
                { node: "关闭", at: TODAY, actor: "系统" },
              ],
            };
          }
          return {
            ...i,
            status: "rectifying" as IssueStatus,
            evidence: [...i.evidence, ...newEvidence],
            timeline: [
              ...i.timeline,
              {
                node: "复核退回",
                at: TODAY,
                actor: ACTOR_REVIEWER,
                note: note || "整改不到位，请重新处理",
                photoIds: newEvidence.map((e) => e.id),
              },
            ],
          };
        }),
      }));

      const issue = get().issues.find((i) => i.id === issueId);
      if (issue) {
        get().checkAndUpdateTaskStatus(issue.taskId);
      }
      saveToStorage(STORAGE_KEY, get());
    },

    batchReviewIssues: (issueIds, pass, note) => {
      const affectedTaskIds = new Set<string>();

      set((s) => ({
        issues: s.issues.map((i) => {
          if (!issueIds.includes(i.id)) return i;
          if (i.status !== "review") return i;
          affectedTaskIds.add(i.taskId);
          if (pass) {
            return {
              ...i,
              status: "closed" as IssueStatus,
              resolvedAt: TODAY,
              timeline: [
                ...i.timeline,
                {
                  node: "复核通过",
                  at: TODAY,
                  actor: ACTOR_REVIEWER,
                  note: note || "批量复核通过",
                },
                { node: "关闭", at: TODAY, actor: "系统" },
              ],
            };
          }
          return {
            ...i,
            status: "rectifying" as IssueStatus,
            timeline: [
              ...i.timeline,
              {
                node: "复核退回",
                at: TODAY,
                actor: ACTOR_REVIEWER,
                note: note || "批量退回，整改不到位",
              },
            ],
          };
        }),
      }));

      affectedTaskIds.forEach((tid) => get().checkAndUpdateTaskStatus(tid));
      saveToStorage(STORAGE_KEY, get());
    },

    sweepTaskStatuses: () => {
      const activeTaskIds = get()
        .tasks.filter((t) => t.status !== "todo" && t.status !== "done")
        .map((t) => t.id);
      activeTaskIds.forEach((tid) => get().checkAndUpdateTaskStatus(tid));

      set((s) => ({
        tasks: s.tasks.map((t) => {
          if (t.status !== "done" || t.completedAt) return t;
          const tIssues = s.issues.filter((i) => i.taskId === t.id);
          const lastResolved = tIssues
            .map((i) => i.resolvedAt)
            .filter((v): v is string => Boolean(v))
            .sort()
            .pop();
          return { ...t, completedAt: lastResolved || t.deadline };
        }),
      }));
      saveToStorage(STORAGE_KEY, get());
    },

    recordReportExport: ({ storeIds, issueIds, batchNos, totalIssues, overallRectifyRate }) => {
      const record: ReportExportRecord = {
        id: uid("RPT"),
        exportedAt: TODAY,
        storeIds,
        issueIds,
        batchNos,
        summary: { totalIssues, overallRectifyRate },
      };
      set((s) => ({ reportExports: [record, ...s.reportExports].slice(0, 50) }));
      saveToStorage(STORAGE_KEY, get());
    },

    resetDemoData: () => {
      const freshState = {
        stores: seedStores,
        packages: seedPackages,
        records: seedRecords,
        tasks: seedTasks,
        issues: seedIssues,
        problems: seedProblems,
        verifications: [] as VerificationItem[],
        reportExports: [] as ReportExportRecord[],
        currentStoreId: "ST01",
        activeTaskId: "TK-2026-014",
        activePackageId: null as string | null,
      };
      set(freshState);
      saveToStorage(STORAGE_KEY, freshState);
    },
  };
});
