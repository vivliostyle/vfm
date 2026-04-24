/**
 * Like `Partial<T>` but also permits explicit `undefined` assignment under
 * `exactOptionalPropertyTypes: true`.
 */
export type LaxPartial<T> = { [K in keyof T]?: T[K] | undefined };
