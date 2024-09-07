const execSync = require('child_process').execSync;

const packageJson = require('../package.json');

function executeCommand(command) {
    return execSync(command, { encoding: 'utf8' });
}

describe('bin/static CLI', () => {
    it('should return version', () => {
        const output = executeCommand('./bin/static --version');
        expect(output.trim()).toBe(packageJson.version);
    });

    it('should create a new project', () => {
        process.env.NODE_ENV = 'test';
        const output = executeCommand('./bin/static new testProject');
        const expectedOutput = [
            "New setup initialized",
            "Downloading static starter template",
            "Finished downloading template",
            "Extracting template zip file",
            "Finished unzipping",
            "New site available inside testProject folder"
        ].join('\n');
        expect(output.trim()).toBe(expectedOutput);
    });

    it('should build project', () => {
        console.log('Output:', output);
        console.log('Current Directory:', process.cwd());
        console.log('Directory Contents:', executeCommand('ls -al'));

        // const output = executeCommand('cd testProject/static-starter-main && ../../bin/static build relative');
        console.log('Output:', output);
        console.log('Current Directory:', process.cwd());
        console.log('Directory Contents:', executeCommand('ls -al'));

        const expectedOutput = [
            "Successfully built your new static website 🤘",
        ].join('\n');
        expect(output.trim()).toBe(expectedOutput);
    });
});
