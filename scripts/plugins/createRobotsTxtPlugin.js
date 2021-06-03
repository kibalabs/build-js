const { RawSource } = require('webpack-sources');

const DEFAULT_FILE_CONTENT = 'User-agent: *\nDisallow:\n';

class CreateRobotsTxtPlugin {
  constructor(fileContent = DEFAULT_FILE_CONTENT) {
    this.filename = 'robots.txt';
    this.fileContent = fileContent;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('CreateRobotsTxtPlugin', (compilation) => {
      compilation.hooks.additionalAssets.tap('CreateRobotsTxtPlugin', () => {
        compilation.emitAsset(
          this.filename,
          new RawSource(this.fileContent),
        );
      });
    });
  }
}

module.exports = CreateRobotsTxtPlugin;
