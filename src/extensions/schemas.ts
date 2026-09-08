import { z } from "zod";

export const uiEventSchemaV1 = z.object({
  schemaVersion: z.literal("1.0.0"),
  type: z.string().min(1),
  action: z.string().min(1),
  component: z.string().min(1),
  semanticId: z.string().min(1).optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  timestamp: z.number().int().nonnegative()
});

export type UIEventSchemaV1 = z.infer<typeof uiEventSchemaV1>;

export function validateUIEventSchemaV1(input: unknown): UIEventSchemaV1 {
  return uiEventSchemaV1.parse(input);
}
