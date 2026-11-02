# Build-JS

This is Kiba Lab's toolset to build JavaScript and Typescript projects. It serves (roughly) the same purpose as react-scripts and is just as opinionated, but in a different way.

For use, see other projects. We will update this README over time :)

## Modules with several entries

`build-module-rolldown` builds `src/index.ts` into `dist/index.js` by default. For a package with subpath exports (e.g. `@kibalabs/core/web3`), set `entries` in the config modifier to map output names to source files:

```js
export default (config) => {
  const newConfig = config;
  newConfig.entries = {
    index: './src/index.ts',
    'web3/index': './src/web3/index.ts',
  };
  return newConfig;
};
```

This builds `dist/index.js` and `dist/web3/index.js` (with their type declarations), with the code they share in `dist/chunks/`. Each entry gets a css file with all the styles it uses (including the ones of lazily loaded code), apart from the ones already in `dist/index.css`, so `dist/web3/index.css` is used on top of `dist/index.css`.

## App vendor chunks

`build-react-app-vite` puts each package with at least 100KB of code into its own `vendor-<package>` chunk and the smaller packages needed up front into `vendor-small` (smaller ones only used lazily stay with the code that uses them). Kibalabs packages get a chunk per entry (e.g. `vendor-kibalabs-core-web3`). A chunk only holds its own package's code, so it only changes when that package does and lazily loaded packages aren't loaded up front.
