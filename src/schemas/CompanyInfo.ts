import { z } from 'zod';

export const CompanyInfoSchema = z.object({
  name: z.string(),
  website: z.string().nullable(),
  keyFacts: z.array(z.string())
});

export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;

export const companyInfoJsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    website: { type: ["string", "null"] },
    keyFacts: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["name", "keyFacts"],
  additionalProperties: false
} as const;