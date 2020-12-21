const ts = require('typescript');

function generateTypescriptDeclarations(filenames, options) {
  console.log(`Generating ts declarations for ${filenames}`);
  let program = ts.createProgram(filenames, {
    ...options,
    emitDeclarationOnly: true,
  });
  let emitResult = program.emit();
  return emitResult.emitSkipped != 1;
}

module.exports = generateTypescriptDeclarations;
