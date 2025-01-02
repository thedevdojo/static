const execSync = require('child_process').execSync;
const packageJson = require('../package.json');
const fs = require('fs-extra');
const path = require('path');

function executeCommand(command) {
    return execSync(command, { encoding: 'utf8' });
}

function cleanTestDirectory() {
    if (fs.existsSync('testProject')) {
        fs.removeSync('testProject');
    }
}

// Helper function to wait for directory to be ready
function waitForDirectory(dir, maxAttempts = 30) {
    let attempts = 0;
    while (attempts < maxAttempts) {
        if (fs.existsSync(dir)) {
            return true;
        }
        execSync('sleep 1');
        attempts++;
    }
    return false;
}

describe('bin/static CLI', () => {
    jest.setTimeout(30000); // Set timeout to 30 seconds for all tests
    
    beforeEach(() => {
        process.env.NODE_ENV = 'test';
        cleanTestDirectory();
    });

    afterEach(() => {
        cleanTestDirectory();
    });

    it('should return version', () => {
        const output = executeCommand('./bin/static --version');
        expect(output.trim()).toBe(packageJson.version);
    });

    it('should create a new project', () => {
        const output = executeCommand('./bin/static new testProject');
        
        // Wait for project directory to be ready
        expect(waitForDirectory('testProject')).toBe(true);
        
        expect(output.trim()).toBe([
            "New setup initialized",
            "Downloading starter template",
            "Finished downloading template",
            "Extracting template zip file",
            "Finished unzipping",
            "New site available inside testProject folder"
        ].join('\n'));
    });

    it('should build project', () => {
        // First create the project
        executeCommand('./bin/static new testProject');
        
        // Wait for project to be ready
        expect(waitForDirectory('testProject')).toBe(true);
        
        // Ensure we're in a clean state
        if (fs.existsSync(path.join('testProject', '_site'))) {
            fs.removeSync(path.join('testProject', '_site'));
        }
        
        const output = executeCommand('cd testProject && ../bin/static build relative');
        expect(output.trim()).toBe("Successfully built your new static website 🤘");
        
        // Verify build output exists
        expect(fs.existsSync(path.join('testProject', '_site'))).toBe(true);
    });
});
