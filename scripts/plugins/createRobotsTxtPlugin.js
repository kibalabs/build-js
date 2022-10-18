import WebpackSources from 'webpack-sources';

const DEFAULT_FILE_CONTENT = 'User-agent: *\nDisallow:\n';

export class CreateRobotsTxtPlugin {
  constructor(fileContent = DEFAULT_FILE_CONTENT) {
    this.filename = 'robots.txt';
    this.fileContent = fileContent;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('CreateRobotsTxtPlugin', (compilation) => {
      compilation.hooks.additionalAssets.tap('CreateRobotsTxtPlugin', () => {
        compilation.emitAsset(this.filename, new WebpackSources.RawSource(this.fileContent));
      });
    });
  }
}
