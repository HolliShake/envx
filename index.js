const { Parser } = require('./src/parser.js');
const { ByteComiler } = require('./src/bytecompiler.js');
const { getBuildEnvironment, readEnvContent } = require('./src/util.js');
const { runBytecode, envx, envxCall } = require('./src/runtime.js');

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
