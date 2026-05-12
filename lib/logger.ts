/**
 * Thin structured logger that works in both browser and server/edge runtimes.
 * On the server it writes structured JSON to stdout (captured by Vercel/cloud
 * log sinks). On the client it falls back to the browser console.
 * Errors are always forwarded to Sentry when the SDK is initialised.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  message: string;
  [key: string]: unknown;
}

function isServer(): boolean {
  return typeof window === "undefined";
}

function formatServer(level: LogLevel, payload: LogPayload): string {
  return JSON.stringify({
    level,
    ts: new Date().toISOString(),
    ...payload,
  });
}

function emit(level: LogLevel, payload: LogPayload) {
  if (isServer()) {
    const line = formatServer(level, payload);
    if (level === "error" || level === "warn") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  } else {
    const { message, ...rest } = payload;
    const hasExtra = Object.keys(rest).length > 0;
    const consoleFn =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : level === "info"
            ? console.info
            : console.debug;
    if (hasExtra) {
      consoleFn(message, rest);
    } else {
      consoleFn(message);
    }
  }
}

async function captureToSentry(
  error: unknown,
  extra?: Record<string, unknown>
) {
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.withScope((scope) => {
      if (extra) scope.setExtras(extra);
      Sentry.captureException(error);
    });
  } catch {
    // Sentry not configured – silently skip.
  }
}

export const logger = {
  debug(message: string, extra?: Record<string, unknown>) {
    emit("debug", { message, ...extra });
  },

  info(message: string, extra?: Record<string, unknown>) {
    emit("info", { message, ...extra });
  },

  warn(message: string, extra?: Record<string, unknown>) {
    emit("warn", { message, ...extra });
  },

  error(message: string, errorOrExtra?: unknown, extra?: Record<string, unknown>) {
    const isErrorObj = errorOrExtra instanceof Error;
    const payload: LogPayload = {
      message,
      ...(isErrorObj
        ? { error: errorOrExtra.message, stack: errorOrExtra.stack, ...extra }
        : (errorOrExtra as Record<string, unknown> | undefined) ?? {}),
    };
    emit("error", payload);
    if (isErrorObj) {
      void captureToSentry(errorOrExtra, { message, ...extra });
    }
  },
};
