const fs = require('fs');
const parser = require('./parser.js');
const currentDirectory = process.cwd();
const path = require('path');
const assets = require('./assets.js');
const url = 'relative';

module.exports = {
    start(url='relative'){
        
        const pagesDir = path.join(currentDirectory, './pages');
        const contentPagesDir = path.join(currentDirectory, './content');
        const buildDir = path.join(currentDirectory, './_site');

        if (fs.existsSync(buildDir)) {
            removeDirectory(buildDir);
        }

        assets.buildJSFile(true);
        assets.buildTailwindCSS();
        assets.moveImages();
        assets.movePublicFoderContents();

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
    paginationList = [];
    // check if it's pagination page
    const staticJsonPath = path.join(currentDirectory, 'static.json');
    if (fs.existsSync(staticJsonPath)) {
        const staticJsonContent = fs.readFileSync(staticJsonPath, 'utf8');
        staticJSON = JSON.parse(staticJsonContent);
        if (staticJSON.hasOwnProperty('paginationList')) {
            paginationList = staticJSON.paginationList
        }
    }
    const entries = fs.readdirSync(pagesDir, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = path.join(pagesDir, entry.name);
        if (entry.isDirectory()) {
            const newBuildDir = path.join(buildDir, entry.name);
            fs.mkdirSync(newBuildDir, { recursive: true });
            buildPages(entryPath, newBuildDir, url);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            routeBaseName = path.basename(entry.name,'.html')
            // check this route in static.json
            let pagination = getPageSizeForRoute("/" + routeBaseName, paginationList)
            
            if ( paginationList == [] || !pagination ){
                buildFile(entryPath, buildDir, url);
            }else{
                buildPaginationFile(entryPath, buildDir, url, routeBaseName, pagination);
            }
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
function buildPaginationFile(filePath, buildDir, url, keyName, pagination){
    containsMagicLast = false
    pageNo = 0;
    while (!containsMagicLast){
        pageContent = parser.processFile(filePath, true, url, pageNo, pagination)
        pageContent = parser.parseURLs(pageContent, url);
        if ( pageContent.includes("<div id='last-page-marker'></div>")){
            containsMagicLast = true
        }
        if (pageNo == 5){
            containsMagicLast = true
        }
        // Generate the file path for the current page
        // let pageFileDir = path.join(buildDir, keyName, 'pgn', `${pageNo}`);
        let pageFileDir = path.join(buildDir, keyName, `${pageNo}`);

        fs.mkdirSync(pageFileDir, { recursive: true });
        fs.writeFileSync(path.join(pageFileDir, 'index.html'), pageContent);
        // default : no /pageNo
        if (pageNo == 0){
            const newBuildDir = path.join(buildDir, keyName);
            fs.writeFileSync(path.join(newBuildDir, 'index.html'), pageContent);
        }
        pageNo ++

    }
    
}
function getPageSizeForRoute(routeToCheck, paginationList) {
    // Use the Array.prototype.find() method to find the first object that matches the given route.
    const item = paginationList.find(item => item.route === routeToCheck);

    // Check if an item was found with the specified route; if so, return its pageSize.
    // If no item is found (item is undefined), return null.
    return item ? item : null;
}