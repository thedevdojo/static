const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const livereload = require('livereload');
const connectLiveReload = require("connect-livereload");
const isBuild = process.argv.includes('--build');

if (isBuild) {
    const pagesDir = path.join(__dirname, './src/pages');
    const buildDir = path.join(__dirname, './build');
    fs.mkdirSync(buildDir, { recursive: true });
    buildPages(pagesDir, buildDir);
} else {

    const liveReloadServer = livereload.createServer();
    liveReloadServer.watch(__dirname + "/src");
    liveReloadServer.watch(__dirname + "/build/assets");
    liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
            liveReloadServer.refresh("/");
        }, 100);
    });

    app.use(connectLiveReload());

    app.use('/assets', express.static(path.join(__dirname, 'build/assets')))

    app.get('/*', (req, res) => {
        const route = req.path === '/' ? '/index' : req.path;
        let pagePath = path.join(__dirname, './src/pages', route + '.html');
        if (!fs.existsSync(pagePath)) {
            pagePath = path.join(__dirname, './src/pages', route, 'index.html');
            if (!fs.existsSync(pagePath)) {
                res.status(404).send('Page not found');
                return;
            }
        }

        const content = processFile(pagePath);
        res.send(content);
    });


    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

function processFile(filePath) {
    let page = fs.readFileSync(filePath, 'utf8');

    const layoutTag = page.match(/<layout[^>]*src="([^"]*)"[^>]*>([\s\S]*?)<\/layout>/);
    const titleTag = page.match(/<layout[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/layout>/);

    let layoutPath = path.join(__dirname, './src', layoutTag[1]);
    let layout = fs.readFileSync(layoutPath, 'utf8');
    let slotContent = layoutTag[2]; 

    // Replace {title} in layout, if title attribute is present
    if (titleTag) {
        layout = layout.replace('{title}', titleTag[1]);
    }

    // Handle include tags
    let includeTag;
    const includeRegex = /<include src="(.*)"><\/include>/g;
    while ((includeTag = includeRegex.exec(slotContent)) !== null) {
        const includeSrcPath = path.join(__dirname, './src', includeTag[1]);
        const includeContent = fs.readFileSync(includeSrcPath, 'utf8');
        slotContent = slotContent.replace(includeTag[0], includeContent);
    }

    const finalContent = parseShortCodes(layout.replace('{slot}', slotContent));

    return finalContent;
}

function parseShortCodes(content){
    // {tailwindcss} shortcode
    const tailwindReplacement = isBuild ? '<link href="/assets/css/main.css" rel="stylesheet">' : '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>';
    content = content.replace('{tailwindcss}', tailwindReplacement);
    
    return content;
}

function buildFile(filePath, buildDir){
    const content = processFile(filePath);
    fs.writeFileSync(path.join(buildDir, path.basename(filePath)), content);
}

function buildPages(dirPath, buildDir) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            const newBuildDir = path.join(buildDir, entry.name);
            fs.mkdirSync(newBuildDir, { recursive: true });
            buildPages(entryPath, newBuildDir);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            buildFile(entryPath, buildDir);
        }
    }
}
