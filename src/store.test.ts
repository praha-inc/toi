import { describe, expect, it, vi } from 'vitest';

import { createStore } from './store';

type Configure = (configure: ReturnType<typeof createStore>) => void;

const setup = (configure?: Configure) => {
  const store = createStore();
  configure?.(store);
  return store;
};

describe('createStore', () => {
  describe('when no requests have been added', () => {
    it('should return an empty snapshot', () => {
      const store = setup();

      expect(store.getSnapshot()).toEqual([]);
    });

    it('should return the same snapshot reference on repeated calls', () => {
      const store = setup();

      expect(store.getSnapshot()).toBe(store.getSnapshot());
    });
  });

  describe('when a request is added', () => {
    const configure: Configure = (store) => {
      store.add((id) => `rendered-${id}`);
      return store;
    };

    it('should call render with the request\'s own id', () => {
      const store = setup(configure);

      const [request] = store.getSnapshot();
      expect(request?.render()).toBe(`rendered-${request?.id}`);
    });
  });

  describe('when multiple requests have been added', () => {
    const configure: Configure = (store) => {
      store.add(() => 'first');
      store.add(() => 'second');
      return store;
    };

    it('should assign a unique id to each request', () => {
      const store = setup(configure);

      const [first, second] = store.getSnapshot();
      expect(first?.id).not.toBe(second?.id);
    });

    it('should append new requests after existing ones', () => {
      const store = setup(configure);

      const nodes = store.getSnapshot().map((request) => request.render());
      expect(nodes).toEqual(['first', 'second']);
    });
  });

  describe('when a request is added while subscribed', () => {
    const listener = vi.fn();
    const configure: Configure = (store) => {
      store.subscribe(listener);
      store.add(() => 'value');
      return store;
    };

    it('should notify the subscriber', () => {
      setup(configure);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a request is removed', () => {
    const configure: Configure = (store) => {
      store.add(() => 'value');
      const [request] = store.getSnapshot();
      store.remove(request!.id);
      return store;
    };

    it('should remove the request with the given id', () => {
      const store = setup(configure);

      expect(store.getSnapshot()).toEqual([]);
    });
  });

  describe('when one of multiple requests is removed', () => {
    const configure: Configure = (store) => {
      store.add(() => 'first');
      store.add(() => 'second');
      const [first] = store.getSnapshot();
      store.remove(first!.id);
      return store;
    };

    it('should leave the other requests untouched', () => {
      const store = setup(configure);

      const nodes = store.getSnapshot().map((request) => request.render());
      expect(nodes).toEqual(['second']);
    });
  });

  describe('when a request is removed while subscribed', () => {
    const listener = vi.fn();
    const configure: Configure = (store) => {
      store.add(() => 'value');
      const [request] = store.getSnapshot();
      store.subscribe(listener);
      store.remove(request!.id);
      return store;
    };

    it('should notify the subscriber', () => {
      setup(configure);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a subscriber has unsubscribed', () => {
    const listener = vi.fn();
    const configure: Configure = (store) => {
      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      store.add(() => 'value');
      return store;
    };

    it('should not notify the unsubscribed listener', () => {
      setup(configure);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
