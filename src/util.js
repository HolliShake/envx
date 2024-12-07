

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

module.exports = {
    getBuildEnvironment,
    readEnvContent
};
