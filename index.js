const path = require("path");
const spawn = require('child_process').spawn;
const kill = require('tree-kill');
const debuglog = require('util').debuglog('mitmproxy');

let filename = path.join(__dirname, 'bin', 'mitmdump' + (process.platform === 'win32' ? '.exe' : ''));
let runningInstance = null;

exports.start = (args) => {
    if (runningInstance) {
        throw 'Instance already running.';
    }

    return new Promise((res, rej) => {
        runningInstance = spawn(filename, args || []);

        runningInstance.stdout.on('data', (data) => {
            debuglog(`[stdin] ${data}`);

            if (-1 !== data.indexOf('Proxy server listening at')) {
                res(data);
            }
        });

        runningInstance.stderr.on('data', (data) => {
            debuglog(`[stdout] ${data}`);
        });

        runningInstance.on('close', code => {
            debuglog(`[close] ${code}`);

            rej(code);
        });
    });
};

exports.stop = () => {
    if (runningInstance) {
        kill(runningInstance.pid);
        runningInstance = null;
    }
};
