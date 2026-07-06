import { z } from "zod";
import { paginationSchema } from "./common";

export const auditEventSchema = z.object({
  id: z.string(),
  msme_id: z.string().nullable(),
  event_type: z.string(),
  actor: z.string(),
  request_id: z.string().nullable(),
  created_at: z.string(),
  metadata: z.record(z.unknown())
});

export const auditListResponseSchema = z.object({
  items: z.array(auditEventSchema),
  pagination: paginationSchema
});

export type AuditEvent = z.infer<typeof auditEventSchema>;
export type AuditListResponse = z.infer<typeof auditListResponseSchema>;
