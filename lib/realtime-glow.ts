/**
 * Lightweight module-level store that tracks which record IDs were recently
 * touched by a Supabase realtime event.  Components read from this store
 * synchronously on the render that follows a React Query refetch — since the
 * refetch itself is triggered by the same realtime event that marks the ID,
 * the class is present on the first post-update render and fades out via CSS.
 *
 * No React state is involved, so there are no extra re-renders.
 */

const GLOW_DURATION_MS = 1_400;

// table → Set of recently-updated record IDs
const store = new Map<string, Set<string>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Call this from the realtime callback with the updated record's ID. */
export function markRecentlyUpdated(table: string, id: string): void {
  const key = `${table}:${id}`;

  if (!store.has(table)) store.set(table, new Set());
  store.get(table)!.add(id);

  // Clear any existing timer for this record so rapid updates extend the glow
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  timers.set(
    key,
    setTimeout(() => {
      store.get(table)?.delete(id);
      timers.delete(key);
    }, GLOW_DURATION_MS)
  );
}

/** Returns true if the given record ID was recently updated via realtime. */
export function isRecentlyUpdated(table: string, id: string): boolean {
  return store.get(table)?.has(id) ?? false;
}
