import { apiFetch } from "./client";
import { prospectOutputSchema, type ProspectOutput } from "@/lib/schemas/prospect";

export function getProspectSignals(msmeId: string): Promise<ProspectOutput> {
  return apiFetch(`/prospects/${msmeId}/signals`, prospectOutputSchema);
}
