
class CreateRobotsTxtPlugin {
  constructor(filename = 'robots.txt') {
    this.filename = filename;
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('CreateRuntimeConfigPlugin', (compilation, callback) => {
      const fileContent = 'User-agent: *\nDisallow:\n';
      // eslint-disable-next-line no-param-reassign
      compilation.assets[this.filename] = {
        source() {
          return fileContent;
        },
        size() {
          return fileContent.length;
        },
      };

      callback();
    });
  }
}

module.exports = CreateRobotsTxtPlugin;
