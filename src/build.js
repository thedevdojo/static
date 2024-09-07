const fs = require('fs');
const parser = require('./parser.js');
const currentDirectory = process.cwd();
const path = require('path');
const assets = require('./assets.js');
const url = 'relative';

module.exports = {
    start(url='relative'){

        let staticJSON = {};

        const staticJsonPath = path.join(currentDirectory, 'static.json');
        if (fs.existsSync(staticJsonPath)) {
            const staticJsonContent = fs.readFileSync(staticJsonPath, 'utf8');
            staticJSON = JSON.parse(staticJsonContent);
        }

        if (staticJSON.hasOwnProperty('build')) {
            if(typeof(staticJSON.build.url) != 'undefined'){
                url = staticJSON.build.url;
            }
        }
        
        const pagesDir = path.join(currentDirectory, './pages');
        const contentPagesDir = path.join(currentDirectory, './content');
        let buildDir = path.join(currentDirectory, './_site');

        if (staticJSON.hasOwnProperty('build')) {
            if(typeof(staticJSON.build.directory) != 'undefined'){
                buildDir = staticJSON.build.directory;
            }
        }

        if (fs.existsSync(buildDir)) {
            removeDirectory(buildDir);
        }

        assets.buildJSFile(true, buildDir);
        assets.buildTailwindCSS(buildDir);
        assets.moveImages(buildDir);
        assets.movePublicFolderContents(buildDir);

        fs.mkdirSync(buildDir, { recursive: true });
        buildPages(pagesDir, buildDir, url);
        buildContentPages(contentPagesDir, buildDir, url);

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
            buildPages(entryPath, newBuildDir, url);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            buildFile(entryPath, buildDir, url);
        }
    }
}

function buildContentPages(contentDir, buildDir, url){

    if (!fs.existsSync(contentDir)) {
        return;
    }
    
    const entries = fs.readdirSync(contentDir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(contentDir, entry.name);
        if (entry.isDirectory()) {
            const newBuildDir = path.join(buildDir, entry.name);
            fs.mkdirSync(newBuildDir, { recursive: true });
            buildContentPages(entryPath, newBuildDir, url);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            buildFile(entryPath, buildDir, url);
        }
    }

}

function buildFile(filePath, buildDir, url){

    let content = null;

    // Processing for Content Pages
    if(filePath.endsWith('.md')){
        content = parser.processContent(filePath, true, url);
        if (!filePath.endsWith('index.md')) {
            const folderName = path.basename(filePath, '.md');
            const folderPath = path.join(buildDir, folderName);
            fs.mkdirSync(folderPath, { recursive: true });
            filePath = path.join(folderPath, 'index.html');
        } else {
            filePath = path.join(buildDir, path.basename(filePath));
            if(filePath.endsWith('index.md')){
                filePath = filePath.replace('index.md', 'index.html');
            }
        }
    } else {
        // Processing for Pages
        content = parser.processFile(filePath, true, url);

        // ignore content pages
        if(filePath.endsWith('[content].html')){
            return;
        }

        if (!filePath.endsWith('index.html')) {
            const folderName = path.basename(filePath, '.html');
            const folderPath = path.join(buildDir, folderName);
            fs.mkdirSync(folderPath, { recursive: true });
            filePath = path.join(folderPath, 'index.html');
        } else {
            filePath = path.join(buildDir, path.basename(filePath));
        }
    }

    content = parser.parseURLs(content, url);

    if(content != null){
        fs.writeFileSync(filePath, content);
    }
}