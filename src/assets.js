const { exec } = require("child_process");
const fs = require('fs');
const currentDirectory = process.cwd();
const path = require('path');
const fsExtra = require('fs-extra');

module.exports = {
    buildJSFile(build = false){
        let esBuildFlag = "--watch";
        if(build){
            esBuildFlag = "--minify";
        }
        exec("npx esbuild ./assets/js/main.js --bundle --outfile=./_site/assets/js/main.js " + esBuildFlag, (err, stdout, stderr) => {
            if (err) {
            console.error("Error compling main.js:");
            console.error(err);
            }
            console.log(stdout);
        });
    },
    moveImages(){

        let imagesFolder = 'assets/images'
        try {
            if (fs.existsSync(imagesFolder)) {
                this.createFolderIfNotExists("_site/assets/");
                this.createFolderIfNotExists("_site/assets/images");

                let src=path.join(currentDirectory, '/assets/images'); 
                let dest=path.join(currentDirectory, '/_site/assets/images'); 
                this.copyDirSync(src, dest);
            }
        } catch (err) {
            console.error(err);
        }
    },
    copyDirSync(src, dest) {
        try {
            fsExtra.copySync(src, dest);
        } catch (err) {
            console.error(`An error occurred: ${err}`);
        }
    },
    createFolderIfNotExists(folderPath) {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
    },
    buildTailwindCSS(){
        exec("npx tailwindcss -i ./assets/css/main.css -o ./_site/assets/css/main.css --minify", (err, stdout, stderr) => {
            if (err) {
            console.error("Error compling tailwindcss:");
            console.error(err);
            }
            console.log(stdout);
        });
        
    }
}