const fs = require('fs');
const parser = require('./parser.js');
const currentDirectory = process.cwd();
const path = require('path');
const assets = require('./assets.js');

module.exports = {
    start(url='relative'){
        const pagesDir = path.join(currentDirectory, './pages');
        const buildDir = path.join(currentDirectory, './_site');

        if (fs.existsSync(buildDir)) {
            removeDirectory(buildDir);
        }

        assets.buildJSFile(true);
        assets.buildTailwindCSS();
        assets.moveImages();

        fs.mkdirSync(buildDir, { recursive: true });
        buildPages(pagesDir, buildDir, url);

        console.log('Successfully built your new static website 🤘');
    }
};

function removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                removeDirectory(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        }

        fs.rmdirSync(dirPath);
    }
}

function buildPages(pagesDir, buildDir, url) {
    const entries = fs.readdirSync(pagesDir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(pagesDir, entry.name);
        if (entry.isDirectory()) {
            const newBuildDir = path.join(buildDir, entry.name);
            fs.mkdirSync(newBuildDir, { recursive: true });
            buildPages(entryPath, newBuildDir);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            buildFile(entryPath, buildDir, url);
        }
    }
}

function buildFile(filePath, buildDir, url){
    const content = parser.processFile(filePath, true, url);

    if (!filePath.endsWith('index.html')) {
        const folderName = path.basename(filePath, '.html');
        const folderPath = path.join(buildDir, folderName);
        fs.mkdirSync(folderPath, { recursive: true });
        filePath = path.join(folderPath, 'index.html');
    } else {
        filePath = path.join(buildDir, path.basename(filePath));
    }

    fs.writeFileSync(filePath, content);
}