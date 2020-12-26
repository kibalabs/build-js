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
  const output = allDiagnostics.reduce((accumulatedValue, diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${accumulatedValue}${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}\n`;
    }
    return `${accumulatedValue}${message}\n`;
  }, '');

  console.log(output);
  if (params.outputFile) {
    fs.writeFileSync(params.outputFile, output);
  }

  // const exitCode = emitResult.emitSkipped ? 1 : 0;
  // console.log(`Process exiting with code '${exitCode}'.`);
  // process.exit(exitCode);
};
