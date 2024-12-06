const { runBytecode, envx, envxCall, envxPluginVite } = require('./src/app.js');
runBytecode([ 18, 43 ]);
module.exports = {
    envxPluginVite,
    envx,
    envxCall
};