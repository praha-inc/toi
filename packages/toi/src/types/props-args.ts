/**
 * Trailing argument(s) for additional props `Props` a component requires:
 * omittable when every key of `Props` is optional, required otherwise.
 */
export type PropsArgs<Props> = {} extends Props ? [props?: Props] : [props: Props];
