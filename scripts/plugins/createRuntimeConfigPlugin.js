import { RawSource } from 'webpack-sources';

export class CreateRuntimeConfigPlugin {
  constructor(vars = {}, filename = 'runtimeConfig.js') {
    this.vars = vars;
    this.filename = filename;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('CreateRuntimeConfigPlugin', (compilation) => {
      compilation.hooks.additionalAssets.tap('CreateRuntimeConfigPlugin', () => {
        let fileContent = 'const GLOBAL = typeof window !== "undefined" ? window : global;\n';
        Object.keys(this.vars).forEach((key) => {
          fileContent += `GLOBAL.${key} = ${JSON.stringify(this.vars[key])};\n`;
        });

        compilation.emitAsset(
          this.filename,
          new RawSource(fileContent),
        );
      });
    });
  }
}
