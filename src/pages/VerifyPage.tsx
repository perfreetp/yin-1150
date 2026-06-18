import { useEffect } from "react";
import { PackageQueue } from "./verify/PackageQueue";
import { VerificationWorkbench } from "./verify/VerificationWorkbench";
import { useAuditStore } from "@/store/useAuditStore";

export default function VerifyPage() {
  const activeTaskId = useAuditStore((s) => s.activeTaskId);
  const ensureVerifications = useAuditStore((s) => s.ensureVerifications);

  useEffect(() => {
    if (activeTaskId) ensureVerifications(activeTaskId);
  }, [activeTaskId, ensureVerifications]);

  return (
    <div className="h-full flex">
      <PackageQueue />
      <VerificationWorkbench />
    </div>
  );
}
