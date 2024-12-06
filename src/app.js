const { Parser } = require('./parser.js');
const { ByteComiler } = require('./bytecompiler.js');
const { runBytecode, envx, envxCall } = require('./runtime.js');

const EXT = 'envx';
const PLUGIN_VITE = 'envxPluginVite';

const TEMPLATE  = 
`
const { runBytecode, envx, <pluginName> } = require('./src/app.js');
runBytecode([<code>]);
module.exports = {
    <pluginName>,
    envx
};
`

const getBuildEnvironment = () => {
    try {
        return (process.env?.NODE_ENV || 'development').toLowerCase();
    } catch (err) {
        console.error("error::getBuildEnvironment: file read failed!!!");
        throw err;
    }
};

const readEnvContent = (pathOfFile) => {
    try {
        const  fs = require('fs');
        return fs.readFileSync(pathOfFile, 'utf-8');
    } catch (err) {
        return '';
    }
}

const runBuild = (pluginName) => {
    const envFilePrefix = getBuildEnvironment();
    const envFile = `${envFilePrefix}.${EXT}`;
    const file = readEnvContent(envFile, 'utf-8');
    // Run the compiler
    const comp  = new ByteComiler(new Parser(envFile, file));
    const bytes = comp.compile().join(', ');
    
    // Write the compiled bytecode to index.js
    const template = TEMPLATE
        .replace('<code>', bytes)
        .replaceAll('<pluginName>', pluginName);

    try {
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(path.join(path.dirname(__dirname), 'index.js'), template);
    } catch (err) {
        console.error("error::runBuild: file write failed!!!");
        throw err;
    }
}

const runTest = () => {
    const envFilePrefix = getBuildEnvironment();
    const envFile = `${envFilePrefix}.${EXT}`;
    const file = readEnvContent(envFile, 'utf-8');
    // Run the compiler
    const comp  = new ByteComiler(new Parser(envFile, file));
    runBytecode(comp.compile());
}

/**
 * @brief Vite plugin for envx
 * @param {Object} options
 * @returns void 
 */
function envxPluginVite(options = {}) {
    return {
        name: 'envx-vite-plugin', // required, will show up in warnings and errors
        config(config, { command }) {
            if (command === 'serve' || command === 'build') {
                runBuild(PLUGIN_VITE);
            }
        }
    };
}

module.exports = {
    runBytecode,
    runTest,
    envxPluginVite,
    envx,
    envxCall
}