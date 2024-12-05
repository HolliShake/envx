const { Parser } = require('./parser.js');
const { ByteComiler } = require('./bytecompiler.js');
const { runBytecode, envx } = require('./runtime.js');

const EXT = 'envx';

const getBuildEnvironment = () => {
    try {
        return (process.env?.NODE_ENV || 'development').toLowerCase();
    } catch (err) {
        console.error("error::getBuildEnvironment: file read failed!!!");
        throw err;
    }
};

const buildPrepare = () => {
    const envFilePrefix = getBuildEnvironment();
    const envFile = `${envFilePrefix}.${EXT}`;
    try {
        const fs = require('fs');
        const file = fs.readFileSync(envFile, 'utf-8');
        // Run the compiler
        const comp = new ByteComiler(new Parser(envFile, file));
        runBytecode(comp.compile());
    } catch (err) {
        console.error("error::buildPrepair: file read failed!!!");
        throw err;
    }
};


const runEnv = () => {
    const envFilePrefix = getBuildEnvironment();
    const envFile = `${envFilePrefix}.${EXT}`;
    try {
        const fs = require('fs');
        const file = fs.readFileSync(envFile, 'utf-8');
        // Run the compiler
        const comp = new ByteComiler(new Parser(envFile, file));
        runBytecode(comp.compile());
    } catch (err) {
        console.error("error::buildPrepair: file read failed!!!");
        throw err;
    }
}

module.exports = {
    buildPrepare,
    runEnv,
    envx
}