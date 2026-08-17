import type { ReactNode } from 'react';

/**
 * A single pending render request tracked by the store.
 */
type ToiRequest = {
  id: number;
  render: () => ReactNode;
};

/**
 * Creates a store of pending {@link toi} render requests, exposing a
 * `useSyncExternalStore`-compatible subscribe/getSnapshot pair alongside
 * methods to add/remove requests and track whether a `ToiHost` is mounted.
 */
export const createStore = () => {
  let requests: ToiRequest[] = [];
  let nextId = 0;
  const listeners = new Set<() => void>();

  /** Notifies all subscribers that the snapshot has changed. */
  const emitChange = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  /** Registers a listener and returns a function to unregister it. */
  const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  /** Returns the current list of pending requests. */
  const getSnapshot = () => requests;

  /**
   * Registers a new render request and returns its id.
   *
   * @param render - Called with the request's id to produce the node to render.
   */
  const add = (render: (id: number) => ReactNode) => {
    const id = nextId++;

    requests = [...requests, { id, render: () => render(id) }];
    emitChange();

    return id;
  };

  /** Removes the request with the given id, if present. */
  const remove = (id: number) => {
    requests = requests.filter((request) => request.id !== id);
    emitChange();
  };

  return { subscribe, getSnapshot, add, remove };
};
