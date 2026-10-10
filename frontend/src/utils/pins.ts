export type PinnedActivityKind = "event" | "challenge";

function storageKey(userId: number, kind: PinnedActivityKind): string {
  return `lifting-club:pinned:${userId}:${kind}`;
}

export function getPinnedIds(userId: number | undefined, kind: PinnedActivityKind): number[] {
  if (userId === undefined) return [];
  try {
    const stored = window.localStorage.getItem(storageKey(userId, kind));
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

export function togglePinnedId(userId: number, kind: PinnedActivityKind, id: number): number[] {
  const current = getPinnedIds(userId, kind);
  const next = current.includes(id) ? current.filter((pinnedId) => pinnedId !== id) : [id, ...current];
  try {
    window.localStorage.setItem(storageKey(userId, kind), JSON.stringify(next));
  } catch {
    return current;
  }
  return next;
}

export function pinnedFirst<T>(items: T[], pinnedIds: number[], getId: (item: T) => number): T[] {
  const pinned = new Set(pinnedIds);
  return [...items].sort((left, right) => Number(pinned.has(getId(right))) - Number(pinned.has(getId(left))));
}