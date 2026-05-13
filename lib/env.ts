import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required")
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  // Optional observability keys – absent in many environments.
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().or(z.literal("")),
  // Stripe publishable key (optional in dev)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  // App URL for Stripe redirects
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
});

const serverOnlyEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  GEMINI_API_KEY: optionalSecret,
  DEMO_RESET_KEY: optionalSecret,
  DEMO_USER_PASSWORD: optionalSecret,
  INNGEST_EVENT_KEY: optionalSecret,
  INNGEST_SIGNING_KEY: optionalSecret,
  // Stripe (optional in dev — required in production for billing)
  STRIPE_SECRET_KEY: optionalSecret,
  STRIPE_WEBHOOK_SECRET: optionalSecret,
  STRIPE_PRO_PRICE_ID: optionalSecret,
  // External webhook auth
  SIGNAL_WEBHOOK_SECRET: optionalSecret,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
type ServerOnlyEnv = z.infer<typeof serverOnlyEnvSchema>;
type ServerOnlyEnvKey = keyof ServerOnlyEnv;

function readPublicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

function formatEnvError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const name = issue.path.join(".");
      return name ? `${name}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

function invalidEnvVars(error: z.ZodError): string[] {
  return Array.from(
    new Set(
      error.issues
        .map((issue) => issue.path[0])
        .filter((name): name is string => typeof name === "string")
    )
  );
}

export function getPublicEnvStatus(): {
  configured: boolean;
  invalidVars: string[];
  message: string | null;
} {
  const parsed = publicEnvSchema.safeParse(readPublicEnv());
  if (parsed.success) {
    return { configured: true, invalidVars: [], message: null };
  }

  return {
    configured: false,
    invalidVars: invalidEnvVars(parsed.error),
    message: formatEnvError(parsed.error),
  };
}

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse(readPublicEnv());
  if (!parsed.success) {
    throw new Error(`Invalid public environment: ${formatEnvError(parsed.error)}`);
  }

  return parsed.data;
}

export function getOptionalServerEnv(key: ServerOnlyEnvKey): string | undefined {
  const schema = serverOnlyEnvSchema.shape[key];
  const parsed = schema.safeParse(process.env[key]);
  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${formatEnvError(parsed.error)}`);
  }

  return parsed.data;
}

export function getRequiredServerEnv(key: ServerOnlyEnvKey): string {
  const value = getOptionalServerEnv(key);
  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }

  return value;
}
