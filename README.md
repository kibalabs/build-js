# @kibalabs/build

Kiba Labs' opinionated tooling to build, lint, type-check and publish TypeScript projects (React apps, libraries and Node servers), on Vite and Rolldown.

## Install

```bash
npm install --save-dev @kibalabs/build
```

Requires Node 22.12+.

## Commands

| Command | Does |
| --- | --- |
| `build-react-app-vite` | Builds a React app from `src/index.tsx` into `dist/` (`--start` runs the dev server) |
| `build-module-rolldown` | Builds a library from `src/index.ts` into `dist/` with type declarations and css |
| `build-server` | Builds a Node server from `src/index.ts` into `dist/` |
| `lint` | ESLint and Stylelint (`--fix` to fix) |
| `type-check` | Type-checks `src/` |
| `kiba-publish` | Publishes to npm (`--next` for a prerelease) |

Production builds need `NODE_ENV=production`.

## Configuration

Every build command takes `--config-modifier <file>`, a module whose default export changes the build's config:

```js
// config.build.js
export default (config) => {
  const newConfig = config;
  newConfig.title = 'My App';
  newConfig.viteConfigModifier = (viteConfig) => viteConfig;
  return newConfig;
};
```

- Apps: `title`, `seoTags` (`MetaTag`/`Tag` from `@kibalabs/build/scripts/react-app-vite/injectSeoPlugin.js`), `viteConfigModifier`, `analyzeBundle`. Environment variables starting with `KRT_` are set on `window` at runtime.
- Libraries: `entries`, `rolldownConfigModifier`.

## Libraries with several entries

For subpath exports (e.g. `@kibalabs/core/web3`), map output names to source files:

```js
newConfig.entries = {
  index: './src/index.ts',
  'web3/index': './src/web3/index.ts',
};
```

This builds `dist/index.js` and `dist/web3/index.js` with their type declarations, and shared code in `dist/chunks/`. Each entry's css has all the styles it uses (including lazily loaded code's), minus the ones already in `dist/index.css`, so it's used on top of it.

## App vendor chunks

Each package with 100KB+ of code gets its own `vendor-<package>` chunk (`vendor-<package>-lazy` for the parts only lazy code uses). Smaller packages needed up front share `vendor-small`, and the rest stay with the code that uses them. Kibalabs packages get a chunk per entry (e.g. `vendor-kibalabs-core-web3`). A chunk only holds its own package's code, so it only changes when that package does.

## Development

```bash
make install
make lint-check
```
