const { RawSource } = require('webpack-sources');

class CreateRuntimeConfigPlugin {
  constructor(vars = {}, filename = 'runtimeConfig.js') {
    this.vars = vars;
    this.filename = filename;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('CreateRuntimeConfigPlugin', (compilation) => {
      compilation.hooks.additionalAssets.tap('CreateRuntimeConfigPlugin', (callback) => {
        // let fileContent = 'const GLOBAL = typeof window !== "undefined" ? window : global;\n';
        // Object.keys(this.vars).forEach((key) => {
        //   fileContent += `GLOBAL.${key} = ${JSON.stringify(this.vars[key])};\n`;
        // });

        // compilation.emitAsset(
        //   this.filename,
        //   new RawSource(fileContent)
        // );
      });
    });
  }

  // compiler.hooks.processAssets.tapAsync('CreateRuntimeConfigPlugin', (compilation, callback) => {
  //   // compilation.assets[this.filename] = {
  //   //   source() {
  //   //     return fileContent;
  //   //   },
  //   //   size() {
  //   //     return fileContent.length;
  //   //   },
  //   // };

  //   callback();
  // });
}

module.exports = CreateRuntimeConfigPlugin;
