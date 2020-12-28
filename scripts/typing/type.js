const fs = require('fs');
const path = require('path');

const ts = require('typescript');

const buildTsConfig = require('./ts.config');

function findInDirectory(directory, filter) {
  let output = [];
  fs.readdirSync(directory).forEach((file) => {
    const filename = path.join(directory, file);
    if (fs.lstatSync(filename).isDirectory()) {
      output = output.concat(findInDirectory(filename, filter));
    } else if (filename.indexOf(filter) >= 0) {
      output.push(filename);
    }
  });
  return output;
}

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
  const files = findInDirectory(params.directory || './src', '.ts');
  const program = ts.createProgram(files, {
    ...tsConfig.compilerOptions,
    ...(customConfig?.compilerOptions || {}),
    noEmit: true,
  });

  // NOTE(krishan711): from https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md
  const emitResult = program.emit();
  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  console.log(new PrettyFormatter().format(allDiagnostics));
  if (params.outputFile) {
    var formatter = null;
    const fileFormat = params.outputFileFormat || 'pretty';
    if (fileFormat === 'annotations') {
      formatter = new GitHubAnnotationsFormatter();
    } else if (fileFormat === 'pretty') {
      formatter = new PrettyFormatter();
    } else {
      throw Error(`Unknown typescript output format option: ${fileFormat}. Must be one of ${['annotations', 'pretty']}`)
    }
    console.log(`Saving lint results to ${params.outputFile}`);
    fs.writeFileSync(params.outputFile, formatter.format(allDiagnostics));
  }

  // const exitCode = emitResult.emitSkipped ? 1 : 0;
  // console.log(`Process exiting with code '${exitCode}'.`);
  // process.exit(exitCode);
};

class GitHubAnnotationsFormatter {
  getLine(position, lineMap) {
    const row = lineMap.filter((lineEndPosition) => position > lineEndPosition).length;
    return row;
  }

  getColumn(position, lineMap) {
    const row = this.getLine(position, lineMap);
    return position - lineMap[row - 1] + 1;
  }

  format(typingDiagnostics) {
    const annotations = [];
    typingDiagnostics.forEach((diagnostic) => {
      // console.log('diagnostic', diagnostic);
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
    })
    return JSON.stringify(annotations);
  }
}

class PrettyFormatter {
  format(typingDiagnostics) {
    const output = typingDiagnostics.reduce((accumulatedValue, diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
      if (diagnostic.file) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return `${accumulatedValue}${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}\n`;
      }
      return `${accumulatedValue}${message}\n`;
    }, '');
    return output;
  }
}
