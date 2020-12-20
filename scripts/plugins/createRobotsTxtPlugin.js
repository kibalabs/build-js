
class CreateRobotsTxtPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('CreateRuntimeConfigPlugin', (compilation, callback) => {
      const filename = 'robots.txt';
      const fileContent = 'User-agent: *\nDisallow:\n';
      compilation.assets[filename] = {
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

module.exports = CreateRobotsTxtPlugin;
