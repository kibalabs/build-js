#!/usr/bin/env node


const fs = require('fs');
const path = require('path');

const commander = require('commander');
const ts = require('typescript');

const tsConfig = require('./tsconfig');

const params = commander
  .option('-d, --directory [path]')
  .option('-o, --output-file [path]')
  .parse(process.argv);

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

const files = findInDirectory(params.directory ? params.directory : './src', '.ts');
const program = ts.createProgram(files, {
  ...tsConfig.compilerOptions,
  noEmit: true,
});
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

if (params.outputFile) {
  fs.writeFileSync(params.outputFile, output);
} else {
  console.log(output);
}
