import type {
  Store,
  PackageStandard,
  InstrumentPackage,
  SterilizationRecord,
  InspectionTask,
  Issue,
  CommonProblem,
} from "@/types";

export const stores: Store[] = [
  { id: "ST01", name: "雅悦口腔·静安旗舰门诊", code: "SH-JA", region: "华东", manager: "周敏" },
  { id: "ST02", name: "雅悦口腔·浦东联洋门诊", code: "SH-PD", region: "华东", manager: "陈浩" },
  { id: "ST03", name: "雅悦口腔·杭州西湖门诊", code: "HZ-XH", region: "华东", manager: "李婷" },
  { id: "ST04", name: "雅悦口腔·广州天河门诊", code: "GZ-TH", region: "华南", manager: "黄磊" },
  { id: "ST05", name: "雅悦口腔·北京朝阳门诊", code: "BJ-CY", region: "华北", manager: "王芳" },
];

export const standards: PackageStandard[] = [
  {
    type: "EXTRACT",
    name: "拔牙器械包",
    config: ["牙龈分离器", "骨膜分离器", "拔牙钳", "刮匙", "持针器", "缝合剪"],
    storageZone: "无菌区·A柜",
  },
  {
    type: "IMPLANT",
    name: "种植器械包",
    config: ["种植机头", "钻头套装", "定位器", "测深尺", "冲洗管", "扳手"],
    storageZone: "无菌区·B柜",
  },
  {
    type: "RESTORE",
    name: "修复器械包",
    config: ["印模托盘", "调刀", "雕刻刀", "咬合纸夹", "抛光轮"],
    storageZone: "无菌区·A柜",
  },
  {
    type: "SCALING",
    name: "洁治器械包",
    config: ["洁治器", "刮治器", "探针", "口镜", "吸唾管"],
    storageZone: "清洁区·C柜",
  },
  {
    type: "ENDO",
    name: "根管器械包",
    config: ["根管锉套装", "拔髓针", "扩大针", "测量尺", "冲洗器"],
    storageZone: "无菌区·B柜",
  },
  {
    type: "FILLING",
    name: "充填器械包",
    config: ["充填器", "雕刻刀", "抛光器", "调拌刀", "成型片夹"],
    storageZone: "无菌区·A柜",
  },
  {
    type: "SURGERY",
    name: "外科器械包",
    config: ["骨凿", "骨膜分离器", "持骨钳", "线锯", "吸引头", "缝合器"],
    storageZone: "无菌区·D柜",
  },
];

const packageTypeKeys = standards.map((s) => s.type);

interface DefectSpec {
  signatureMissing?: boolean;
  paramQualified?: boolean;
  expired?: boolean;
  wrongLocation?: boolean;
  missingConfigItem?: boolean;
  incompleteLabel?: boolean;
}

function buildPackage(
  idx: number,
  storeId: string,
  typeKey: string,
  std: PackageStandard,
  defect: DefectSpec
): InstrumentPackage {
  const today = new Date("2026-06-18T09:00:00Z");
  const sterilized = new Date(today);
  sterilized.setDate(sterilized.getDate() - (3 + (idx % 10)));
  const expires = new Date(sterilized);
  expires.setDate(expires.getDate() + (defect.expired ? -2 : 90 + (idx % 30)));

  const cycleNo = `CY-${sterilized.toISOString().slice(2, 10).replace(/-/g, "")}-${String((idx % 4) + 1).padStart(2, "0")}`;
  const batchNo = `${std.type}-${storeId}-${String(idx).padStart(3, "0")}`;
  const location = defect.wrongLocation ? "清洁区·X柜(错位)" : std.storageZone;
  const configStandard = defect.missingConfigItem
    ? std.config.slice(0, -1)
    : std.config;

  return {
    id: `PK-${storeId}-${typeKey}-${String(idx).padStart(3, "0")}`,
    batchNo,
    packageName: std.name,
    packageType: typeKey,
    storeId,
    sterilizerId: `STL-${storeId}-${String((idx % 2) + 1)}`,
    cycleNo,
    sterilizedAt: sterilized.toISOString(),
    expiresAt: expires.toISOString(),
    storageLocation: location,
    status: "pending",
    paramQualified: defect.paramQualified !== false,
    configStandard,
    outerLabel: {
      cycleNo: true,
      sterilizedDate: true,
      expiryDate: defect.incompleteLabel ? false : true,
      operatorSign: !defect.signatureMissing,
    },
  };
}

