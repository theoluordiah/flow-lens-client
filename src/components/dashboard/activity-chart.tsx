"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Datum {
  label: string;
  commits: number;
}

function buildWeeklyData(values: number[]): Datum[] {
  const now = new Date();
  const count = values.length;
  const data: Datum[] = values.map((value, index) => {
    const offset = count - 1 - index;
    const date = new Date(now);
    date.setDate(date.getDate() - offset * 7);
    const monday = new Date(date);
    const day = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - day);
    return {
      label: monday.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      commits: value,
    };
  });
  return data;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-surface-secondary px-3 py-2 shadow-md">
      <p className="text-[11px] text-text-muted mb-1">{label}</p>
      <p className="text-sm font-medium text-text-primary">
        {payload[0].value} commits
      </p>
    </div>
  );
}

export function ActivityChart({ data }: { data: number[] }) {
  const formatted = buildWeeklyData(Array.isArray(data) ? data : []);

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formatted}
          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272A"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717A", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#71717A", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="commits"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#activityGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
