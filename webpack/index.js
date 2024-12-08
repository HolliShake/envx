const { ByteComiler } = require("../src/bytecompiler");
const { getBuildEnvironment, readEnvContent } = require("../src/util");

const TEMPLATE_CODE =
`
import { runBytecode, envx as _envx, envxCall as _envxCall } from 'dto-envx/src/runtime.js';
runBytecode([<code>]);
export const envx = _envx;
export const envxCall = _envxCall;
`;


class envxWebpackPlugin {

    static defaultOptions = {
        outputFile: 'dto-envx.compile.js',
    };
    
    constructor(options = {}) {
        this.options = { ...envxWebpackPlugin.defaultOptions, ...options };
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('envx-webpack-plugin', (compilation, callback) => {
            const envFile = getBuildEnvironment() + '.envx';
            const envData = readEnvContent(envFile, 'utf-8');
            const comp = new ByteComiler(new Parser(envFile, envData));
            const code = comp.compile().join(', ');
            const moduleCode = TEMPLATE_CODE.replace('<code>', code);
            compilation.assets[this.options.outputFile] = {
                source: () => moduleCode,
                size: () => moduleCode.length   
            };
            callback();
        });
    }

}

module.exports = envxWebpackPlugin;
