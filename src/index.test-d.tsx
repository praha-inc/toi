import { describe, expectTypeOf, test } from 'vitest';

import { toi } from './index';

import type { ToiProps } from './index';
import type { FC } from 'react';

describe('toi', () => {
  describe('when calling toi with a predefined component', () => {
    // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
    test('should error when the component has no resolve prop', () => {
      type TestProps = { placeholder?: never };
      const Test: FC<TestProps> = () => null;

      // @ts-expect-error -- TestProps has no `resolve` matching `ToiResolve`
      void toi(Test);
    });

    test('should infer the response type when the component has a resolve prop', () => {
      type TestProps = { resolve: (response: boolean) => void };
      const Test: FC<TestProps> = () => null;

      const result = toi(Test);
      expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
    });

    // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
    test('should error when a required additional prop is not passed', () => {
      type TestProps = { resolve: (response: boolean) => void; additionalProp: string };
      const Test: FC<TestProps> = () => null;

      // @ts-expect-error -- TestProps.additionalProp is required but not passed
      void toi(Test);
    });

    test('should infer the response type when a required additional prop is passed', () => {
      type TestProps = { resolve: (response: boolean) => void; additionalProp: string };
      const Test: FC<TestProps> = () => null;

      const result = toi(Test, { additionalProp: 'test' });
      expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
    });

    test('should not error when an optional additional prop is omitted', () => {
      type TestProps = { resolve: (response: boolean) => void; additionalProp?: string | undefined };
      const Test: FC<TestProps> = () => null;

      const result = toi(Test);
      expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
    });

    test('should not error when an optional additional prop is passed', () => {
      type TestProps = { resolve: (response: boolean) => void; additionalProp?: string | undefined };
      const Test: FC<TestProps> = () => null;

      const result = toi(Test, { additionalProp: 'test' });
      expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
    });
  });

  describe('when calling toi with explicit generics for an inline component', () => {
    test('should infer the response type from the first generic', () => {
      type TestProps = ToiProps<boolean>;
      const Test: FC<TestProps> = () => null;

      const result = toi<boolean>((props) => <Test {...props} />);
      expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
    });

    test('should allow additional props via the second generic', () => {
      type TestProps = ToiProps<boolean> & { additionalProp: string };
      const Test: FC<TestProps> = () => null;

      const result = toi<boolean, TestProps>((props) => <Test {...props} />, { additionalProp: 'test' });
      expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
    });

    // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
    test('should error when a required additional prop is not passed', () => {
      type TestProps = ToiProps<boolean> & { additionalProp: string };
      const Test: FC<TestProps> = () => null;

      // @ts-expect-error -- TestProps' required `additionalProp` is not passed
      void toi<boolean, TestProps>((props) => <Test {...props} />);
    });

    test('should not error when an optional additional prop is omitted', () => {
      type TestProps = ToiProps<boolean> & { additionalProp?: string | undefined };
      const Test: FC<TestProps> = () => null;

      const result = toi<boolean, TestProps>((props) => <Test {...props} />);
      expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
    });

    test('should not error when an optional additional prop is passed', () => {
      type TestProps = ToiProps<boolean> & { additionalProp?: string | undefined };
      const Test: FC<TestProps> = () => null;

      const result = toi<boolean, TestProps>((props) => <Test {...props} />, { additionalProp: 'test' });
      expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
    });

    // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
    test('should error when the explicit Props resolve type does not match the Response generic', () => {
      type TestProps = ToiProps<string> & { additionalProp: string };
      const Test: FC<TestProps> = () => null;

      // @ts-expect-error -- TestProps' `resolve` expects `string`, but `Response` is declared as `boolean`
      void toi<boolean, TestProps>((props) => <Test {...props} />, { additionalProp: 'test' });
    });
  });

  describe('toi.fn', () => {
    describe('when calling toi.fn with a predefined component', () => {
      // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
      test('should error when the component has no resolve prop', () => {
        type TestProps = { placeholder?: never };
        const Test: FC<TestProps> = () => null;

        // @ts-expect-error -- TestProps has no `resolve` matching `ToiResolve`
        void toi.fn(Test);
      });

      test('should infer the response type when the component has a resolve prop', () => {
        type TestProps = { resolve: (response: boolean) => void };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn(Test);

        expectTypeOf(fn).returns.resolves.toEqualTypeOf<boolean>();
      });

      // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
      test('should error when a required additional prop is not passed', () => {
        type TestProps = { resolve: (response: boolean) => void; additionalProp: string };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn(Test);

        // @ts-expect-error -- TestProps.additionalProp is required but not passed
        void fn();
      });

      test('should infer the response type when a required additional prop is passed', () => {
        type TestProps = { resolve: (response: boolean) => void; additionalProp: string };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn(Test);

        const result = fn({ additionalProp: 'test' });
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      test('should not error when an optional additional prop is omitted', () => {
        type TestProps = { resolve: (response: boolean) => void; additionalProp?: string | undefined };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn(Test);

        const result = fn();
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      test('should not error when an optional additional prop is passed', () => {
        type TestProps = { resolve: (response: boolean) => void; additionalProp?: string | undefined };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn(Test);

        const result = fn({ additionalProp: 'test' });
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      describe('when given default props as the second argument', () => {
        test('should not error when a required prop has a default value and is omitted', () => {
          type TestProps = { resolve: (response: boolean) => void; additionalProp: string };
          const Test: FC<TestProps> = () => null;
          const fn = toi.fn(Test, { additionalProp: 'test' });

          const result = fn();
          expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
        });

        test('should allow overriding the default value', () => {
          type TestProps = { resolve: (response: boolean) => void; additionalProp: string };
          const Test: FC<TestProps> = () => null;
          const fn = toi.fn(Test, { additionalProp: 'test' });

          const result = fn({ additionalProp: 'override' });
          expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
        });
      });
    });

    describe('when calling toi.fn with explicit generics for an inline component', () => {
      test('should infer the response type from the first generic', () => {
        type TestProps = ToiProps<boolean>;
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn<boolean>((props) => <Test {...props} />);

        const result = fn();
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      test('should allow additional props via the second generic', () => {
        type TestProps = ToiProps<boolean> & { additionalProp: string };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn<boolean, TestProps>((props) => <Test {...props} />);

        const result = fn({ additionalProp: 'test' });
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
      test('should error when a required additional prop is not passed', () => {
        type TestProps = ToiProps<boolean> & { additionalProp: string };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn<boolean, TestProps>((props) => <Test {...props} />);

        // @ts-expect-error -- TestProps.additionalProp is required but not passed
        void fn();
      });

      test('should not error when an optional additional prop is omitted', () => {
        type TestProps = ToiProps<boolean> & { additionalProp?: string | undefined };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn<boolean, TestProps>((props) => <Test {...props} />);

        const result = fn();
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      test('should not error when an optional additional prop is passed', () => {
        type TestProps = ToiProps<boolean> & { additionalProp?: string | undefined };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn<boolean, TestProps>((props) => <Test {...props} />);

        const result = fn({ additionalProp: 'test' });
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
      test('should error when the explicit Props resolve type does not match the Response generic', () => {
        type TestProps = ToiProps<string> & { additionalProp: string };
        const Test: FC<TestProps> = () => null;

        // @ts-expect-error -- TestProps' `resolve` expects `string`, but `Response` is declared as `boolean`
        void toi.fn<boolean, TestProps>((props) => <Test {...props} />);
      });
    });

    describe('when toi.fn is given default props as its second argument', () => {
      test('should not error when a required prop has a default value and is omitted', () => {
        type TestProps = ToiProps<boolean> & { additionalProp: string };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn<boolean, TestProps>((props) => <Test {...props} />, { additionalProp: 'test' });

        const result = fn();
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      test('should allow overriding the default value', () => {
        type TestProps = ToiProps<boolean> & { additionalProp: string };
        const Test: FC<TestProps> = () => null;
        const fn = toi.fn<boolean, TestProps>((props) => <Test {...props} />, { additionalProp: 'test' });

        const result = fn({ additionalProp: 'override' });
        expectTypeOf(result).resolves.toEqualTypeOf<boolean>();
      });

      // oxlint-disable-next-line vitest/expect-expect -- assertion is the `@ts-expect-error` below
      test('should error when the explicit Props resolve type does not match the Response generic', () => {
        type TestProps = ToiProps<string> & { additionalProp: string };
        const Test: FC<TestProps> = () => null;

        // @ts-expect-error -- TestProps' `resolve` expects `string`, but `Response` is declared as `boolean`
        void toi.fn<boolean, TestProps>((props) => <Test {...props} />, { additionalProp: 'test' });
      });
    });
  });
});
