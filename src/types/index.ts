export type TaskStatus = "todo" | "doing" | "review" | "done";
export type PackageStatus = "pending" | "verified" | "issue";
export type CheckCategory = "config" | "signature" | "expiry" | "storage";
export type CheckResult = "pass" | "fail" | "pending";
export type RiskLevel = "high" | "medium" | "low";
export type IssueStatus = "open" | "rectifying" | "review" | "closed";

export interface Store {
  id: string;
  name: string;
  code: string;
  region: string;
  manager: string;
}

export interface SterilizationRecord {
  packageId: string;
  cycleNo: string;
  temperature: number;
  pressure: number;
  duration: number;
  operator: string;
  verifiedAt: string;
  signatureMissing?: boolean;
  paramQualified?: boolean;
}

export interface InstrumentPackage {
  id: string;
  batchNo: string;
  packageName: string;
  packageType: string;
  storeId: string;
  sterilizerId: string;
  cycleNo: string;
  sterilizedAt: string;
  expiresAt: string;
  storageLocation: string;
  status: PackageStatus;
  paramQualified: boolean;
  configStandard: string[];
  outerLabel: {
    cycleNo: boolean;
    sterilizedDate: boolean;
    expiryDate: boolean;
    operatorSign: boolean;
  };
}

export interface VerificationItem {
  id: string;
  taskId: string;
  packageId: string;
  category: CheckCategory;
  label: string;
  result: CheckResult;
  photoUrl?: string;
  notes?: string;
}

export type PhotoEvidenceType = "inspection" | "rectify_before" | "rectify_after" | "review";

export interface PhotoEvidence {
  id: string;
  type: PhotoEvidenceType;
  url: string;
  caption?: string;
  at: string;
  actor: string;
}

export interface TimelineNode {
  node: string;
  at: string;
  actor: string;
  note?: string;
  photoIds?: string[];
}

export interface Issue {
  id: string;
  taskId: string;
  packageId: string;
  storeId: string;
  category: CheckCategory;
  type: string;
  description: string;
  riskLevel: RiskLevel;
  status: IssueStatus;
  deadline: string;
  assignee: string;
  createdAt: string;
  resolvedAt?: string;
  rectifyNote?: string;
  evidence: PhotoEvidence[];
  timeline: TimelineNode[];
}

export interface InspectionTask {
  id: string;
  storeId: string;
  planName: string;
  type: string;
  status: TaskStatus;
  inspector: string;
  sampleSize: number;
  deadline: string;
  createdAt: string;
  completedAt?: string;
  packageIds: string[];
}

export interface CommonProblem {
  id: string;
  category: CheckCategory;
  description: string;
  frequency: number;
  suggestion: string;
}

export interface SamplingRule {
  storeId: string;
  packageTypes: string[];
  ratio: number;
  seed: string;
}

export interface PackageStandard {
  type: string;
  name: string;
  config: string[];
  storageZone: string;
}