export const packages: InstrumentPackage[] = (() => {
  const list: InstrumentPackage[] = [];
  const defectMap: Record<string, DefectSpec[]> = {
    ST01: [
      {},
      { signatureMissing: true },
      { wrongLocation: true },
      {},
      { missingConfigItem: true },
      {},
      { expired: true },
      {},
    ],
    ST02: [
      {},
      {},
      { paramQualified: false },
      { incompleteLabel: true },
      {},
      { wrongLocation: true },
      {},
      { signatureMissing: true },
    ],
    ST03: [
      {},
      {},
      { missingConfigItem: true },
      {},
      {},
      { expired: true },
      {},
      {},
    ],
    ST04: [
      {},
      { signatureMissing: true },
      {},
      { wrongLocation: true },
      { incompleteLabel: true },
      {},
      { paramQualified: false },
      {},
    ],
    ST05: [
      {},
      {},
      {},
      { missingConfigItem: true },
      { signatureMissing: true },
      { expired: true },
      {},
      {},
    ],
  };

  let globalIdx = 1;
  stores.forEach((store) => {
    const defects = defectMap[store.id] || [];
    defects.forEach((defect, i) => {
      const typeKey = packageTypeKeys[(i + globalIdx) % packageTypeKeys.length];
      const std = standards.find((s) => s.type === typeKey)!;
      list.push(buildPackage(globalIdx, store.id, typeKey, std, defect));
      globalIdx++;
    });
  });

  return list;
})();

export const sterilizationRecords: SterilizationRecord[] = packages.map((p) => {
  const paramOk = p.paramQualified;
  return {
    packageId: p.id,
    cycleNo: p.cycleNo,
    temperature: paramOk ? 134 : 119,
    pressure: paramOk ? 0.21 : 0.18,
    duration: paramOk ? 4 : 3,
    operator: ["张伟", "刘洋", "赵静", "孙磊", "钱颖"][
      Math.abs(hashCode(p.id)) % 5
    ],
    verifiedAt: p.sterilizedAt,
    signatureMissing: !p.outerLabel.operatorSign,
    paramQualified: paramOk,
  };
});

export const tasks: InspectionTask[] = [
  {
    id: "TK-2026-014",
    storeId: "ST01",
    planName: "6月静安门诊月度抽查",
    type: "月度例行",
    status: "doing",
    inspector: "督导·吴桐",
    sampleSize: 8,
    deadline: "2026-06-20",
    createdAt: "2026-06-15",
    packageIds: packages.filter((p) => p.storeId === "ST01").map((p) => p.id),
  },
  {
    id: "TK-2026-013",
    storeId: "ST02",
    planName: "浦东联洋消毒追溯专项",
    type: "专项核查",
    status: "review",
    inspector: "督导·吴桐",
    sampleSize: 8,
    deadline: "2026-06-18",
    createdAt: "2026-06-12",
    packageIds: packages.filter((p) => p.storeId === "ST02").map((p) => p.id),
  },
  {
    id: "TK-2026-012",
    storeId: "ST03",
    planName: "杭州西湖季度复核",
    type: "季度复核",
    status: "done",
    inspector: "督导·林川",
    sampleSize: 8,
    deadline: "2026-06-10",
    createdAt: "2026-06-03",
    packageIds: packages.filter((p) => p.storeId === "ST03").map((p) => p.id),
  },
  {
    id: "TK-2026-015",
    storeId: "ST04",
    planName: "广州天河新规合规抽查",
    type: "新规核查",
    status: "todo",
    inspector: "督导·林川",
    sampleSize: 8,
    deadline: "2026-06-25",
    createdAt: "2026-06-17",
    packageIds: packages.filter((p) => p.storeId === "ST04").map((p) => p.id),
  },
  {
    id: "TK-2026-016",
    storeId: "ST05",
    planName: "北京朝阳整改复查",
    type: "整改复查",
    status: "todo",
    inspector: "督导·林川",
    sampleSize: 8,
    deadline: "2026-06-28",
    createdAt: "2026-06-17",
    packageIds: packages.filter((p) => p.storeId === "ST05").map((p) => p.id),
  },
  {
    id: "TK-2026-011",
    storeId: "ST04",
    planName: "广州天河5月抽查",
    type: "月度例行",
    status: "done",
    inspector: "督导·吴桐",
    sampleSize: 6,
    deadline: "2026-05-28",
    createdAt: "2026-05-20",
    packageIds: [],
  },
  {
    id: "TK-2026-010",
    storeId: "ST01",
    planName: "静安5月抽查",
    type: "月度例行",
    status: "done",
    inspector: "督导·吴桐",
    sampleSize: 6,
    deadline: "2026-05-27",
    createdAt: "2026-05-19",
    packageIds: [],
  },
];

