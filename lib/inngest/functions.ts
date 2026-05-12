import { getOptionalServerEnv } from "@/lib/env";
import {
  generatePlaybookWithGemini,
  type PlaybookInput,
} from "@/lib/ai/generate-playbook";
import { logger } from "@/lib/logger";
import { trackServer } from "@/lib/analytics.server";
import { createAdminClient } from "@/lib/supabase/server";
import { PLAYBOOK_GENERATE_EVENT, inngest } from "./client";

export const generatePlaybookFunction = inngest.createFunction(
  {
    id: "generate-signal-playbook",
    name: "Generate signal playbook",
    triggers: { event: PLAYBOOK_GENERATE_EVENT },
    retries: 3,
    concurrency: {
      limit: 5,
      scope: "env",
      key: "event.data.orgId",
    },
  },
  async ({ event, step }) => {
    const { orgId, signalId, requestedBy } = event.data;
    const db = createAdminClient();
    const geminiApiKey = getOptionalServerEnv("GEMINI_API_KEY");
    const startMs = Date.now();

    logger.info("playbook-job-started", { orgId, signalId });

    if (!geminiApiKey) {
      await step.run("mark-missing-gemini-key", async () => {
        await db
          .from("signals")
          .update({
            playbook_status: "failed",
            playbook_error: "GEMINI_API_KEY is not configured.",
          })
          .eq("org_id", orgId)
          .eq("id", signalId);
      });
      logger.warn("playbook-job-no-api-key", { orgId, signalId });
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    await step.run("mark-generating", async () => {
      const { error } = await db
        .from("signals")
        .update({
          playbook_status: "generating",
          playbook_error: null,
        })
        .eq("org_id", orgId)
        .eq("id", signalId);

      if (error) throw error;
    });

    const input = await step.run("load-signal-context", async () => {
      const { data: signal, error: signalError } = await db
        .from("signals")
        .select(
          "id,account_name,why_now,velocity_score,fit_score,intent_score,timing_score,composite_score"
        )
        .eq("org_id", orgId)
        .eq("id", signalId)
        .single();

      if (signalError) throw signalError;

      const { data: account, error: accountError } = await db
        .from("accounts")
        .select("industry,employee_count,data_quality_score,icp_fit_score")
        .eq("org_id", orgId)
        .eq("name", signal.account_name ?? "")
        .maybeSingle();

      if (accountError) throw accountError;

      return {
        account_name: signal.account_name ?? "Unknown account",
        industry: account?.industry ?? null,
        employee_count: account?.employee_count ?? null,
        data_quality_score: account?.data_quality_score ?? null,
        icp_fit_score: account?.icp_fit_score ?? null,
        why_now: signal.why_now || "No signal context available",
        velocity_score: signal.velocity_score ?? null,
        fit_score: signal.fit_score ?? null,
        intent_score: signal.intent_score ?? null,
        timing_score: signal.timing_score ?? null,
        composite_score: signal.composite_score ?? null,
      } satisfies PlaybookInput;
    });

    try {
      const playbook = await step.run("generate-playbook", async () =>
        generatePlaybookWithGemini({
          input,
          apiKey: geminiApiKey,
        })
      );

      await step.run("persist-playbook", async () => {
        const { error } = await db
          .from("signals")
          .update({
            playbook: playbook as never,
            playbook_status: "completed",
            playbook_error: null,
            playbook_generated_at: new Date().toISOString(),
          })
          .eq("org_id", orgId)
          .eq("id", signalId);

        if (error) throw error;
      });

      const durationMs = Date.now() - startMs;
      logger.info("playbook-job-completed", { orgId, signalId, durationMs });

      await trackServer(
        {
          event: "playbook_generated",
          properties: {
            org_id: orgId,
            signal_id: signalId,
            success: true,
            duration_ms: durationMs,
            model: "gemini-2.0-flash-lite",
          },
        },
        requestedBy
      );

      // Persist usage record for cost dashboard.
      await step.run("record-ai-usage", async () => {
        await db.from("ai_usage").insert({
          org_id: orgId,
          signal_id: signalId,
          model: "gemini-2.0-flash-lite",
          duration_ms: durationMs,
          success: true,
        });
      });

      return { signalId, orgId, status: "completed" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Playbook generation failed.";
      const durationMs = Date.now() - startMs;

      logger.error("playbook-job-failed", error, { orgId, signalId, durationMs });

      await step.run("mark-failed", async () => {
        await db
          .from("signals")
          .update({
            playbook_status: "failed",
            playbook_error: message,
          })
          .eq("org_id", orgId)
          .eq("id", signalId);
      });

      await step.run("record-ai-usage-failure", async () => {
        await db.from("ai_usage").insert({
          org_id: orgId,
          signal_id: signalId,
          model: "gemini-2.0-flash-lite",
          duration_ms: durationMs,
          success: false,
          error_message: message,
        });
      });

      await trackServer(
        {
          event: "playbook_generated",
          properties: {
            org_id: orgId,
            signal_id: signalId,
            success: false,
            duration_ms: durationMs,
            model: "gemini-2.0-flash-lite",
            error: message,
          },
        },
        requestedBy
      );

      throw error;
    }
  }
);

export const inngestFunctions = [generatePlaybookFunction];
