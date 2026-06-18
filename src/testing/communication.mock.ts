/**
 * Test stub for `@pundit/communication`.
 *
 * The real package is a networking layer (HTTP providers, fetch adapter) that
 * unit tests must not load — doing so couples specs to a heavy ESM dependency
 * and makes them slow and brittle. Jest's `moduleNameMapper` redirects
 * `@pundit/communication` here at runtime.
 *
 * Only the runtime API namespaces need stubbing; everything else the library
 * exports is types, which are erased at compile time (and still resolve against
 * the real .d.ts, since moduleNameMapper does not affect type-checking).
 *
 * Each namespace method is a `jest.fn()` returning `undefined`. A spec that
 * actually exercises a communication call should set its own return value, e.g.
 * `(notebook.create as jest.Mock).mockResolvedValue(...)`.
 */
const apiNamespace = () => new Proxy({}, {
  get: () => jest.fn(),
});

export const annotation = apiNamespace();
export const notebook = apiNamespace();
export const social = apiNamespace();
export const auth = apiNamespace();
export const tag = apiNamespace();
export const comment = apiNamespace();

// Mutable settings object (real export is assigned to at runtime in app code).
export const CommunicationSettings: Record<string, unknown> = {};
