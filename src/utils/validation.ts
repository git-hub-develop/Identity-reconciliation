import { z } from "zod";

/**
 * Validation schema for the /identify endpoint request body
 */
export const IdentifyRequestSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .optional()
      .or(z.literal(null))
      .transform((val) => (val === null ? undefined : val)),

    phoneNumber: z
      .union([z.string(), z.number()])
      .optional()
      .or(z.literal(null))
      .transform((val) => {
        if (val === null || val === undefined) return undefined;
        return val.toString();
      }),
  })
  .refine((data) => data.email || data.phoneNumber, {
    message: "At least one of email or phoneNumber must be provided",
    path: ["email", "phoneNumber"],
  });

/**
 * Validation schema for contact data
 */
export const ContactDataSchema = z
  .object({
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    linkedId: z.number().optional(),
    linkPrecedence: z.enum(["PRIMARY", "SECONDARY"]),
  })
  .refine((data) => data.email || data.phoneNumber, {
    message: "Contact must have at least email or phoneNumber",
    path: ["email", "phoneNumber"],
  });

/**
 * Validation for environment variables
 */
export const EnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Type inference from schemas
 */
export type IdentifyRequestType = z.infer<typeof IdentifyRequestSchema>;
export type ContactDataType = z.infer<typeof ContactDataSchema>;
export type EnvType = z.infer<typeof EnvSchema>;
