
class CreateRobotsTxtPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CreateRobots', async () => {
      fs.writeFileSync(path.join(compiler.options.output.path, 'robots.txt'), 'User-agent: *\nDisallow:\n');
    });
  }
}

module.exports = CreateRobotsTxtPlugin;
