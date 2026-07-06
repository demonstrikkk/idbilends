import Link from "next/link";
import type { MSMEListItem } from "@/lib/schemas/msme";
import { formatInr, titleize } from "@/lib/formatters";
import { RiskTierBadge } from "@/components/score/RiskTierBadge";

export function MSMETable({ items }: { items: MSMEListItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="bg-[#0b1a28] text-xs text-muted">
          <tr>
            <th className="border-b border-line px-4 py-3 font-medium">Business</th>
            <th className="border-b border-line px-4 py-3 font-medium">Segment</th>
            <th className="border-b border-line px-4 py-3 font-medium">Health</th>
            <th className="border-b border-line px-4 py-3 font-medium">Risk</th>
            <th className="border-b border-line px-4 py-3 font-medium">Prospect</th>
            <th className="border-b border-line px-4 py-3 font-medium">Confidence</th>
            <th className="border-b border-line px-4 py-3 font-medium">Requested</th>
            <th className="border-b border-line px-4 py-3 font-medium">Human action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-line/70 hover:bg-[#102234]">
              <td className="px-4 py-3">
                <Link href={`/msmes/${item.id}`} className="font-semibold text-slate-100 hover:text-cyan">{item.business_name}</Link>
                <div className="text-xs text-muted">{item.city}, {item.state}</div>
              </td>
              <td className="px-4 py-3">{titleize(item.segment)}</td>
              <td className="px-4 py-3 font-semibold">{item.health_score ?? "--"}</td>
              <td className="px-4 py-3"><RiskTierBadge tier={item.risk_tier} /></td>
              <td className="px-4 py-3">
                <div className="font-semibold">{item.prospect_score ?? "--"}</div>
                <div className="text-xs text-muted">{titleize(item.prospect_priority)}</div>
              </td>
              <td className="px-4 py-3">{item.data_confidence == null ? "--" : `${item.data_confidence}%`}</td>
              <td className="px-4 py-3">{formatInr(item.requested_credit_amount)}</td>
              <td className="max-w-[310px] px-4 py-3 text-xs leading-5 text-slate-300">{item.recommended_human_action ?? "Generate score output for human-review guidance."}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const ProspectRankingTable = MSMETable;
