import typescript from 'typescript';

export const generateTypescriptDeclarations = (filenames, options) => {
  console.log(`Generating ts declarations for ${filenames}`);
  const config = typescript.parseJsonConfigFileContent({
    compilerOptions: {
      ...options,
      emitDeclarationOnly: true,
    },
  }, typescript.sys, process.cwd());
  const program = typescript.createProgram(filenames, config.options);
  const emitResult = program.emit();
  return emitResult.emitSkipped !== 1;
};
