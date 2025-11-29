import fs from 'node:fs';
import path from 'node:path';

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

export const sassPlugin = {
  name: 'sass',
  async resolveId(source, importer) {
    if (!source.endsWith('.scss')) {
      return null;
    }
    const sassModule = await loadSass();
    if (!sassModule) {
      return null;
    }
    const resolved = path.resolve(path.dirname(importer || ''), source);
    return resolved.replace('.scss', '.css');
  },
  async load(id) {
    if (!id.endsWith('.css')) {
      return null;
    }
    const scssPath = id.replace('.css', '.scss');
    if (!fs.existsSync(scssPath)) {
      return null;
    }
    const sassModule = await loadSass();
    if (!sassModule) {
      return null;
    }
    const result = sassModule.compile(scssPath, {
      style: 'expanded',
      loadPaths: ['node_modules'],
    });
    return result.css;
  },
};
