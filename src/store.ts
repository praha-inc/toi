import type { ReactNode } from 'react';

type ToiRequest = {
  id: number;
  render: () => ReactNode;
};

export const createStore = () => {
  let requests: ToiRequest[] = [];
  let nextId = 0;
  const listeners = new Set<() => void>();

  const emitChange = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const getSnapshot = () => requests;

  const add = (render: (id: number) => ReactNode) => {
    const id = nextId++;

    requests = [...requests, { id, render: () => render(id) }];
    emitChange();

    return id;
  };

  const remove = (id: number) => {
    requests = requests.filter((request) => request.id !== id);
    emitChange();
  };

  return { subscribe, getSnapshot, add, remove };
};
