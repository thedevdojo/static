const fs = require('fs');
const parser = require('./parser.js');
const currentDirectory = process.cwd();
const path = require('path');
const assets = require('./assets.js');

module.exports = {
    start(){
        assets.buildJSFile(true);
        assets.buildTailwindCSS();
        assets.moveImages();

        const pagesDir = path.join(currentDirectory, './pages');
        const buildDir = path.join(currentDirectory, './_site');
        fs.mkdirSync(buildDir, { recursive: true });
        buildPages(pagesDir, buildDir);
    }
}

function buildPages(pagesDir, buildDir) {
    const entries = fs.readdirSync(pagesDir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(pagesDir, entry.name);
        if (entry.isDirectory()) {
            const newBuildDir = path.join(buildDir, entry.name);
            fs.mkdirSync(newBuildDir, { recursive: true });
            buildPages(entryPath, newBuildDir);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            buildFile(entryPath, buildDir);
        }
    }
}

function buildFile(filePath, buildDir){
    const content = parser.processFile(filePath, true);
    fs.writeFileSync(path.join(buildDir, path.basename(filePath)), content);
}