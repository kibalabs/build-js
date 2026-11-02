import fs from 'node:fs';

let sass = null;
const loadSass = async () => {
  if (sass === null) {
    try {
      sass = await import('sass');
    } catch {
      return null;
    }
  }
  return sass;
};

// NOTE(krishan711): rolldown no longer bundles css (https://github.com/rolldown/rolldown/issues/4271)
// so this compiles each imported style file, replaces it with an empty js module and emits the
// styles of each entry (in module order, like vite does) as a css file next to the entry's chunk.
// An entry's styles include the ones in the chunks it imports (statically or dynamically, since
// users load the css up front), so styles in shared or lazily loaded chunks aren't lost and those
// chunks don't get css files of their own. With several entries, the other entries only get the
// styles that aren't already in the base entry's css (e.g. dist/toast/index.css is used on top of
// dist/index.css).
export const sassPlugin = ({ baseEntryName = 'index' } = {}) => {
  const moduleStyles = new Map();
  return {
    name: 'sass',
    buildStart() {
      moduleStyles.clear();
    },
    async load(id) {
      if (!id.endsWith('.scss') && !id.endsWith('.css')) {
        return null;
      }
      let css;
      if (id.endsWith('.scss')) {
        const sassModule = await loadSass();
        if (!sassModule) {
          return null;
        }
        const result = sassModule.compile(id, {
          style: 'expanded',
          loadPaths: ['node_modules'],
        });
        css = result.css;
      } else {
        css = fs.readFileSync(id, 'utf8');
      }
      moduleStyles.set(id, css);
      return {
        code: '',
        moduleType: 'js',
        moduleSideEffects: 'no-treeshake',
      };
    },
    generateBundle(outputOptions, bundle) {
      const chunks = Object.values(bundle).filter((chunk) => chunk.type === 'chunk');
      const chunksByFileName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
      const collectStyleModuleIds = (chunk, visitedFileNames = new Set(), styleModuleIds = new Set()) => {
        if (visitedFileNames.has(chunk.fileName)) {
          return styleModuleIds;
        }
        visitedFileNames.add(chunk.fileName);
        // NOTE(krishan711): imported chunks run before the importing chunk so their styles come first
        chunk.imports.forEach((importedFileName) => {
          const importedChunk = chunksByFileName.get(importedFileName);
          if (importedChunk) {
            collectStyleModuleIds(importedChunk, visitedFileNames, styleModuleIds);
          }
        });
        chunk.moduleIds.filter((moduleId) => moduleStyles.has(moduleId)).forEach((moduleId) => styleModuleIds.add(moduleId));
        chunk.dynamicImports.forEach((importedFileName) => {
          const importedChunk = chunksByFileName.get(importedFileName);
          if (importedChunk) {
            collectStyleModuleIds(importedChunk, visitedFileNames, styleModuleIds);
          }
        });
        return styleModuleIds;
      };
      const entryChunks = chunks.filter((chunk) => chunk.isEntry);
      const baseEntryChunk = entryChunks.length > 1 ? entryChunks.find((chunk) => chunk.isEntry && chunk.name === baseEntryName) : undefined;
      const baseStyleModuleIds = baseEntryChunk ? collectStyleModuleIds(baseEntryChunk) : new Set();
      entryChunks.forEach((chunk) => {
        const styleModuleIds = chunk === baseEntryChunk ? baseStyleModuleIds : collectStyleModuleIds(chunk);
        const chunkStyles = [...styleModuleIds].filter((moduleId) => chunk === baseEntryChunk || !baseStyleModuleIds.has(moduleId)).map((moduleId) => moduleStyles.get(moduleId));
        if (chunkStyles.length === 0) {
          return;
        }
        this.emitFile({
          type: 'asset',
          fileName: chunk.fileName.replace(/\.(m|c)?js$/, '.css'),
          source: `${chunkStyles.join('\n')}\n`,
        });
      });
    },
  };
};
