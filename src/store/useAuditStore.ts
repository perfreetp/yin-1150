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
  const now = "2026-06-18";
  const expired = new Date(pkg.expiresAt) < new Date(now);
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
  switch (item.id.split("-").pop()) {
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

interface AuditState {
  stores: Store[];
  packages: InstrumentPackage[];
  records: SterilizationRecord[];
  tasks: InspectionTask[];
  issues: Issue[];
  problems: CommonProblem[];
  verifications: VerificationItem[];
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

  setIssueDeadline: (issueId: string, deadline: string) => void;
  submitRectification: (issueId: string, note: string) => void;
  reviewIssue: (issueId: string, pass: boolean) => void;
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

export const useAuditStore = create<AuditState>((set, get) => ({
  stores: seedStores,
  packages: seedPackages,
  records: seedRecords,
  tasks: seedTasks,
  issues: seedIssues,
  problems: seedProblems,
  verifications: [],
  currentStoreId: "ST01",
  activeTaskId: "TK-2026-014",
  activePackageId: null,

  setCurrentStore: (id) => set({ currentStoreId: id }),
  setActiveTask: (id) => set({ activeTaskId: id }),
  setActivePackage: (id) => set({ activePackageId: id }),

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
      createdAt: "2026-06-18",
      packageIds: picked.map((p) => p.id),
    };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return taskId;
  },

  startTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: "doing" as TaskStatus } : t)),
      activeTaskId: taskId,
    }));
    get().ensureVerifications(taskId);
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
    }
  },

  setItemResult: (itemId, result) =>
    set((s) => ({
      verifications: s.verifications.map((v) => (v.id === itemId ? { ...v, result } : v)),
    })),

  setItemPhoto: (itemId, photo) =>
    set((s) => ({
      verifications: s.verifications.map((v) => (v.id === itemId ? { ...v, photoUrl: photo } : v)),
    })),

  toggleItemResult: (itemId) =>
    set((s) => ({
      verifications: s.verifications.map((v) =>
        v.id === itemId
          ? { ...v, result: v.result === "fail" ? "pass" : "fail" }
          : v
      ),
    })),

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
      return;
    }
    const newIssues: Issue[] = fails.map((f, i) => {
      const { type, description } = failToType(f, pkg);
      const risk = pickRisk(f.category, type);
      return {
        id: `IS-2026-${String(32 + get().issues.length + i).padStart(3, "0")}`,
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
        createdAt: "2026-06-18",
        timeline: [
          { node: "问题发现", at: "2026-06-18", actor: "督导·吴桐", note: "现场核验自动判定" },
        ],
      };
    });
    set((s) => ({
      issues: [...newIssues, ...s.issues],
      packages: s.packages.map((p) => (p.id === packageId ? { ...p, status: "issue" } : p)),
    }));
  },

  setIssueDeadline: (issueId, deadline) =>
    set((s) => ({
      issues: s.issues.map((i) => (i.id === issueId ? { ...i, deadline } : i)),
    })),

  submitRectification: (issueId, note) =>
    set((s) => ({
      issues: s.issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              status: "review" as IssueStatus,
              rectifyNote: note,
              timeline: [
                ...i.timeline,
                { node: "整改提交", at: "2026-06-18", actor: i.assignee, note },
              ],
            }
          : i
      ),
    })),

  reviewIssue: (issueId, pass) =>
    set((s) => ({
      issues: s.issues.map((i) => {
        if (i.id !== issueId) return i;
        if (pass) {
          return {
            ...i,
            status: "closed" as IssueStatus,
            resolvedAt: "2026-06-18",
            timeline: [
              ...i.timeline,
              { node: "复核通过", at: "2026-06-18", actor: "院感·徐颖" },
              { node: "关闭", at: "2026-06-18", actor: "系统" },
            ],
          };
        }
        return {
          ...i,
          status: "rectifying" as IssueStatus,
          timeline: [
            ...i.timeline,
            { node: "复核退回", at: "2026-06-18", actor: "院感·徐颖", note: "整改不到位，请重新处理" },
          ],
        };
      }),
    })),
}));
