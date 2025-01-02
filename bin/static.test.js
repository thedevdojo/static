const execSync = require('child_process').execSync;
const packageJson = require('../package.json');
const fs = require('fs');

function executeCommand(command) {
    return execSync(command, { encoding: 'utf8' });
}

describe('bin/static CLI', () => {
    beforeEach(() => {
        process.env.NODE_ENV = 'test';
        // Clean up test directory if it exists
        if (fs.existsSync('testProject')) {
            execSync('rm -rf testProject');
        }
    });

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync('testProject')) {
            execSync('rm -rf testProject');
        }
    });

    it('should return version', () => {
        const output = executeCommand('./bin/static --version');
        expect(output.trim()).toBe(packageJson.version);
    });

    it('should create a new project', (done) => {
        process.env.NODE_ENV = 'test';
        const output = executeCommand('./bin/static new testProject');
        
        // Give the async operations time to complete
        setTimeout(() => {
            try {
                expect(fs.existsSync('testProject')).toBe(true);
                expect(fs.existsSync('testProject/pages')).toBe(true);
                expect(output.trim()).toBe([
                    "New setup initialized",
                    "Downloading starter template",
                    "Finished downloading template",
                    "Extracting template zip file",
                    "Finished unzipping",
                    "New site available inside testProject folder"
                ].join('\n'));
                done();
            } catch (err) {
                done(err);
            }
        }, 5000); // Wait 5 seconds for async operations
    });

    it('should build project', () => {
        // First create the project and wait for it to complete
        executeCommand('./bin/static new testProject');
        // Give it time to finish async operations
        execSync('sleep 5');
        
        const output = executeCommand('cd testProject && ../bin/static build relative');
        expect(output.trim()).toBe("Successfully built your new static website 🤘");
        
        // Verify the build output exists
        expect(fs.existsSync('testProject/_site')).toBe(true);
    });
});
