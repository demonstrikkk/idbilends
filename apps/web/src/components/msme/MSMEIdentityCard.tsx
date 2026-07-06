import type { MSMEDetail } from "@/lib/schemas/msme";
import { formatInr, titleize } from "@/lib/formatters";

export function MSMEIdentityCard({ msme }: { msme: MSMEDetail }) {
  return (
    <div className="grid gap-4 border border-line bg-panel p-4 lg:grid-cols-[1fr_auto]">
      <div>
        <div className="text-xs text-muted">Synthetic MSME profile</div>
        <h1 className="mt-1 text-2xl font-semibold">{msme.business_name}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
          <span>{titleize(msme.segment)}</span>
          <span className="text-muted">/</span>
          <span>{titleize(msme.scenario_label)}</span>
          <span className="text-muted">/</span>
          <span>{msme.city}, {msme.state}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs text-muted">Requested credit</div>
          <div className="mt-1 font-semibold">{formatInr(msme.requested_credit_amount)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Vintage</div>
          <div className="mt-1 font-semibold">{msme.business_vintage_months} months</div>
        </div>
        <div>
          <div className="text-xs text-muted">Employees</div>
          <div className="mt-1 font-semibold">{msme.employee_count}</div>
        </div>
      </div>
    </div>
  );
}
