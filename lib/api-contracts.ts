import { z } from "zod";

/** Response from POST /api/generate-playbook */
export type QueuePlaybookResponse = {
  queued: true;
  signal_id: string;
};

export const queuePlaybookResponseSchema = z.object({
  queued: z.literal(true),
  signal_id: z.string().uuid(),
});

export const billingCheckoutRequestSchema = z.object({
  priceId: z.string().min(1).optional(),
});

export type BillingCheckoutRequest = z.infer<typeof billingCheckoutRequestSchema>;

export const billingCheckoutResponseSchema = z.object({
  url: z.string().url(),
});

export type BillingCheckoutResponse = z.infer<typeof billingCheckoutResponseSchema>;

export const billingPortalResponseSchema = z.object({
  url: z.string().url(),
});

export type BillingPortalResponse = z.infer<typeof billingPortalResponseSchema>;
