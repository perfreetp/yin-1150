import { useEffect, useState } from "react";
import { useAuditStore } from "@/store/useAuditStore";
import { Wifi, CircleDot, Database, Activity } from "lucide-react";

export function StatusBar() {
  const stores = useAuditStore((s) => s.stores);
  const currentStoreId = useAuditStore((s) => s.currentStoreId);
  const store = stores.find((s) => s.id === currentStoreId);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");

  return (
    <footer className="h-7 shrink-0 bg-ink-900 text-ink-300 flex items-center gap-4 px-4 font-mono text-[11px]">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse" />
        <span className="text-safe">在线</span>
      </span>
      <span className="text-ink-700">|</span>
      <span className="flex items-center gap-1.5">
        <Wifi className="h-3 w-3 text-brand-300" />
        消毒追溯网关已连接
      </span>
      <span className="text-ink-700">|</span>
      <span className="flex items-center gap-1.5">
        <Database className="h-3 w-3 text-brand-300" />
        当前门店：{store?.code} {store?.name}
      </span>
      <span className="text-ink-700">|</span>
      <span className="flex items-center gap-1.5">
        <CircleDot className="h-3 w-3 text-ember-500" />
        稽核员：督导·吴桐
      </span>
      <div className="flex-1" />
      <span className="flex items-center gap-1.5 text-ink-300">
        <Activity className="h-3 w-3 text-brand-300" />
        会话活动
      </span>
      <span className="text-ink-700">|</span>
      <span className="tabular-nums text-brand-200">
        {hh}:{mm}:{ss}
      </span>
    </footer>
  );
}
