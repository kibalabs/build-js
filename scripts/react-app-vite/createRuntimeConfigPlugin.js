export const createRuntimeConfigPlugin = ({
  vars = {},
}) => {
  let scriptContent = 'const GLOBAL = typeof window !== "undefined" ? window : global;\n';
  Object.keys(vars).forEach((key) => {
    scriptContent += `GLOBAL.${key} = ${JSON.stringify(vars[key])};\n`;
  });
  return {
    name: 'create-runtime-config',
    transformIndexHtml(html) {
      return html.replace('<body>', `<body><script>${scriptContent}</script>`);
    },
  };
};
