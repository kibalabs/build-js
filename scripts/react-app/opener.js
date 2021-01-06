"use strict";
let childProcess = require("child_process");
let os = require("os");

module.exports = function opener(args, options, callback) {
    let platform = process.platform;

    // Attempt to detect Windows Subystem for Linux (WSL). WSL  itself as Linux (which works in most cases), but in
    // this specific case we need to treat it as actually being Windows. The "Windows-way" of opening things through
    // cmd.exe works just fine here, whereas using xdg-open does not, since there is no X Windows in WSL.
    if (platform === "linux" && os.release().indexOf("Microsoft") !== -1) {
        platform = "win32";
    }

    // http://stackoverflow.com/q/1480971/3191, but see below for Windows.
    let command;
    switch (platform) {
        case "win32": {
            command = "cmd.exe";
            break;
        }
        case "darwin": {
            command = "open";
            break;
        }
        default: {
            command = "xdg-open";
            break;
        }
    }

    if (typeof args === "string") {
        args = [args];
    }
    /*
        if (typeof options === "function") {
            callback = options;
            options = {};
        }
    
        if (options && typeof options === "object" && options.command) {
            if (platform === "win32") {
                // *always* use cmd on windows
                args = [options.command].concat(args);
            } else {
                command = options.command;
            }
        }
    */
    if (platform === "win32") {
        args = args.map(function (value) {
            return value.replace(/[&^]/g, "^$&");
        });
        args = ["/c", "start", "\"\""].concat(args);
    }

    return childProcess.execFile(command, args, options, callback);
};