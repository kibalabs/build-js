import fs from 'node:fs';
import path from 'node:path';

export const createIndexPlugin = ({
  templateFilePath,
  name,
}) => {
  const destinationPath = path.join(process.cwd(), './index.html');
  return {
    name: 'create-index',
    buildStart() {
      const data = fs.readFileSync(templateFilePath, 'utf-8');
      fs.writeFileSync(destinationPath, data.replace('{title}', name));
    },
    buildEnd() {
      // NOTE(krishan711): annoyingly this isnt called in dev mode for some reason
      // https://github.com/vitejs/vite/issues/15418
      fs.unlinkSync(destinationPath);
    },
  };
};
