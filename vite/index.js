const { getBuildEnvironment, readEnvContent } = require('../src/util.js');
const { Parser } = require('../src/parser.js');
const { ByteComiler } = require('../src/bytecompiler.js');

const TEMPLATE_CODE =
`
import { runBytecode, envx as _envx, envxCall as _envxCall } from 'dto-envx/src/runtime.js';
runBytecode([<code>]);
export const envx = _envx;
export const envxCall = _envxCall;
`;

/**
 * @brief Vite plugin for envx
 * @param {Object} options
 * @returns void 
 */
function envxPluginVite(options = {}) {
    const virtualModuleId = 'env:dto-envx', resolvedVirtualModuleId = '\0' + virtualModuleId;

    // Read file
    const envFile = getBuildEnvironment() + '.envx';
    const envData = readEnvContent(envFile, 'utf-8');

    // Run the compiler
    const comp = new ByteComiler(new Parser(envFile, envData));
    const code = comp.compile().join(', ');

    const moduleCode = TEMPLATE_CODE
        .replace('<code>', code);

    return {
        name: 'envx-vite-plugin', // required, will show up in warnings and errors
        apply(config, { command }) {
            return command == 'build' || command == 'serve' && !config.build.ssr;
        },
        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                return moduleCode;
            }
        },
    };
}

module.exports = envxPluginVite;
