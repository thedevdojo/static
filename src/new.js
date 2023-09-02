const fs = require('fs-extra');
const request = require('superagent');
const globalModulesPath = require("global-modules-path");
const vikingNewFolder = globalModulesPath.getPath("viking") + '/src/site/';
const process = require('process');
const admZip = require('adm-zip');
var mv = require('mv');

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
        console.log('Generating your new site inside ' + folderName + ' folder.');
        fs.mkdirSync('./' + folderName , { recursive: true });
        // fs.copySync(vikingNewFolder, './' + folderName);

        process.chdir(process.cwd() + '/' + folderName);
        console.log('Downloading static starter template for your site');
        request
            .get(themeSource)
            .on('error', function(error) {
                console.log(error);
            })
            .pipe(fs.createWriteStream(zipFile))
            .on('finish', function() {
                console.log('Finished Downloading Template');
                var zip = new admZip(zipFile);
                console.log('Extracting Template Zip File');
                zip.extractAllTo(process.cwd());
                console.log('Finished Unzipping');
                fs.unlinkSync(`./${zipFile}`);

                mv(process.cwd() + '/static-starter-main', process.cwd(), {mkdirp: false, clobber: false}, function(err) {
                    console.log('Created new static site inside of the ' + folderName + ' folder');
                });

                //var serve = require(require("global-modules-path").getPath("viking") + '/src/cli/serve.js');

                

                // serve.launch();

            });
    }
}