const baseTimeline = (createdAt: string, actor: string) => [
  { node: "问题发现", at: createdAt, actor, note: "现场核验自动判定" },
];

export const issues: Issue[] = [
  {
    id: "IS-2026-031",
    taskId: "TK-2026-013",
    packageId: "PK-ST02-EXTRACT-002",
    storeId: "ST02",
    category: "signature",
    type: "缺操作人签名",
    description: "拔牙器械包外标识缺失操作人签名，无法追溯灭菌责任人。",
    riskLevel: "high",
    status: "review",
    deadline: "2026-06-20",
    assignee: "陈浩",
    createdAt: "2026-06-12",
    resolvedAt: "2026-06-16",
    rectifyNote: "已补签并重新灭菌，操作人培训完成。",
    evidence: [
      { id: "E-031-1", type: "inspection", url: "photo_inspect_sign_001", caption: "缺签名外标识照片", at: "2026-06-12", actor: "督导·吴桐" },
      { id: "E-031-2", type: "rectify_before", url: "photo_before_001", caption: "整改前：未签名包外标识", at: "2026-06-12", actor: "督导·吴桐" },
      { id: "E-031-3", type: "rectify_after", url: "photo_after_001", caption: "整改后：补签后重新灭菌", at: "2026-06-16", actor: "陈浩" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-12", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-031-1", "E-031-2"] },
      { node: "整改提交", at: "2026-06-16", actor: "陈浩", note: "补签+培训记录", photoIds: ["E-031-3"] },
      { node: "待复核", at: "2026-06-16", actor: "系统" },
    ],
  },
  {
    id: "IS-2026-030",
    taskId: "TK-2026-013",
    packageId: "PK-ST02-IMPLANT-006",
    storeId: "ST02",
    category: "signature",
    type: "缺操作人签名",
    description: "种植器械包外标识缺失操作人签名。",
    riskLevel: "high",
    status: "rectifying",
    deadline: "2026-06-21",
    assignee: "陈浩",
    createdAt: "2026-06-12",
    evidence: [
      { id: "E-030-1", type: "inspection", url: "photo_inspect_implant_001", caption: "种植包外标识缺签名", at: "2026-06-12", actor: "督导·吴桐" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-12", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-030-1"] },
      { node: "整改中", at: "2026-06-14", actor: "陈浩", note: "正在补签整改" },
    ],
  },
  {
    id: "IS-2026-029",
    taskId: "TK-2026-013",
    packageId: "PK-ST02-RESTORE-004",
    storeId: "ST02",
    category: "storage",
    type: "存放位置错误",
    description: "修复器械包存放于清洁区·X柜，应置于无菌区·A柜。",
    riskLevel: "medium",
    status: "closed",
    deadline: "2026-06-17",
    assignee: "陈浩",
    createdAt: "2026-06-12",
    resolvedAt: "2026-06-15",
    rectifyNote: "已归位至无菌区A柜，分区标识重新张贴。",
    evidence: [
      { id: "E-029-1", type: "inspection", url: "photo_storage_wrong", caption: "错位存放现场照片", at: "2026-06-12", actor: "督导·吴桐" },
      { id: "E-029-2", type: "rectify_after", url: "photo_storage_fixed", caption: "归位后的无菌区A柜", at: "2026-06-15", actor: "陈浩" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-12", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-029-1"] },
      { node: "整改提交", at: "2026-06-15", actor: "陈浩", photoIds: ["E-029-2"] },
      { node: "复核通过", at: "2026-06-15", actor: "院感·徐颖" },
      { node: "关闭", at: "2026-06-15", actor: "系统" },
    ],
  },
  {
    id: "IS-2026-028",
    taskId: "TK-2026-013",
    packageId: "PK-ST02-SCALING-005",
    storeId: "ST02",
    category: "config",
    type: "外标识不全",
    description: "洁治器械包外标识缺失失效日期标注。",
    riskLevel: "low",
    status: "open",
    deadline: "2026-06-24",
    assignee: "陈浩",
    createdAt: "2026-06-13",
    evidence: [
      { id: "E-028-1", type: "inspection", url: "photo_label_incomplete", caption: "缺失失效日期标注", at: "2026-06-13", actor: "督导·吴桐" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-13", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-028-1"] },
    ],
  },
  {
    id: "IS-2026-027",
    taskId: "TK-2026-012",
    packageId: "PK-ST03-SCALING-003",
    storeId: "ST03",
    category: "config",
    type: "包内配置缺件",
    description: "洁治器械包缺少探针，包内配置不完整。",
    riskLevel: "medium",
    status: "closed",
    deadline: "2026-06-09",
    assignee: "李婷",
    createdAt: "2026-06-03",
    resolvedAt: "2026-06-07",
    rectifyNote: "已补充探针并重新打包灭菌。",
    evidence: [
      { id: "E-027-1", type: "inspection", url: "photo_config_missing", caption: "缺少探针的器械包", at: "2026-06-03", actor: "督导·林川" },
      { id: "E-027-2", type: "rectify_after", url: "photo_config_fixed", caption: "补充探针后重新打包", at: "2026-06-07", actor: "李婷" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-03", actor: "督导·林川", note: "现场核验自动判定", photoIds: ["E-027-1"] },
      { node: "整改提交", at: "2026-06-07", actor: "李婷", photoIds: ["E-027-2"] },
      { node: "复核通过", at: "2026-06-08", actor: "院感·徐颖" },
      { node: "关闭", at: "2026-06-08", actor: "系统" },
    ],
  },
  {
    id: "IS-2026-026",
    taskId: "TK-2026-012",
    packageId: "PK-ST03-ENDO-006",
    storeId: "ST03",
    category: "expiry",
    type: "器械包超期",
    description: "根管器械包已超过失效日期仍在无菌柜存放。",
    riskLevel: "high",
    status: "closed",
    deadline: "2026-06-08",
    assignee: "李婷",
    createdAt: "2026-06-03",
    resolvedAt: "2026-06-06",
    rectifyNote: "已销毁超期包并完善效期巡检流程。",
    evidence: [
      { id: "E-026-1", type: "inspection", url: "photo_expired_package", caption: "超期根管器械包", at: "2026-06-03", actor: "督导·林川" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-03", actor: "督导·林川", note: "现场核验自动判定", photoIds: ["E-026-1"] },
      { node: "整改提交", at: "2026-06-06", actor: "李婷" },
      { node: "复核通过", at: "2026-06-06", actor: "院感·徐颖" },
      { node: "关闭", at: "2026-06-06", actor: "系统" },
    ],
  },
  {
    id: "IS-2026-025",
    taskId: "TK-2026-014",
    packageId: "PK-ST01-IMPLANT-002",
    storeId: "ST01",
    category: "signature",
    type: "缺操作人签名",
    description: "种植器械包外标识缺失操作人签名，存在追溯断点风险。",
    riskLevel: "high",
    status: "open",
    deadline: "2026-06-22",
    assignee: "周敏",
    createdAt: "2026-06-15",
    evidence: [
      { id: "E-025-1", type: "inspection", url: "photo_implant_nosign", caption: "种植包外标识缺签名", at: "2026-06-15", actor: "督导·吴桐" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-15", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-025-1"] },
    ],
  },
  {
    id: "IS-2026-024",
    taskId: "TK-2026-014",
    packageId: "PK-ST01-RESTORE-003",
    storeId: "ST01",
    category: "storage",
    type: "存放位置错误",
    description: "修复器械包错位存放于清洁区，存在交叉污染风险。",
    riskLevel: "medium",
    status: "rectifying",
    deadline: "2026-06-21",
    assignee: "周敏",
    createdAt: "2026-06-15",
    evidence: [
      { id: "E-024-1", type: "inspection", url: "photo_restore_wrongpos", caption: "错位存放于清洁区", at: "2026-06-15", actor: "督导·吴桐" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-15", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-024-1"] },
      { node: "整改中", at: "2026-06-16", actor: "周敏" },
    ],
  },
  {
    id: "IS-2026-023",
    taskId: "TK-2026-014",
    packageId: "PK-ST01-SCALING-005",
    storeId: "ST01",
    category: "config",
    type: "包内配置缺件",
    description: "洁治器械包缺少吸唾管。",
    riskLevel: "medium",
    status: "open",
    deadline: "2026-06-23",
    assignee: "周敏",
    createdAt: "2026-06-15",
    evidence: [
      { id: "E-023-1", type: "inspection", url: "photo_scaling_missing", caption: "洁治包缺少吸唾管", at: "2026-06-15", actor: "督导·吴桐" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-15", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-023-1"] },
    ],
  },
  {
    id: "IS-2026-022",
    taskId: "TK-2026-014",
    packageId: "PK-ST01-ENDO-007",
    storeId: "ST01",
    category: "expiry",
    type: "器械包超期",
    description: "根管器械包已超期，未及时下架处理。",
    riskLevel: "high",
    status: "open",
    deadline: "2026-06-19",
    assignee: "周敏",
    createdAt: "2026-06-15",
    evidence: [
      { id: "E-022-1", type: "inspection", url: "photo_endo_expired", caption: "超期根管器械包", at: "2026-06-15", actor: "督导·吴桐" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-06-15", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-022-1"] },
    ],
  },
  {
    id: "IS-2026-021",
    taskId: "TK-2026-010",
    packageId: "PK-ST01-EXTRACT-001",
    storeId: "ST01",
    category: "signature",
    type: "缺操作人签名",
    description: "5月静安门诊抽查发现拔牙包缺签名问题。",
    riskLevel: "high",
    status: "closed",
    deadline: "2026-05-30",
    assignee: "周敏",
    createdAt: "2026-05-19",
    resolvedAt: "2026-05-26",
    rectifyNote: "签名流程已纳入晨会培训。",
    evidence: [
      { id: "E-021-1", type: "inspection", url: "photo_may_sign_issue", caption: "5月抽查发现缺签名", at: "2026-05-19", actor: "督导·吴桐" },
      { id: "E-021-2", type: "rectify_after", url: "photo_may_sign_fixed", caption: "整改后培训记录", at: "2026-05-26", actor: "周敏" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-05-19", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-021-1"] },
      { node: "整改提交", at: "2026-05-26", actor: "周敏", photoIds: ["E-021-2"] },
      { node: "复核通过", at: "2026-05-27", actor: "院感·徐颖" },
      { node: "关闭", at: "2026-05-27", actor: "系统" },
    ],
  },
  {
    id: "IS-2026-020",
    taskId: "TK-2026-011",
    packageId: "PK-ST04-SCALING-004",
    storeId: "ST04",
    category: "expiry",
    type: "器械包超期",
    description: "5月广州天河发现洁治包超期未下架。",
    riskLevel: "high",
    status: "closed",
    deadline: "2026-05-31",
    assignee: "黄磊",
    createdAt: "2026-05-20",
    resolvedAt: "2026-05-28",
    rectifyNote: "效期巡检纳入每日交接班制度。",
    evidence: [
      { id: "E-020-1", type: "inspection", url: "photo_may_expiry_issue", caption: "5月抽查发现超期包", at: "2026-05-20", actor: "督导·吴桐" },
    ],
    timeline: [
      { node: "问题发现", at: "2026-05-20", actor: "督导·吴桐", note: "现场核验自动判定", photoIds: ["E-020-1"] },
      { node: "整改提交", at: "2026-05-28", actor: "黄磊" },
      { node: "复核通过", at: "2026-05-29", actor: "院感·徐颖" },
      { node: "关闭", at: "2026-05-29", actor: "系统" },
    ],
  },
];

