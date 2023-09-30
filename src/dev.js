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
    start(){
        assets.buildJSFile();
        assets.moveImages();

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

                app.use(connectLiveReload(liveReloadOptions));

                app.use('/assets', express.static(path.join(currentDirectory, '_site/assets')))
                app.use('/', express.static(path.join(currentDirectory, 'public/')))
                
                app.get('/*', (req, res) => {
                    return this.handleRequest(req, res);
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
    handleRequest(req, res){
        const route = req.path === '/' ? '/index' : req.path;

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
            return res.send(contentFile);
        }

        // If we made it this far we want to now check if the static html file exists

        let pagePath = path.join(currentDirectory, './pages', route + '.html');
        let pagePathIndex = path.join(currentDirectory, './pages', route, '/index.html');
        let pageContent = null;

        if (fs.existsSync(pagePath)) {
            pageContent = parser.processFile(pagePath);
        } else if(fs.existsSync(pagePathIndex)) {
            pageContent = parser.processFile(pagePathIndex);
        }

        if (pageContent != null) {
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
    }
}
