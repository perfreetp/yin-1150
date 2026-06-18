import { useState } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { cn } from "@/lib/utils";
import { Check, X, Camera, ChevronDown } from "lucide-react";
import type { VerificationItem } from "@/types";

export function CheckRow({ item }: { item: VerificationItem }) {
  const setItemResult = useAuditStore((s) => s.setItemResult);
  const setItemPhoto = useAuditStore((s) => s.setItemPhoto);
  const [expanded, setExpanded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(item.photoUrl || "");

  const handlePhoto = () => {
    const fake = `photo_${item.id}_${Date.now().toString().slice(-4)}`;
    setPhotoUrl(fake);
    setItemPhoto(item.id, fake);
  };

  return (
    <div className={cn(
      "rounded-md border transition-all",
      item.result === "fail" ? "border-risk/30 bg-risk/5" : item.result === "pass" ? "border-safe/30 bg-safe/5" : "border-line bg-surfaceAlt"
    )}>
      <div className="flex items-center gap-2 p-2.5">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink-800 truncate">{item.label}</div>
          {item.notes && <div className="text-[11px] text-risk mt-0.5">{item.notes}</div>}
        </div>
        {photoUrl && (
          <span className="chip bg-brand-50 text-brand-600">
            <Camera className="h-3 w-3" /> 已取证
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setItemResult(item.id, "pass")}
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center transition-all border",
              item.result === "pass"
                ? "bg-safe text-white border-safe"
                : "bg-surface border-line text-ink-400 hover:text-safe hover:border-safe/40"
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setItemResult(item.id, "fail")}
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center transition-all border",
              item.result === "fail"
                ? "bg-risk text-white border-risk"
                : "bg-surface border-line text-ink-400 hover:text-risk hover:border-risk/40"
            )}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="h-7 w-7 rounded-md flex items-center justify-center text-ink-400 hover:bg-surfaceSunken transition-colors"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>
      {expanded && (
        <div className="px-2.5 pb-2.5 flex items-center gap-2 animate-fade-in">
          <button onClick={handlePhoto} className="btn-subtle text-xs py-1.5">
            <Camera className="h-3.5 w-3.5" /> {photoUrl ? "重新取证" : "拍照取证"}
          </button>
          {item.result === "fail" && (
            <span className="text-[11px] text-risk font-medium">该项不合格将自动判定风险并生成整改项</span>
          )}
        </div>
      )}
    </div>
  );
}
