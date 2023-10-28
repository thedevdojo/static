const fs = require('fs-extra');
const request = require('superagent');
const globalModulesPath = require("global-modules-path");
const process = require('process');
const admZip = require('adm-zip');
var mv = require('mv');
const {
    exec
} = require("child_process");
const openurl = require('openurl');
const path = require('path');
const templates = require('./templates.js');
const zipFile = 'main.zip';
const assets = require('./assets.js');

module.exports = {
    welcome() {
        console.log('Welcome to Static');
    },
    createFolder(folderName) {
        console.log('creating new folder ' + folderName);
        fs.mkdir('./' + folderName, {
            recursive: true
        }, (err) => {
            if (err) throw err;
        });
    },
    newProject(folderName, template = '--starter') {
        console.log('New setup initialized');
        template = templates.get(template.replace('--', ''));
        templateZipFile = `${template.repo}/archive/${zipFile}`;
        repoName = template.repo.split('/').pop();
        fs.mkdirSync('./' + folderName, {
            recursive: true
        });

        process.chdir(process.cwd() + '/' + folderName);
        console.log('Downloading ' + template.slug + ' template');
        request
            .get(templateZipFile)
            .on('error', function(error) {
                console.log(error);
            })
            .pipe(fs.createWriteStream(zipFile))
            .on('finish', function() {
                console.log('Finished downloading template');
                var zip = new admZip(zipFile);
                console.log('Extracting template zip file');

                var zipEntries = zip.getEntries();

                zipEntries.forEach(function(zipEntry) {
                    if (zipEntry.entryName.startsWith(repoName + '-main/')) {
                        var newEntryName = zipEntry.entryName.replace(repoName + '-main/', '');

                        if (newEntryName) {
                            // Check if the entry is a directory
                            if (/\/$/.test(newEntryName)) {
                                // Create the directory if it's a subfolder
                                fs.mkdirSync(path.join(process.cwd(), newEntryName), {
                                    recursive: true
                                });
                            } else {
                                zip.extractEntryTo(zipEntry.entryName, process.cwd(), false, true, newEntryName);
                            }
                        }
                    }
                });

                console.log('Finished unzipping');
                fs.unlinkSync(`./${zipFile}`);

                console.log('New site available inside ' + folderName + ' folder');

                let devServer = require(require("global-modules-path").getPath("@devdojo/static") + '/src/dev.js');

                if (process.env.NODE_ENV == 'test') {
                    return;
                }

                process.chdir(process.cwd());

                console.log('processing template builds and starting dev server');
                exec("npm install && static build", (err, stdout, stderr) => {
                    if (err) {
                        console.error("Error building assets, please re-run static dev command.");
                        console.error(err);
                    }
                    let devServerPort = devServer.start(false);

                    const {
                        spawn
                    } = require('child_process');

                    devServerPort.then((port) => {
                        console.log(`Server running at http://localhost:${port}`);
                        try {
                            const child = spawn('xdg-open', [`http://localhost:${port}`]);

                            child.on('error', (error) => {
                                console.error('Failed to open URL:', error);
                            });
                        } catch (error) {
                            console.error('Failed to spawn process:', error);
                        }
                    });
                });
            });
    }
}
