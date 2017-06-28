const request = require("request");
const os = require("os");
const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf").sync;
const decompress = require("decompress");
const decompressTargz = require('decompress-targz');
const decompressUnzip = require('decompress-unzip');

Promise.resolve()
    // get archive file
    .then(() => {
        // use local file
        let configuredFilepath = process.env.npm_config_mitmproxy_filepath || process.env.MITMPROXY_FILEPATH;
        if (configuredFilepath) {
            console.log('Using file: ', configuredFilepath);
            return configuredFilepath
        }

        // download it
        return new Promise((res, rej) => {
            let version = process.env.npm_config_mitmproxy_version || process.env.MITMPROXY_VERSION || '2.0.2';
            let fileName = `mitmproxy-${version}-`;
            switch (process.platform) {
                case 'linux':
                    fileName += 'linux.tar.gz';
                    break;
                case 'win32':
                    fileName += 'windows.zip';
                    break;
                default:
                    throw `Platform ${process.platform} is not supported.`;
            }

            let downloadUrl = `https://github.com/mitmproxy/mitmproxy/releases/download/v${version}/${fileName}`;
            let tempPath = os.tmpdir();
            let downloadedFile = path.join(tempPath, fileName);
            let outFile = fs.openSync(downloadedFile, 'w');
            let count = 0;
            let notifiedCount = 0;

            console.log('Downloading', downloadUrl);
            console.log('Saving to', downloadedFile);

            let client = request.get({
                uri: downloadUrl
            });

            client.on('error', function (err) {
                rej('Error with http request: ' + err);
            });

            client.on('data', function (data) {
                fs.writeSync(outFile, data, 0, data.length, null);
                count += data.length;
                if ((count - notifiedCount) > 800000) {
                    console.log('Received ' + Math.floor(count / 1024) + 'K...');
                    notifiedCount = count;
                }
            });

            client.on('end', function () {
                console.log('Received ' + Math.floor(count / 1024) + 'K total.');
                fs.closeSync(outFile);
                res(downloadedFile);
            });
        });
    })
    // extract
    .then(filePath => {
        let libPath = path.join(__dirname, 'bin');
        let filename = 'mitmdump' + (process.platform === 'win32' ? '.exe' : '');
        rimraf(libPath);

        console.log('Extracting zip contents to', libPath);

        return decompress(filePath, libPath, {
            filter: file => file.path === filename,
            plugins: [decompressTargz(), decompressUnzip()],
            strip: 0
        })
            .then(() => path.join(libPath, filename));
    })
    // ensure file permissions
    .then(filename => {
        if (process.platform === 'win32') {
            return filename;
        }

        let stat = fs.statSync(filename);
        // 64 == 0100 (no octal literal in strict mode)
        if (!(stat.mode & 64)) {
            console.log('Fixing file permissions');
            fs.chmodSync(filename, '755');
        }

        return filename;
    })
    // success
    .then(filename => {
        console.log('Done. MitmProxy binary available at', filename);
    })
    .catch(err => {
        console.error('MitmProxy installation failed', err);

        process.exit(1);
    });
