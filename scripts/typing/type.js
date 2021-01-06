/* eslint-disable max-classes-per-file */
const fs = require('fs');
const path = require('path');

const glob = require('glob');
const chalk = require('chalk');
const typescript = require('typescript');

const buildTsConfig = require('./ts.config');

const defaultParams = {
  configModifier: undefined,
  directory: undefined,
  outputFile: undefined,
  outputFileFormat: undefined,
};

module.exports = (inputParams = {}) => {
  const params = { ...defaultParams, ...inputParams };
  let customConfig = {};
  if (params.configModifier) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    customConfig = require(path.join(process.cwd(), params.configModifier));
    if (typeof customConfig === 'function') {
      customConfig = customConfig(params);
    }
  }
  const tsConfig = buildTsConfig(params);
  // NOTE(krishan711): I couldn't find a way to filter node_modules in the glob (filtering needed for lerna repos)
  const files = glob.sync(path.join(params.directory || './src', '**', '*.{ts, tsx}'));
  const filteredFiles = files.filter((file) => !file.includes('/node_modules/'));
  const program = typescript.createProgram(filteredFiles, {
    ...tsConfig.compilerOptions,
    ...(customConfig.compilerOptions || {}),
    noEmit: true,
  });

  // NOTE(krishan711): from https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md
  const emitResult = program.emit();
  const allDiagnostics = typescript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  console.log(new PrettyFormatter().format(allDiagnostics));
  if (params.outputFile) {
    let formatter = null;
    const fileFormat = params.outputFileFormat || 'pretty';
    if (fileFormat === 'annotations') {
      formatter = new GitHubAnnotationsFormatter();
    } else if (fileFormat === 'pretty') {
      formatter = new PrettyFormatter();
    } else {
      throw Error(`Unknown typescript output format option: ${fileFormat}. Must be one of ${['annotations', 'pretty']}`);
    }
    console.log(`Saving lint results to ${params.outputFile}`);
    fs.writeFileSync(params.outputFile, formatter.format(allDiagnostics));
  }

  // const exitCode = emitResult.emitSkipped ? 1 : 0;
  // console.log(`Process exiting with code '${exitCode}'.`);
  // process.exit(exitCode);
};

class GitHubAnnotationsFormatter {
  // eslint-disable-next-line class-methods-use-this
  format(typingDiagnostics) {
    const annotations = [];
    typingDiagnostics.forEach((diagnostic) => {
      const start = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const end = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);
      const annotation = {
        path: path.relative(process.cwd(), diagnostic.file.fileName),
        start_line: start.line + 1,
        end_line: end.line + 1,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        annotation_level: diagnostic.category === 1 ? 'failure' : 'warning',
      };
      if (annotation.start_line === annotation.end_line) {
        annotation.start_column = start.character + 1;
        annotation.end_column = end.character + 1;
      }
      annotations.push(annotation);
    });
    return JSON.stringify(annotations);
  }
}

class PrettyFormatter {
  // eslint-disable-next-line class-methods-use-this
  format(typingDiagnostics) {
    const messages = typingDiagnostics.reduce((accumulatedValue, diagnostic) => {
      let message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
      let filePath = '(unknown)';
      let line = 0;
      let column = 0;
      if (diagnostic.file) {
        filePath = path.relative(process.cwd(), diagnostic.file.fileName);
        const start = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        line = start.line + 1;
        column = start.character + 1;
      }
      accumulatedValue.push({ filePath, message, line, column, });
      return accumulatedValue;
    }, []);
    const groupedMessages = messages.reduce((accumulatedValue, message) => {
      if (!(message.filePath in accumulatedValue)) {
        accumulatedValue[message.filePath] = [];
      }
      const group = accumulatedValue[message.filePath];
      group.push(message);
      return accumulatedValue;
    }, {});
    const output = Object.keys(groupedMessages).reduce((accumulatedValue, groupFilename) => {
      const groupMessages = groupedMessages[groupFilename].reduce((accumulatedValue, message) => {
        accumulatedValue.push(`${chalk.grey(message.filePath)}:${message.line}:${message.column} ${message.message}`);
        return accumulatedValue;
      }, []);
      const errorMessage = `${groupMessages.length} errors`;
      return `${accumulatedValue}\n${chalk.red(errorMessage)} in ${groupFilename}\n${groupMessages.join('\n')}\n`
    }, '');
    const totalErrorMessage = messages.length ? `Failed due to ${chalk.red(`${messages.length} errors`)}.` : 'Succeeded.';
    const finalOutput = `${output}\n${totalErrorMessage}`
    return finalOutput;
  }
}
