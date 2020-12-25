const childProcess = require('child_process');

const defaultParams = {
  next: false,
  nextVersion: 1,
  ignoreDuplicateError: true,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};

  if (params.next) {
    Array(parseInt(params.nextVersion || '0')).fill().forEach(() => {
      childProcess.execSync('npm version prerelease --preid=next --no-git-tag-version');
    })
  }

  try {
    childProcess.execSync(`npm publish ${params.next ? '--tag next' : ''}`);
  } catch (error) {
    var ignoreError = false;
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
