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

const esbuild = require('esbuild');

module.exports = {
    start(){
        assets.buildJSFile();
        assets.moveImages();

        this.getAvailablePort(port).then((availablePort) => {

            // get available port for the Live Reload Server
            this.getAvailablePort(liveReloadDefaultPort).then((liveReloadAvailablePort) => {
                
            
                const liveReloadServer = livereload.createServer({
                    port: liveReloadAvailablePort
                });
                liveReloadServer.watch(currentDirectory + "/src");
                liveReloadServer.watch(currentDirectory + "/_site/assets");
                liveReloadServer.server.once("connection", () => {
                    setTimeout(() => {
                        liveReloadServer.refresh("/");
                    }, 100);
                });

                app.use(connectLiveReload());

                app.use('/assets', express.static(path.join(currentDirectory, '_site/assets')))
                
                app.get('/*', (req, res) => {
                    const route = req.path === '/' ? '/index' : req.path;
                    let pagePath = path.join(currentDirectory, './pages', route + '.html');
                    if (!fs.existsSync(pagePath)) {
                        pagePath = path.join(currentDirectory, './pages', route, 'index.html');
                        if (!fs.existsSync(pagePath)) {
                            res.status(404).send('Page not found');
                            return;
                        }
                    }
        
                    const content = parser.processFile(pagePath);
                    res.send(content);
                });

                app.listen(availablePort, () => {
                    console.log(`Server running at http://localhost:${availablePort}`);
                });

            }).catch((error) => {
                console.log('error finding available port for liveReload');
                console.log(error);
            });
            
        }).catch((error) => {
            console.log('error finding available port number');
            console.log(error);
        });
        
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
