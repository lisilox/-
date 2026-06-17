// tiny reactive store in 30 lines of TypeScript.
// Subscription-based. No external dependencies.

import { useSyncExternalStore } from "react";

export interface Store<T> {
  get(): T;
  set(patch: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(fn: () => void): () => void;
  use(): T;
}

export function create<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const store: Store<T> = {
    get: () => state,
    set: (p) => {
      const patch = typeof p === "function" ? (p as (s: T) => Partial<T>)(state) : p;
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    use: () => useSyncExternalStore(store.subscribe, store.get, store.get),
  };
  return store;
}
