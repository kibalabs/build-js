class CreateRuntimeConfigPlugin {

  constructor(vars = {}, filename = 'runtimeConfig.js') {
    this.vars = vars;
    this.filename = filename;
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('CreateRuntimeConfigPlugin', (compilation, callback) => {
      var fileContent = 'const GLOBAL = typeof window !== "undefined" ? window : global;\n';
      Object.keys(this.vars).forEach((key) => {
        fileContent += `GLOBAL.${key} = ${JSON.stringify(this.vars[key])};\n`;
      });

      compilation.assets[this.filename] = {
        source: function() {
          return fileContent;
        },
        size: function() {
          return fileContent.length;
        }
      };

      callback();
    });
  }
}

module.exports = CreateRuntimeConfigPlugin;
