export type ActionSuccess<T> = { ok: true; data: T };

export type ActionFailure = {
  ok: false;
  error: string;
  code?:
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "transition"
    | "playbook_required"
    | "unknown";
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return { ok: true, data };
}

export function actionFailure(
  error: string,
  code: ActionFailure["code"] = "unknown"
): ActionFailure {
  return { ok: false, error, code };
}

export class ActionError extends Error {
  constructor(
    message: string,
    public readonly code: ActionFailure["code"] = "unknown"
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export function unwrapActionResult<T>(result: ActionResult<T>): T {
  if (result.ok) return result.data;
  throw new ActionError(result.error, result.code);
}
