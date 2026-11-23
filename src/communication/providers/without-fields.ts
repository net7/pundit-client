/**
 * Shallow copy of `data` without the named fields: the BE API answers 422 to
 * fields it does not accept, so each call site states the ones it removes.
 */
export const withoutFields = <T extends object, K extends keyof T>(
  data: T,
  ...fields: K[]
): Omit<T, K> => {
  const copy = { ...data };
  fields.forEach((field) => {
    delete copy[field];
  });
  return copy;
};
