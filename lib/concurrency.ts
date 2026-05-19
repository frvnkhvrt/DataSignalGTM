export async function runWithConcurrency<T, R>(
  items: readonly T[],
  worker: (item: T) => Promise<R>,
  concurrency = 5
): Promise<{ ok: R[]; failed: { item: T; error: unknown }[] }> {
  const ok: R[] = [];
  const failed: { item: T; error: unknown }[] = [];
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const item = items[cursor++];
        try {
          ok.push(await worker(item));
        } catch (error) {
          failed.push({ item, error });
        }
      }
    }
  );
  await Promise.all(runners);
  return { ok, failed };
}