export const commonProblems: CommonProblem[] = [
  {
    id: "CP-01",
    category: "signature",
    description: "灭菌包外标识缺失操作人签名",
    frequency: 18,
    suggestion: "推行扫码即签机制，未签名灭菌记录无法归档。",
  },
  {
    id: "CP-02",
    category: "expiry",
    description: "器械包超过失效日期仍在无菌柜存放",
    frequency: 9,
    suggestion: "每日交接班执行效期巡检，超期包红色预警下架。",
  },
  {
    id: "CP-03",
    category: "storage",
    description: "无菌包错位存放于清洁区",
    frequency: 12,
    suggestion: "分区色标管理，入库扫码校验存放区一致性。",
  },
  {
    id: "CP-04",
    category: "config",
    description: "包内器械配置缺件",
    frequency: 7,
    suggestion: "配置清单二维码绑定，打包后逐项扫码确认。",
  },
  {
    id: "CP-05",
    category: "signature",
    description: "外标识失效日期未标注",
    frequency: 5,
    suggestion: "标签模板强制失效日期字段，留空不可打印。",
  },
  {
    id: "CP-06",
    category: "config",
    description: "灭菌参数(温度/压力/时长)不达标仍归档",
    frequency: 4,
    suggestion: "灭菌锅数据联网，参数不达标自动锁定记录。",
  },
  {
    id: "CP-07",
    category: "storage",
    description: "无菌区与非无菌区器械混放",
    frequency: 3,
    suggestion: "物理隔断+色标地贴，定期督导抽查分区。",
  },
  {
    id: "CP-08",
    category: "expiry",
    description: "效期标签模糊不可辨",
    frequency: 6,
    suggestion: "统一防水防油标签材质，每批复核清晰度。",
  },
];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

export const monthlyTrend = [
  { month: "1月", issues: 14, completion: 86 },
  { month: "2月", issues: 11, completion: 88 },
  { month: "3月", issues: 16, completion: 84 },
  { month: "4月", issues: 9, completion: 91 },
  { month: "5月", issues: 12, completion: 93 },
  { month: "6月", issues: 7, completion: 71 },
];
