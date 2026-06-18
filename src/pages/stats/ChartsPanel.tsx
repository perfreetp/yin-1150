import { useAuditStore } from "@/store/useAuditStore";
import { riskDistribution, completionRate } from "@/lib/format";
import { monthlyTrend } from "@/data/seed";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from "recharts";
import { PieChart as PieIcon, BarChart3, TrendingUp } from "lucide-react";

export function ChartsPanel() {
  const issues = useAuditStore((s) => s.issues);
  const dist = riskDistribution(issues);
  const rate = completionRate(issues);
  const closed = issues.filter((i) => i.status === "closed").length;
  const open = issues.length - closed;

  const pieData = [
    { name: "已闭环", value: closed, color: "#15803D" },
    { name: "未闭环", value: open, color: "#C2410C" },
  ];
  const barData = [
    { name: "高风险", value: dist.high, fill: "#B91C1C" },
    { name: "中风险", value: dist.medium, fill: "#B45309" },
    { name: "低风险", value: dist.low, fill: "#475569" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      <div className="panel p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <PieIcon className="h-4 w-4 text-brand-500" />
          <h3 className="font-display text-sm font-bold text-ink-900">整改完成率</h3>
        </div>
        <div className="flex-1 relative min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-display text-3xl font-bold text-brand-600 tabular-nums">{rate}%</span>
            <span className="label-mono">完成率</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-line-faint">
          <Legend2 color="#15803D" label="已闭环" value={closed} />
          <Legend2 color="#C2410C" label="未闭环" value={open} />
        </div>
      </div>

      <div className="panel p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-brand-500" />
          <h3 className="font-display text-sm font-bold text-ink-900">风险分布</h3>
        </div>
        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#52707F", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#52707F", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(13,92,99,0.05)" }}
                contentStyle={{ borderRadius: 6, border: "1px solid #E1E6EC", fontSize: 12, fontFamily: "Manrope" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pt-2 border-t border-line-faint text-[11px] text-ink-400 flex items-center justify-between">
          <span>总问题 <span className="font-mono font-semibold text-ink-600">{dist.total}</span></span>
          <span>高风险占比 <span className="font-mono font-semibold text-risk">{dist.total > 0 ? Math.round((dist.high / dist.total) * 100) : 0}%</span></span>
        </div>
      </div>

      <div className="panel p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-brand-500" />
          <h3 className="font-display text-sm font-bold text-ink-900">月度趋势</h3>
        </div>
        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#52707F", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#52707F", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #E1E6EC", fontSize: 12, fontFamily: "Manrope" }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Manrope" }} />
              <Line type="monotone" dataKey="issues" name="问题数" stroke="#0D5C63" strokeWidth={2.5} dot={{ r: 3, fill: "#0D5C63" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="completion" name="完成率%" stroke="#C2410C" strokeWidth={2.5} strokeDasharray="4 3" dot={{ r: 3, fill: "#C2410C" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="pt-2 border-t border-line-faint text-[11px] text-ink-400">
          近6月问题数持续下降，6月完成率待提升
        </div>
      </div>
    </div>
  );
}

function Legend2({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-ink-500">{label}</span>
      <span className="font-mono text-[11px] font-semibold text-ink-700 tabular-nums">{value}</span>
    </div>
  );
}
