// Ambient declarations for third-party JS modules that ship without TypeScript types.
// These libraries are consumed via default imports; typing their default export as
// `any` preserves the existing untyped usage under `noImplicitAny`.

declare module 'draggable' {
  const Draggable: any;
  export default Draggable;
}

declare module 'seedrandom' {
  const seedrandom: any;
  export default seedrandom;
}

declare module '@yaireo/tagify' {
  const Tagify: any;
  export default Tagify;
}
