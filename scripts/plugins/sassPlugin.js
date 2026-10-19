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
// styles of each chunk (in module order, like vite does) as a css file next to the chunk.
export const sassPlugin = () => {
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
      Object.values(bundle).forEach((chunk) => {
        if (chunk.type !== 'chunk') {
          return;
        }
        const chunkStyles = chunk.moduleIds.filter((moduleId) => moduleStyles.has(moduleId)).map((moduleId) => moduleStyles.get(moduleId));
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
