import { getNodeModuleName } from '../util.js';

const NODE_MODULES_PATTERN = /[\\/]node_modules[\\/]/;
const KIBALABS_PACKAGE_PATTERN = /[\\/]node_modules[\\/]@kibalabs[\\/]/;

const getChunkSafeName = (value) => value.replace(/^@/, '').replace(/[\\/]/g, '-');

// NOTE(krishan711): a kibalabs package with several entries (e.g. @kibalabs/core and @kibalabs/core/web3)
// is built into dist/<entry>/index.js, with code shared between entries in dist/chunks/<name>-<hash>.js
// (named after the entry the code is from), so this names a chunk per entry, e.g. vendor-kibalabs-core-web3.
export const getKibalabsChunkName = (moduleId) => {
  const packageName = getNodeModuleName(moduleId);
  const normalizedModuleId = moduleId.replace(/\\/g, '/').split('?')[0];
  const packageDirectory = `node_modules/${packageName}/`;
  const packageFilePath = normalizedModuleId.substring(normalizedModuleId.lastIndexOf(packageDirectory) + packageDirectory.length);
  const pathParts = packageFilePath.split('/');
  const distIndex = pathParts.indexOf('dist');
  let entryName = null;
  if (distIndex >= 0 && pathParts.length > distIndex + 2) {
    entryName = pathParts[distIndex + 1] === 'chunks' ? pathParts[distIndex + 2].replace(/-[\w-]{8}\.js$/, '') : pathParts[distIndex + 1];
  }
  if (entryName && entryName !== 'index') {
    return `vendor-${getChunkSafeName(packageName)}-${getChunkSafeName(entryName)}`;
  }
  return `vendor-${getChunkSafeName(packageName)}`;
};

// NOTE(krishan711): Rolldown treats each name() return value as a separate code-splitting group, so
// minSize is evaluated per returned chunk name. Packages that are at least largePackageSize (measured
// as the code of their modules in this build) get their own vendor chunk (and a -lazy one for the parts
// only used by lazily loaded code) and smaller packages that are
// needed up front share vendor-small (smaller ones only used lazily stay with the chunks that use them).
// Each module goes to its own package's chunk (includeDependenciesRecursively: false), otherwise the first
// package captured takes all its dependencies with it (e.g. a lazily loaded package taking a dependency
// the app needs up front, so it gets loaded up front too) and chunks change whenever any of them change.
// strictExecutionOrder keeps the modules running in the same order as before they were split up.
// kibalabs packages get a chunk per entry, so their releases don't change the third-party chunks.
export const createVendorChunking = ({ largePackageSize = 100 * 1024 } = {}) => {
  const packageSizes = new Map();
  const plugin = {
    name: 'kiba-vendor-chunks',
    apply: 'build',
    buildEnd() {
      packageSizes.clear();
      [...this.getModuleIds()].forEach((moduleId) => {
        if (!NODE_MODULES_PATTERN.test(moduleId)) {
          return;
        }
        const moduleInfo = this.getModuleInfo(moduleId);
        const packageName = getNodeModuleName(moduleId);
        packageSizes.set(packageName, (packageSizes.get(packageName) || 0) + (moduleInfo?.code?.length || 0));
      });
    },
  };
  const isLargePackage = (moduleId) => (packageSizes.get(getNodeModuleName(moduleId)) || 0) >= largePackageSize;
  const codeSplitting = {
    includeDependenciesRecursively: false,
    groups: [{
      debugName: 'vendor-kibalabs',
      name: getKibalabsChunkName,
      test: KIBALABS_PACKAGE_PATTERN,
      priority: 30,
    }, {
      // NOTE(krishan711): the parts of a large package that are needed up front and the parts only used
      // lazily go into separate chunks, otherwise the lazy parts get loaded up front with the rest
      debugName: 'vendor-large',
      name: (moduleId) => `vendor-${getChunkSafeName(getNodeModuleName(moduleId))}`,
      test: (moduleId) => NODE_MODULES_PATTERN.test(moduleId) && isLargePackage(moduleId),
      tags: ['$initial'],
      priority: 20,
    }, {
      debugName: 'vendor-large-lazy',
      name: (moduleId) => `vendor-${getChunkSafeName(getNodeModuleName(moduleId))}-lazy`,
      test: (moduleId) => NODE_MODULES_PATTERN.test(moduleId) && isLargePackage(moduleId),
      priority: 15,
    }, {
      name: 'vendor-small',
      test: NODE_MODULES_PATTERN,
      tags: ['$initial'],
      priority: 10,
    }],
  };
  return { plugin, codeSplitting, strictExecutionOrder: true };
};
