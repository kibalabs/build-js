import childProcess from 'child_process'
import os from 'os'

const getPlatform = () => {
  let platform = process.platform;
  if (platform === 'linux' && os.release().indexOf('Microsoft') !== -1) {
    platform = 'win32';
  }
  return platform;
};

const getOpenCommand = (platform) => {
  let command;
  switch (platform) {
    case 'win32': {
      command = 'cmd.exe';
      break;
    }
    case 'darwin': {
      command = 'open';
      break;
    }
    default: {
      command = 'xdg-open';
      break;
    }
  }
  return command;
};

const open = (args, options) => {
  const platform = getPlatform();
  const command = getOpenCommand(platform);
  let openArgs = typeof args === 'string' ? [args] : args;

  if (platform === 'win32') {
    openArgs = openArgs.map((value) => {
      return value.replace(/[&^]/g, '^$&');
    });
    openArgs = ['/c', 'start', '""'].concat(openArgs);
  }
  return childProcess.execFile(command, openArgs, options);
};

module.exports = {
  open,
  getOpenCommand,
  getPlatform,
};
