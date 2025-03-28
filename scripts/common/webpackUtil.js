#!/usr/bin/env node
import chalk from 'chalk';
import notifier from 'node-notifier';
import { rimraf } from 'rimraf';
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin';
import webpack from 'webpack';


const friendlySyntaxErrorLabel = 'Syntax error:';

// NOTE(krishan711): copied from https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/formatWebpackMessages.js
const formatMessage = (webpackMessage) => {
  let lines = [];
  if (typeof webpackMessage === 'string') {
    lines = webpackMessage.split('\n');
  } else if ('message' in webpackMessage) {
    lines = webpackMessage.message.split('\n');
  } else if (Array.isArray(webpackMessage)) {
    webpackMessage.forEach((message) => {
      if ('message' in message) {
        lines = message.message.split('\n');
      }
    });
  }

  // Strip webpack-added headers off errors/warnings
  // https://github.com/webpack/webpack/blob/master/lib/ModuleError.js
  lines = lines.filter((line) => !/Module [A-z ]+\(from/.test(line));

  // Transform parsing error into syntax error
  lines = lines.map((line) => {
    const parsingError = /Line (\d+):(?:(\d+):)?\s*Parsing error: (.+)$/.exec(line);
    if (!parsingError) {
      return line;
    }
    const [, errorLine, errorColumn, errorMessage] = parsingError;
    return `${friendlySyntaxErrorLabel} ${errorMessage} (${errorLine}:${errorColumn})`;
  });

  let message = lines.join('\n');
  // Smoosh syntax errors (commonly found in CSS)
  message = message.replace(/SyntaxError\s+\((\d+):(\d+)\)\s*(.+?)\n/g, `${friendlySyntaxErrorLabel} $3 ($1:$2)\n`);
  // Clean up export errors
  message = message.replace(/^.*export '(.+?)' was not found in '(.+?)'.*$/gm, 'Attempted import error: \'$1\' is not exported from \'$2\'.');
  message = message.replace(/^.*export 'default' \(imported as '(.+?)'\) was not found in '(.+?)'.*$/gm, 'Attempted import error: \'$2\' does not contain a default export (imported as \'$1\').');
  message = message.replace(/^.*export '(.+?)' \(imported as '(.+?)'\) was not found in '(.+?)'.*$/gm, 'Attempted import error: \'$1\' is not exported from \'$3\' (imported as \'$2\').');
  lines = message.split('\n');

  // Remove leading newline
  if (lines.length > 2 && lines[1].trim() === '') {
    lines.splice(1, 1);
  }
  // Clean up file name
  lines[0] = lines[0].replace(/^(.*) \d+:\d+-\d+$/, '$1');

  // Cleans up verbose "module not found" messages for files and packages.
  if (lines[1] && lines[1].indexOf('Module not found: ') === 0) {
    lines = [
      lines[0],
      lines[1]
        .replace('Error: ', '')
        .replace('Module not found: Cannot find file:', 'Cannot find file:'),
    ];
  }

  // Add helpful message for users trying to use Sass for the first time
  if (lines[1] && lines[1].match(/Cannot find module.+sass/)) {
    lines[1] = 'To import Sass files, you first need to install sass.\n';
    lines[1] += 'Run `npm install sass` or `yarn add sass` inside your workspace.';
  }

  message = lines.join('\n');
  // Internal stacks are generally useless so we strip them... with the
  // exception of stacks containing `webpack:` because they're normally
  // from user code generated by webpack. For more information see
  // https://github.com/facebook/create-react-app/pull/1050
  message = message.replace(/^\s*at\s((?!webpack:).)*:\d+:\d+[\s)]*(\n|$)/gm, ''); // at ... ...:x:y
  message = message.replace(/^\s*at\s<anonymous>(\n|$)/gm, ''); // at <anonymous>
  lines = message.split('\n');

  // Remove duplicated newlines
  lines = lines.filter((line, index, arr) => index === 0 || line.trim() !== '' || line.trim() !== arr[index - 1].trim());

  // Reassemble the message
  message = lines.join('\n');
  return message.trim();
};

const isLikelyASyntaxError = (message) => {
  return message.indexOf(friendlySyntaxErrorLabel) !== -1;
};

const formatWebpackMessages = (stats) => {
  const statsJson = stats.toJson({}, true);
  const formattedErrors = statsJson.errors.map((error) => formatMessage(error));
  const formattedWarnings = statsJson.warnings.map((error) => formatMessage(error));
  const result = { errors: formattedErrors, warnings: formattedWarnings };
  // If there are any syntax errors, return just them and throw others away.
  if (result.errors.some(isLikelyASyntaxError)) {
    result.errors = result.errors.filter(isLikelyASyntaxError);
  }
  return result;
};

export const createCompiler = (config, onBuild = undefined, onPostBuild = undefined, showNotifications = true, analyzeSpeed = false) => {
  let newConfig = config;
  if (newConfig.output.clean) {
    // NOTE(krishan711): this shouldn't be needed but if its removed the assets plugin doesn't work
    rimraf.sync(newConfig.output.path);
  }

  if (analyzeSpeed) {
    const speedMeasurePlugin = new SpeedMeasurePlugin();
    newConfig = speedMeasurePlugin.wrap(newConfig);
  }

  const compiler = webpack(newConfig);
  compiler.hooks.compile.tap('webpackUtil', () => {
    console.log(`Building ${newConfig.name}...`);
    if (showNotifications) {
      notifier.notify({ title: newConfig.name, message: 'Building...' });
    }
  });
  compiler.hooks.failed.tap('webpackUtil', (error) => {
    console.log(chalk.red(`Failed to build ${newConfig.name}`));
    console.log('Details:');
    console.log(error);
    process.exitCode = 1;
  });
  compiler.hooks.done.tap('webpackUtil', (stats) => {
    const messages = formatWebpackMessages(stats);
    if (messages.errors.length > 0) {
      console.log(chalk.red(messages.errors[0]));
      if (showNotifications) {
        notifier.notify({ title: newConfig.name, message: 'Error compiling!' });
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
        notifier.notify({ title: newConfig.name, message: `Built with ${messages.warnings.length} warnings` });
      }
    } else {
      console.log(chalk.green(`Successfully built ${newConfig.name} 🚀\n`));
      if (showNotifications) {
        notifier.notify({ title: newConfig.name, message: 'Successfully built 🚀' });
      }
    }

    if (onPostBuild) {
      onPostBuild();
    }
  });

  return compiler;
};

export const createAndRunCompiler = (config, onBuild = undefined, onPostBuild = undefined, showNotifications = true, analyzeSpeed = false) => {
  return new Promise((resolve, reject) => {
    createCompiler(config, onBuild, onPostBuild, showNotifications, analyzeSpeed).run((err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err);
      }
      return resolve(stats.toJson());
    });
  });
};
