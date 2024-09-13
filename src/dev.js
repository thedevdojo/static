const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const livereload = require('livereload');
const connectLiveReload = require("connect-livereload");
const isBuild = process.argv.includes('--build');
const net = require('net');
const currentDirectory = process.cwd();
const parser = require('./parser.js');
const assets = require('./assets.js');
const liveReloadDefaultPort = 35729;
const env = require('./env.js');
const staticFoldersToWatch = ['assets', 'collections', 'content', 'includes', 'layouts', 'pages', 'public'];
const globalModulesPath = require("global-modules-path");

const esbuild = require('esbuild');

module.exports = {
    start(url='relative', moveAssets = true){
        if(moveAssets){
            assets.buildJSFile();
            assets.moveImages();
        }

        return this.getAvailablePort(port).then((availablePort) => {

            // get available port for the Live Reload Server
            this.getAvailablePort(liveReloadDefaultPort).then((liveReloadAvailablePort) => {
            
                const liveReloadOptions = {
                    port: liveReloadAvailablePort,
                    exts: ['html', 'css', 'js', 'png', 'gif', 'jpg', 'md']
                };
                const liveReloadServer = livereload.createServer(liveReloadOptions);

                for(let i = 0; i < staticFoldersToWatch.length; i++){
                    liveReloadServer.watch(currentDirectory + "/" + staticFoldersToWatch[i] + "/**/*");
                }
                
                liveReloadServer.watch(currentDirectory + "/tailwind.config.js");
                liveReloadServer.watch(currentDirectory + "/_site/assets");
                liveReloadServer.server.once("connection", () => {
                    setTimeout(() => {
                        liveReloadServer.refresh("/");
                    }, 100);
                });

                // TODO: Allow user to specify setting headers in the dev server via a config file
                let staticJSON = {};

                const staticJsonPath = path.join(currentDirectory, 'static.json');
                if (fs.existsSync(staticJsonPath)) {
                    const staticJsonContent = fs.readFileSync(staticJsonPath, 'utf8');
                    staticJSON = JSON.parse(staticJsonContent);
                }

                app.use(function(req, res, next) {
                    if (staticJSON.hasOwnProperty('headers')) {
                        for (const header in staticJSON.headers) {
                            res.setHeader(header, staticJSON.headers[header]);
                        }
                    }
                    next();
                });

                app.use(connectLiveReload(liveReloadOptions));

                

                app.use('/assets', express.static(path.join(currentDirectory, '_site/assets')))
                app.use('/', express.static(path.join(currentDirectory, 'public/')))
                
                app.get('/*', (req, res) => {
                    return this.handleRequest(req, res, url);
                });

                app.listen(availablePort, () => {
                    console.log(`Server running at http://localhost:${availablePort}`);
                });

                

            }).catch((error) => {
                console.log('error finding available port for liveReload');
                console.log(error);
            });

            return availablePort;
            
        }).catch((error) => {
            console.log('error finding available port number');
            console.log(error);
        });
        
    },
    handleRequest(req, res, url){
        let route = req.path === '/' ? '/index' : req.path;

        // First we are going to check if we have a content file in this location
        let contentPath = path.join(currentDirectory, './content', route + '.md');
        let contentPathIndex = path.join(currentDirectory, './content', route + '/index.md');
        let contentFile = null;

        if (fs.existsSync(contentPath)) {
            contentFile = parser.processContent(contentPath);
        } else if(fs.existsSync(contentPathIndex)) {
            contentFile = parser.processContent(contentPathIndex);
        }

        if (contentFile != null) {
            contentFile = parser.parseURLs(contentFile, url);
            return res.send(contentFile);
        }

        // Handle pagination if specified in 'static.json'.
        paginationList = [];
        const staticJsonPath = path.join(currentDirectory, 'static.json');
        if (fs.existsSync(staticJsonPath)) {
            const staticJsonContent = fs.readFileSync(staticJsonPath, 'utf8');
            staticJSON = JSON.parse(staticJsonContent);
            if (staticJSON.hasOwnProperty('paginationList')) {
                paginationList = staticJSON.paginationList
            }
        }

        // Regex to extract page number from the route.
        let pageNo = null;
        // const pageRegex = /\/pgn\/(\d+)/;
        const pageRegex = /\/(\d+)/;

        isPaginationRoute = false;
        const containsPageNo = route.match(pageRegex); //  route = /posts/page/0
        if ( containsPageNo ){
            pageNo = parseInt(containsPageNo[1], 10);
            isPaginationRoute = true
            route = route.replace(pageRegex, '')
        }

        // Check for pagination details in the static JSON configuration.
        let pagination = this.getPageSizeForRoute(route, paginationList)

        if ( isPaginationRoute || pagination ){
            pageNo = isPaginationRoute ? pageNo : 0
        }

        // Define paths to page files based on the current directory and the route.
        let pagePath = path.join(currentDirectory, './pages', route + '.html');
        let pagePathIndex = path.join(currentDirectory, './pages', route, '/index.html');
        let pageContent = null;

        // Check if the specified HTML file or its index exists and process it if found.
        if (fs.existsSync(pagePath)) {
            pageContent = parser.processFile(pagePath, false, 'relative', pageNo, pagination);

        } else if(fs.existsSync(pagePathIndex)) {
            pageContent = parser.processFile(pagePathIndex, false, 'relative', pageNo, pagination);
        }

        if (pageContent != null) {
            pageContent = parser.parseURLs(pageContent, url);
            return res.send(pageContent);
        }

        // otherwise we need to return the Page Not found error

        let page404 = globalModulesPath.getPath("@devdojo/static") + '/src/pages/404.html';
        if (fs.existsSync(page404)) {
            const page404Content = fs.readFileSync(page404, 'utf8');
            return res.status(404).send(page404Content);
        }
        res.status(404).send('coo');
        return;

    },
    getAvailablePort(port) {
        
        return new Promise((resolve, reject) => {
            const server = net.createServer();
    
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    // port is currently in use, try the next one
                    resolve(this.getAvailablePort(port + 1));
                } else {
                    // some other error, reject the promise
                    reject(err);
                }
            });
    
            server.once('listening', () => {
                // port is available, close the server and resolve the promise
                server.close(() => resolve(port));
            });
    
            server.listen(port);
        });
    },
    getPageSizeForRoute(routeToCheck, paginationList) {
        // Use the Array.prototype.find() method to find the first object that matches the given route.
        const item = paginationList.find(item => item.route === routeToCheck);

        // Check if an item was found with the specified route; if so, return its pageSize.
        // If no item is found (item is undefined), return null.
        return item ? item : null;
    }
}
