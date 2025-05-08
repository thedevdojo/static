const { exec } = require("child_process");
const fs = require('fs');
const currentDirectory = process.cwd();
const path = require('path');
const fsExtra = require('fs-extra');

module.exports = {
    buildJSFile(build = false, buildDir = './_site'){
        let esBuildFlag = "--watch";
        if(build){
            esBuildFlag = "--minify";
        }
        exec("npx esbuild ./src/assets/js/main.js --bundle --outfile=" + buildDir + "/assets/js/main.js " + esBuildFlag, (err, stdout, stderr) => {
            if (err) {
            console.error("Error compling main.js:");
            console.error(err);
            }
            console.log(stdout);
        });
    },
    moveImages(buildDir = '_site'){

        let imagesFolder = 'src/assets/images'
        try {
            if (fs.existsSync(imagesFolder)) {
                this.createFolderIfNotExists(buildDir + "/assets/");
                this.createFolderIfNotExists(buildDir + "/assets/images");

                let src=path.join(currentDirectory, '/src/assets/images'); 
                let dest=path.join(currentDirectory, '_site/assets/images'); 
                if(buildDir != '_site'){
                    dest = buildDir + '/assets/images';
                }
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
    buildTailwindCSS(buildDir = './_site'){
        // console.log(exec("npx tailwindcss version"));
        // console.log(buildDir);
        exec("npx @tailwindcss/cli -i ./src/assets/css/main.css -o " + buildDir + "/assets/css/main.css --minify", (err, stdout, stderr) => {
        //exec("npx tailwindcss -i ./assets/css/main.css -o " + buildDir + "/assets/css/main.css --minify", (err, stdout, stderr) => {
            if (err) {
            console.error("Error compling tailwindcss:");
            console.error(err);
            }
            console.log(stdout);
        });
        
    },
    movePublicFolderContents(buildDir = '_site'){
        const publicFolder = path.join(currentDirectory, 'public');
        let siteFolder = path.join(currentDirectory, '_site');

        if(buildDir != '_site'){
            siteFolder = buildDir;
        }

        try {
            if (fs.existsSync(publicFolder)) {
                this.createFolderIfNotExists(siteFolder);

                fsExtra.copySync(publicFolder, siteFolder);
                //console.log('Contents from the public folder have been moved to the _site folder.');
            } 
        } catch (err) {
            console.error(`An error occurred: ${err}`);
        }

    }
}
