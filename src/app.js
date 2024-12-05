const { ByteComiler } = require('./bytecompiler.js');
const { Parser } = require('./parser.js');
const { Tokenizer } = require('./tokenizer.js');

const EXT = 'envx';

const getBuildEnvironment = () => {
    try {
        return (process.env?.NODE_ENV || 'development').toLowerCase();
    } catch (err) {
        console.error("error::getBuildEnvironment: file read failed!!!");
        throw err;
    }
};

const buildPrepair = async () => {
    const envFilePrefix = getBuildEnvironment();
    const envFile = `${envFilePrefix}.${EXT}`;
    try {
        const fs = await import('fs');
        const file = fs.readFileSync(envFile, 'utf-8');

        const comp = new ByteComiler(new Parser(envFile, file));
        comp.compile();
        fs.writeFileSync('index.js', (`>>${file}`));
    } catch (err) {
        console.error("error::buildPrepair: file read failed!!!");
        throw err;
    }
};

buildPrepair();