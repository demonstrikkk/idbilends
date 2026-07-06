import { RiskTierBadge } from "./RiskTierBadge";

export function ScoreGauge({ score, tier }: { score: number | null | undefined; tier: string | null | undefined }) {
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const background = `conic-gradient(#42d4c8 ${pct * 1.8}deg, #1d3144 0deg)`;
  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full" style={{ background }}>
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-panel">
          <span className="text-3xl font-semibold">{score ?? "--"}</span>
          <span className="text-xs text-muted">/100</span>
        </div>
      </div>
      <div className="text-center">
        <RiskTierBadge tier={tier} />
      </div>
    </div>
  );
}
