

const PADDING = 3;

function throwError(envFile, fileContent, message, position) {
    const lines = fileContent.split("\n");

    const lstart = Math.max(0, position.sline - PADDING);
    const lended = Math.min(lines.length, position.eline + PADDING);

    let str = "";
    for (let i = lstart;i < lended; i++) {
        const line = lines[i];

        const diff = lended.toString().length - (i + 1).toString().length;

        str += `${" ".repeat(diff)}${i + 1} | `;


        if (i + 1 >= position.sline && i + 1 <= position.eline) {
            str += " > ";
        } else {
            str += "   ";
        }

        str += line;

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
