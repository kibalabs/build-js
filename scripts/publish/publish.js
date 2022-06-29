const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const { removeUndefinedProperties } = require('../util');

const defaultParams = {
  next: false,
  nextVersion: 1,
  ignoreDuplicateError: true,
};

module.exports = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };

  const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const isWorkspace = package.workspaces && package.workspaces.length > 0;
  console.log('isWorkspace', isWorkspace);
  const packagePaths = package.workspaces || [];

  if (params.next) {
    Array(parseInt(params.nextVersion || '0', 10)).fill().forEach(() => {
      const workspaceCommandSuffix = isWorkspace ? '--workspaces --workspaces-update --include-workspace-root' : '';
      const output = childProcess.execSync(`npm version prerelease --preid=next --no-git-tag-version ${workspaceCommandSuffix}`).toString();
      if (isWorkspace) {
        // NOTE(krishan711): annoyingly need to update each package's dependencies
        // this says it should work automatically it doesn't: https://github.com/npm/cli/issues/3403
        const outputLines = ((output.split('up to date ')[0]).split('added ')[0]).split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
        const newPackageVersions = [];
        for (let i = 0; i < outputLines.length / 2; i += 1) {
          newPackageVersions[outputLines[i * 2]] = outputLines[(i * 2) + 1].replace('v', '');
        }
        packagePaths.forEach((packagePath) => {
          const packageFilePath = path.join(packagePath, 'package.json');
          const subPackage = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
          Object.keys(subPackage.dependencies || {}).forEach((dependencyName) => {
            if (newPackageVersions[dependencyName]) {
              subPackage.dependencies[dependencyName] = newPackageVersions[dependencyName];
            }
          });
          Object.keys(subPackage.devDependencies || {}).forEach((dependencyName) => {
            if (newPackageVersions[dependencyName]) {
              subPackage.devDependencies[dependencyName] = newPackageVersions[dependencyName];
            }
          });
          Object.keys(subPackage.peerDependencies || {}).forEach((dependencyName) => {
            if (newPackageVersions[dependencyName]) {
              subPackage.peerDependencies[dependencyName] = newPackageVersions[dependencyName];
            }
          });
          fs.writeFileSync(packageFilePath, JSON.stringify(subPackage, undefined, 2), 'utf8');
        });
      }
    });
  }

  try {
    const workspaceCommandSuffix = isWorkspace ? '--workspaces --if-present' : '';
    const nextCommandSuffix = params.next ? '--tag next' : '';
    childProcess.execSync(`npm publish ${nextCommandSuffix} ${workspaceCommandSuffix}`);
  } catch (error) {
    let ignoreError = false;
    if (error.message.includes('You cannot publish over the previously published versions')) {
      if (params.ignoreDuplicateError) {
        console.log('Skipping already published version!');
        ignoreError = true;
      }
    }
    if (!ignoreError) {
      throw error;
    }
  }
};
