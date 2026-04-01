import { z } from "zod";

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const serverControlSchema = z.object({
  action: z.enum(["start", "stop", "restart", "update"]),
});

export const rconCommandSchema = z.object({
  command: z.string().min(1).max(500),
});

export const envUpdateSchema = z.record(z.string(), z.string());

export const iniUpdateSchema = z.record(z.string(), z.record(z.string(), z.string()));

export const backupScheduleSchema = z.object({
  enabled: z.boolean(),
  cronExpression: z.string().min(1),
  retentionDays: z.number().int().min(1).max(365),
  maxCount: z.number().int().min(1).max(100),
});

export const alertRuleSchema = z.object({
  metric: z.enum(["cpu", "memory", "players"]),
  operator: z.enum(["gt", "lt", "eq"]),
  threshold: z.number(),
  enabled: z.boolean().default(true),
});
