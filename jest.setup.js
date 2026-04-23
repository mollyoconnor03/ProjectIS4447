// expo/src/winter/installGlobal checks: if (descriptor && !configurable) { return; }
// So declaring these globals as non-configurable prevents expo's runtime.native.ts
// from replacing them with lazy getters that require() modules during jest setup.
['structuredClone', 'TextDecoder', 'URL', 'URLSearchParams', 'TextEncoder'].forEach(name => {
  const existing = global[name];
  if (existing !== undefined) {
    const desc = Object.getOwnPropertyDescriptor(global, name);
    if (desc && desc.configurable) {
      Object.defineProperty(global, name, {
        value: existing,
        writable: true,
        configurable: false,
        enumerable: desc.enumerable !== false,
      });
    }
  }
});

// __ExpoImportMetaRegistry doesn't exist in Node.js — stub it as non-configurable
// so installGlobal exits early and never installs the lazy getter.
Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  value: { url: null },
  writable: true,
  configurable: false,
  enumerable: false,
});
