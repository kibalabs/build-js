#!/usr/bin/env node


const chalk = require('chalk');
const notifier = require('node-notifier');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const rimraf = require('rimraf');
const webpack = require('webpack');

const createCompiler = (config, onBuild = undefined, onPostBuild = undefined, showNotifications = true) => {
  const processOutput = (stats) => {
    const statsJson = stats.toJson({ moduleTrace: false }, true);
    // NOTE(krishan711): temporary fix for webpack 5: https://github.com/facebook/create-react-app/issues/9880
    const errors = { errors: statsJson.errors.map((e) => e.message), warnings: statsJson.warnings.map((e) => e.message) };
    const messages = formatWebpackMessages(errors);
    return messages;
  };

  rimraf.sync(config.output.path);
  const compiler = webpack(config);

  compiler.hooks.invalid.tap('webpackUtil', () => {
    console.log(`Building ${config.name}...\n`);
    if (showNotifications) {
      notifier.notify({ title: config.name, message: 'Building...' });
    }
  });

  compiler.hooks.failed.tap('webpackUtil', (error) => {
    console.log(chalk.red(`Failed to build ${config.name}`));
    console.log('Details:');
    console.log(error);
    process.exitCode = 1;
    return;
  });

  compiler.hooks.done.tap('webpackUtil', (stats) => {
    const messages = processOutput(stats);
    if (messages.errors.length > 0) {
      console.log(chalk.red(messages.errors[0]));
      // TODO(krish): get the name from stats and move these functions out
      if (showNotifications) {
        notifier.notify({ title: config.name, message: 'Error compiling!' });
      }
      process.exitCode = 1;
      return;
    }
    if (onBuild) {
      onBuild();
    }
    if (messages.warnings.length > 0) {
      console.log(chalk.yellow(messages.warnings.join('\n\n')));
      if (showNotifications) {
        notifier.notify({ title: config.name, message: `Built with ${messages.warnings.length} warnings` });
      }
    } else {
      console.log(chalk.green(`Successfully built ${config.name} 🚀\n`));
      if (showNotifications) {
        notifier.notify({ title: config.name, message: 'Successfully built 🚀' });
      }
    }

    if (onPostBuild) {
      onPostBuild();
    }
  });

  return compiler;
};

const createAndRunCompiler = (config, onBuild = undefined, onPostBuild = undefined, showNotifications = true) => {
  return new Promise((resolve, reject) => {
    createCompiler(config, onBuild, onPostBuild, showNotifications).run((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err);
      }
      return resolve(stats.toJson());
    });
  });
};

module.exports = {
  createCompiler,
  createAndRunCompiler,
};
