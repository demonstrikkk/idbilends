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
          <CartesianGrid stroke="#284156" vertical={false} />
          <XAxis dataKey="tier" tick={{ fill: "#8aa0b3", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#284156" }} />
          <YAxis tick={{ fill: "#8aa0b3", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#284156" }} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "#122334", border: "1px solid #284156", color: "#e8f0f6" }} />
          <Bar dataKey="count" fill="#42d4c8" radius={[0, 0, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
