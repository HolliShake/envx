

const PADDING = 3;

function throwError(envFile, fileContent, message, position) {
    const lines = fileContent.split("\n");

    const lstart = Math.max(0, position.sline - PADDING);
    const lended = Math.min(lines.length, position.eline + PADDING);

    let str = "";
    for (let i = lstart;i < lended; i++) {
        const line = lines[i];
        str += `${i + 1} | ${line}`;
        if (i + 1 === position.sline) {
            str += "\n";
            str += " ".repeat(position.scolm) + "^".repeat(position.ecolm - position.scolm);
        }
        if (i < lended - 1) {
            str += "\n";
        }
    }
    str = `Error: ${message} at ${envFile}:${position.sline}:${position.scolm}\n${str}`;
    
    try {
        if (window.stop) {
            window.stop();
        }
    } catch (e) {
        // do nothing
    }
    throw new Error(str);
}


module.exports = {
    throwError
};
