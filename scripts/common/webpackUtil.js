#!/usr/bin/env node


const chalk = require('chalk');
const notifier = require('node-notifier');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const rimraf = require('rimraf');
const webpack = require('webpack');

const createCompiler = (config, isWatching = false, onBuild = undefined, onPostBuild = undefined, showNotifications = true) => {
  const showAndThrowError = (error) => {
    console.log(chalk.red(error));
    // TODO(krish): get the name from stats and move these functions out
    if (showNotifications) {
      notifier.notify({ title: config.name, message: 'Error compiling!' });
    }
    process.exitCode = 1;
    throw new Error('Error compiling!');
  };

  const processOutput = (err, stats) => {
    if (err && !err.message) {
      showAndThrowError(err);
    }
    const statsJson = stats.toJson({ moduleTrace: false }, true);
    // NOTE(krishan711): temporary fix for webpack 5: https://github.com/facebook/create-react-app/issues/9880
    const errors = err ? { errors: [err.message], warnings: [] } : { errors: statsJson.errors.map((e) => e.message), warnings: statsJson.warnings.map((e) => e.message) };
    const messages = formatWebpackMessages(errors);
    return messages;
  };

  rimraf.sync(config.output.path);
  const compiler = webpack({ ...config, bail: !isWatching });

  compiler.hooks.invalid.tap('webpackUtil', () => {
    console.log(`Building ${config.name}...\n`);
    if (showNotifications) {
      notifier.notify({ title: config.name, message: 'Building...' });
    }
  });

  compiler.hooks.failed.tap('webpackUtil', (error) => {
    process.exitCode = 1;
    console.log(chalk.red(`Failed to build ${config.name}: ${error}\nFull details:`));
    console.log(error);
  });

  compiler.hooks.done.tap('webpackUtil', (stats) => {
    // TODO(krishan711): why is the first param null here, when does processOutput get used with errors??
    const messages = processOutput(null, stats);
    if (messages.errors.length > 0) {
      showAndThrowError(messages.errors[0]);
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

const createAndRunCompiler = (config, isWatching = false, onBuild = undefined, onPostBuild = undefined, showNotifications = true) => {
  return new Promise((resolve, reject) => {
    createCompiler(config, isWatching, onBuild, onPostBuild, showNotifications).run((err, stats) => {
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
