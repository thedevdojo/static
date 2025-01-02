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

describe('bin/static CLI', () => {
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

    it('should create a new project', (done) => {
        try {
            const output = executeCommand('./bin/static new testProject');
            
            // Give the async operations time to complete
            setTimeout(() => {
                try {
                    expect(fs.existsSync('testProject')).toBe(true);
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
            }, 5000);
        } catch (err) {
            done(err);
        }
    });

    it('should build project', (done) => {
        try {
            // First create the project
            executeCommand('./bin/static new testProject');
            
            // Wait for project creation to complete
            setTimeout(() => {
                try {
                    const output = executeCommand('cd testProject && ../bin/static build relative');
                    expect(output.trim()).toBe("Successfully built your new static website 🤘");
                    expect(fs.existsSync(path.join('testProject', '_site'))).toBe(true);
                    done();
                } catch (err) {
                    done(err);
                }
            }, 5000);
        } catch (err) {
            done(err);
        }
    });
});
