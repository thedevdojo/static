const { exec } = require("child_process");
const fs = require('fs');

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
                exec("cp -r assets/images _site/assets/", (err, stdout, stderr) => {
                    if (err) {
                    console.error("Error compling main.js:");
                    console.error(err);
                    }
                    console.log(stdout);
                });
            }
        } catch (err) {
            console.error(err);
        }
    },
    createFolderIfNotExists(folderPath) {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`Folder created: ${folderPath}`);
        } else {
            console.log(`Folder already exists: ${folderPath}`);
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