import ts from 'typescript'

function generateTypescriptDeclarations(filenames, options) {
  console.log(`Generating ts declarations for ${filenames}`);
  const program = ts.createProgram(filenames, {
    ...options,
    emitDeclarationOnly: true,
  });
  const emitResult = program.emit();
  return emitResult.emitSkipped !== 1;
}

module.exports = generateTypescriptDeclarations;
