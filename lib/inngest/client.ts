import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "datasignalgtm",
  name: "DataSignalGTM",
});

export const PLAYBOOK_GENERATE_EVENT = "playbook/generate.requested" as const;

export type PlaybookGenerateEvent = {
  name: typeof PLAYBOOK_GENERATE_EVENT;
  data: {
    orgId: string;
    signalId: string;
    requestedBy: string;
  };
};
