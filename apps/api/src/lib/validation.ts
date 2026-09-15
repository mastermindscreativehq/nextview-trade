import type { z } from "zod";
import { ValidationError } from "./http-error.js";

export function parseWithSchema<Schema extends z.ZodTypeAny, Output = z.infer<Schema>>(
  schema: Schema,
  data: unknown
): Output {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Invalid request", result.error.flatten());
  }
  return result.data as Output;
}