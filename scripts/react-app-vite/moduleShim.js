// Shim for node:module in browser environments.
// Some libraries (e.g., markdown-to-jsx v9) import createRequire but never use it.
// This provides a stub that throws if actually called.
export const createRequire = () => {
  throw new Error('createRequire is not available in browser environments');
};

export default {};
