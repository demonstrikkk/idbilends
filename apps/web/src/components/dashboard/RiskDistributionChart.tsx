"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MSMEListItem } from "@/lib/schemas/msme";
import { titleize } from "@/lib/formatters";

const order = ["very_low", "moderate_low", "moderate", "elevated", "high"];

export function RiskDistributionChart({ items }: { items: MSMEListItem[] }) {
  const data = order.map((tier) => ({
    tier: titleize(tier),
    count: items.filter((item) => item.risk_tier === tier).length
  }));

  return (
    <div className="h-72 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#d9e2ec" vertical={false} />
          <XAxis dataKey="tier" tick={{ fill: "#66758a", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#d9e2ec" }} />
          <YAxis tick={{ fill: "#66758a", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#d9e2ec" }} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #d9e2ec", color: "#071b3a" }} />
          <Bar dataKey="count" fill="#1f6feb" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
