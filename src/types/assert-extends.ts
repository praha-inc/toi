/**
 * Resolves to `unknown` (a no-op intersection member) when `T` satisfies `Expected`,
 * or to an unsatisfiable object type otherwise.
 *
 * A plain `T extends Expected` constraint isn't enough on its own: when `T` is
 * inferred (rather than explicitly provided) and fails the constraint, TypeScript silently
 * substitutes `Expected` for `T` instead of erroring, and a component that declares
 * fewer props than `Expected` is structurally assignable to it regardless (since it can
 * safely ignore the props it doesn't use). Intersecting the component type with this
 * guard turns that into a real, unavoidable assignability error.
 */
export type AssertExtends<T, Expected> = T extends Expected ? unknown : never;
