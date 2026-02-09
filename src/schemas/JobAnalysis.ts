import { z } from 'zod';

export const JobAnalysisSchema = z.object({
  recommendation: z.enum(['Reagovat', 'Nereagovat', 'Zvážit']),
  body: z.object({
    summary: z.string(),
    analysis: z.string(),
    risks_opportunities: z.preprocess((value) => {
      if (typeof value === 'string') return value;
      if (value !== null && typeof value === 'object') return JSON.stringify(value);
      return value;
    }, z.string())
  }),
  score: z.number().min(1).max(10),
  companyName: z.string().nullable().optional()
});

export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;

export const jobAnalysisJsonSchema = {
  type: "object",
  properties: {
    recommendation: { 
      type: "string", 
      enum: ["Reagovat", "Nereagovat", "Zvážit"] 
    },
    body: {
      type: "object",
      properties: {
        summary: { type: "string" },
        analysis: { type: "string" },
        risks_opportunities: { type: "string" }
      },
      required: ["summary", "analysis", "risks_opportunities"],
      additionalProperties: false
    },
    score: { 
      type: "number", 
      minimum: 1, 
      maximum: 10 
    },
    companyName: { 
      type: ["string", "null"] 
    }
  },
  required: ["recommendation", "body", "score"],
  additionalProperties: false
} as const;