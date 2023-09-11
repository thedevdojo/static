const currentDirectory = process.cwd();
require('dotenv').config({ path: currentDirectory + '/.env' });

module.exports = {
    get(key){
        return process.env[key];
    }
}