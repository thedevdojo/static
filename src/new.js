const fs = require('fs-extra');
const request = require('superagent');
const globalModulesPath = require("global-modules-path");
const process = require('process');
const admZip = require('adm-zip');
var mv = require('mv');
const { exec } = require("child_process");
const openurl = require('openurl');

const href = `https://github.com/thedevdojo/static-starter/archive`;
const zipFile = 'master.zip';

const themeSource = `${href}/${zipFile}`;

module.exports = {
    welcome() {
        console.log('Welcome to Static');
    },
    createFolder(folderName) {
        console.log('creating new folder ' + folderName);
        fs.mkdir('./' + folderName , { recursive: true }, (err) => {
            if (err) throw err;
          });
    },
    newProject(folderName) {
        console.log('New setup initialized');
        fs.mkdirSync('./' + folderName , { recursive: true });

        process.chdir(process.cwd() + '/' + folderName);
        console.log('Downloading static starter template');
        request
            .get(themeSource)
            .on('error', function(error) {
                console.log(error);
            })
            .pipe(fs.createWriteStream(zipFile))
            .on('finish', function() {
                console.log('Finished downloading template');
                var zip = new admZip(zipFile);
                console.log('Extracting template zip file');
                zip.extractAllTo(process.cwd());
                console.log('Finished unzipping');
                fs.unlinkSync(`./${zipFile}`);

                mv(process.cwd() + '/static-starter-main', process.cwd(), {mkdirp: false, clobber: false}, function(err) {
                    console.log('New site available inside ' + folderName + ' folder');
                });

                // let execString = "cd " + String(process.cwd()) + " && npx @devdojo/static dev";
                

                // exec(execString, (err, stdout, stderr) => {
                //     if (err) {
                //         console.error("Error booting up dev server inside new folder");
                //         console.error(err);
                //     }
                //     console.log(stdout);
                // });
                // console.log(process.cwd());

                // console.log('path');
                // console.log(require("global-modules-path").getPath("@devdojo/static"));


                let devServer = require(require("global-modules-path").getPath("@devdojo/static") + '/src/dev.js');

                if(process.env.NODE_ENV == 'test'){
                    return;
                }

                let devServerPort = devServer.start();

                devServerPort.then((port) => {
                    openurl.open('http://localhost:' + port);
                });

                // serve.launch();

            });
    }
}
