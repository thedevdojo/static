const fs = require('fs-extra');
const request = require('superagent');
const globalModulesPath = require("global-modules-path");
const process = require('process');
const admZip = require('adm-zip');
const { exec } = require("child_process");
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
        fs.mkdir('./' + folderName , { recursive: true }, (err) => {
            if (err) throw err;
          });
    },
    newProject(folderName, template = '--starter') {
        console.log('New setup initialized');
        template = templates.get(template.replace('--', ''));
        const templateZipFile = `${template.repo}/archive/${zipFile}`;
        const repoName = template.repo.split('/').pop();
        
        try {
            fs.mkdirSync('./' + folderName, { recursive: true });
            process.chdir(process.cwd() + '/' + folderName);
        } catch (err) {
            console.error('Failed to create or change to project directory:', err);
            throw err;
        }

        console.log('Downloading ' + template.slug + ' template');
        
        return new Promise((resolve, reject) => {
            const stream = request
                .get(templateZipFile)
                .on('error', function(error) {
                    console.error('Failed to download template:', error);
                    reject(error);
                })
                .pipe(fs.createWriteStream(zipFile));

            stream.on('finish', function() {
                console.log('Finished downloading template');
                try {
                    if (!fs.existsSync(zipFile)) {
                        throw new Error('Template zip file not found after download');
                    }

                    const zip = new admZip(zipFile);
                    console.log('Extracting template zip file');
                    zip.extractAllTo(process.cwd());
                    console.log('Finished unzipping');
                    
                    fs.unlinkSync(`./${zipFile}`);

                    const sourceDir = path.join(process.cwd(), repoName + '-main');
                    if (!fs.existsSync(sourceDir)) {
                        throw new Error('Template directory not found after extraction');
                    }

                    // Move contents of source directory to current directory
                    const files = fs.readdirSync(sourceDir);
                    for (const file of files) {
                        const sourcePath = path.join(sourceDir, file);
                        const destPath = path.join(process.cwd(), file);
                        fs.moveSync(sourcePath, destPath, { overwrite: true });
                    }
                    fs.removeSync(sourceDir);

                    // --- Begin folder structure migration ---
                    // Move old folders to new structure if they exist
                    const cwd = process.cwd();
                    const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

                    // assets -> src/assets
                    if (fs.existsSync(path.join(cwd, 'assets'))) {
                        ensureDir(path.join(cwd, 'src'));
                        fs.moveSync(path.join(cwd, 'assets'), path.join(cwd, 'src/assets'), { overwrite: true });
                    }
                    // collection -> src/data/collections
                    if (fs.existsSync(path.join(cwd, 'collection'))) {
                        ensureDir(path.join(cwd, 'src/data'));
                        fs.moveSync(path.join(cwd, 'collection'), path.join(cwd, 'src/data/collections'), { overwrite: true });
                    }
                    // collections -> src/data/collections
                    if (fs.existsSync(path.join(cwd, 'collections'))) {
                        ensureDir(path.join(cwd, 'src/data'));
                        fs.moveSync(path.join(cwd, 'collections'), path.join(cwd, 'src/data/collections'), { overwrite: true });
                    }
                    // content -> src/data/content
                    if (fs.existsSync(path.join(cwd, 'content'))) {
                        ensureDir(path.join(cwd, 'src/data'));
                        fs.moveSync(path.join(cwd, 'content'), path.join(cwd, 'src/data/content'), { overwrite: true });
                    }
                    // includes -> src/views/includes
                    if (fs.existsSync(path.join(cwd, 'includes'))) {
                        ensureDir(path.join(cwd, 'src/views'));
                        fs.moveSync(path.join(cwd, 'includes'), path.join(cwd, 'src/views/includes'), { overwrite: true });
                    }
                    // layouts -> src/views/layouts
                    if (fs.existsSync(path.join(cwd, 'layouts'))) {
                        ensureDir(path.join(cwd, 'src/views'));
                        fs.moveSync(path.join(cwd, 'layouts'), path.join(cwd, 'src/views/layouts'), { overwrite: true });
                    }
                    // pages -> src/views/pages
                    if (fs.existsSync(path.join(cwd, 'pages'))) {
                        ensureDir(path.join(cwd, 'src/views'));
                        fs.moveSync(path.join(cwd, 'pages'), path.join(cwd, 'src/views/pages'), { overwrite: true });
                    }
                    // public files: favicon.ico and robots.txt
                    ensureDir(path.join(cwd, 'public'));
                    if (fs.existsSync(path.join(cwd, 'favicon.ico'))) {
                        fs.moveSync(path.join(cwd, 'favicon.ico'), path.join(cwd, 'public/favicon.ico'), { overwrite: true });
                    }
                    if (fs.existsSync(path.join(cwd, 'robots.txt'))) {
                        fs.moveSync(path.join(cwd, 'robots.txt'), path.join(cwd, 'public/robots.txt'), { overwrite: true });
                    }
                    // --- End folder structure migration ---

                    console.log('New site available inside ' + folderName + ' folder');

                    if (process.env.NODE_ENV === 'test') {
                        resolve();
                        return;
                    }

                    // Start dev server for non-test environment
                    const devServer = require(require("global-modules-path").getPath("@devdojo/static") + '/src/dev.js');
                    
                    console.log('processing template builds and starting dev server');
                    exec("cd " + process.cwd() + " && npm install && static build", (err, stdout, stderr) => {
                        if (err) {
                            console.error("Error building assets, please re-run static dev command.");
                            console.error(err);
                            reject(err);
                            return;
                        }

                        devServer.start(false)
                            .then((port) => {
                                openurl.open('http://localhost:' + port);
                                resolve();
                            })
                            .catch(reject);
                    });
                } catch (err) {
                    console.error('Failed during template extraction:', err);
                    reject(err);
                }
            });

            stream.on('error', function(err) {
                console.error('Failed to write template file:', err);
                reject(err);
            });
        });
    }
}