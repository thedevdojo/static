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

const globalModulesPath = require("global-modules-path");

const esbuild = require('esbuild');

module.exports = {
    version(){
        let packageJSONLocation = globalModulesPath.getPath("@devdojo/static") + '/package.json';
        let packageJSON = JSON.parse(fs.readFileSync(packageJSONLocation, 'utf8'));
        console.log(packageJSON.version);
    }
}