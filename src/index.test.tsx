/* oxlint-disable react/no-multi-comp */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { toi, ToiHost } from './index';

import type { ToiProps } from './index';
import type { FC } from 'react';

describe('toi', () => {
  beforeEach(() => {
    render(<ToiHost />);
  });

  describe('when resolve is called', () => {
    const Component: FC<ToiProps<boolean>> = ({ ref, resolve }) => (
      <button type="button" ref={ref} onClick={() => resolve(true)}>OK</button>
    );

    it('should mount the component', async () => {
      const [promise] = await act(() => [toi(Component)]);

      expect(screen.queryByRole('button', { name: 'OK' })).not.toBeNull();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
        return promise;
      });
    });

    it('should resolve the promise with the value passed to resolve', async () => {
      const [promise] = await act(() => [toi(Component)]);

      const response = await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
        return promise;
      });

      expect(response).toBe(true);
      expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();
    });
  });

  describe('when resolve is called more than once', () => {
    const Component: FC<ToiProps<number>> = ({ ref, resolve }) => (
      <div
        ref={(element) => {
          ref?.(element);
          element?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
        }}
      >
        <button type="button" onClick={() => resolve(1)}>first</button>
        <button type="button" onClick={() => resolve(2)}>second</button>
      </div>
    );

    it('should ignore every call after the first', async () => {
      const [promise] = await act(() => [toi(Component)]);

      const response = await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'first' }));
        fireEvent.click(screen.getByRole('button', { name: 'second' }));
        return promise;
      });

      expect(response).toBe(1);
    });
  });

  describe('when the ref element has a finite exit animation', () => {
    const Component: FC<ToiProps<string>> = ({ ref, resolve }) => (
      <div
        data-testid="dialog"
        ref={(element) => {
          ref?.(element);
          element?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100 });
        }}
      >
        <button type="button" onClick={() => resolve('done')}>close</button>
      </div>
    );

    it('should wait for the animation to finish before removing the component', async () => {
      const [promise] = await act(() => [toi(Component)]);

      const response = await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'close' }));
        expect(screen.queryByTestId('dialog')).not.toBeNull();
        return promise;
      });

      expect(response).toBe('done');
      expect(screen.queryByTestId('dialog')).toBeNull();
    });
  });

  describe('when the ref element has an infinite animation', () => {
    const Component: FC<ToiProps<string>> = ({ ref, resolve }) => (
      <div
        ref={(element) => {
          ref?.(element);
          element?.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 50, iterations: Infinity });
        }}
      >
        <button type="button" onClick={() => resolve('done')}>close</button>
      </div>
    );

    it('should resolve without waiting for the animation to finish', async () => {
      const [promise] = await act(() => [toi(Component)]);

      const response = await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'close' }));
        return promise;
      });

      expect(response).toBe('done');
    });
  });

  describe('toi.fn', () => {
    describe('when the bound function is called', () => {
      const Component: FC<ToiProps<number>> = ({ ref, resolve }) => (
        <button type="button" ref={ref} onClick={() => resolve(42)}>go</button>
      );
      const confirm = toi.fn(Component);

      it('should mount the bound component and resolve like toi does', async () => {
        const [promise] = await act(() => [confirm()]);

        const response = await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: 'go' }));
          return promise;
        });

        expect(response).toBe(42);
      });
    });
  });
});

describe('ToiHost', () => {
  beforeEach(() => {
    render(<ToiHost />);
  });

  describe('when there are no pending requests', () => {
    it('should render nothing', () => {
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('when there are multiple pending requests', () => {
    const Component: FC<ToiProps<string> & { label: string }> = ({ ref, resolve, label }) => (
      <button type="button" ref={ref} onClick={() => resolve(label)}>{label}</button>
    );

    it('should render all of them and resolve them independently', async () => {
      const [promiseA, promiseB] = await act(() => [
        toi<string>((props) => <Component {...props} label="a" />),
        toi<string>((props) => <Component {...props} label="b" />),
      ]);

      expect(screen.getAllByRole('button')).toHaveLength(2);

      const responseA = await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'a' }));
        return promiseA;
      });
      expect(responseA).toBe('a');
      expect(screen.queryAllByRole('button')).toHaveLength(1);

      const responseB = await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'b' }));
        return promiseB;
      });
      expect(responseB).toBe('b');
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
  });
});
