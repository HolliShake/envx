const { Parser } = require('./parser.js');
const { ByteComiler } = require('./bytecompiler.js');
const { getBuildEnvironment, readEnvContent } = require('./util.js');
const { runBytecode, envx, envxCall } = require('./runtime.js');

const runBuild = () => {
    const envFile = getBuildEnvironment() + '.envx';
    const envData = readEnvContent(envFile, 'utf-8');
    // Run the compiler
    const comp  = new ByteComiler(new Parser(envFile, envData));
    runBytecode(comp.compile());
}

runBuild();
module.exports = {
    envx,
    envxCall
};
