const { OPCODE, getOpCodeName } = require("./opcode");

const ValueType  = Object.freeze({
    SCRIPT : "script",
    FN     : "fn",
    JSFN   : "jsfn",
    NUMBER : "number",
    STRING : "string",
    BOOL   : "bool",
    NULL   : "null",
    ERROR  : "error"
});

class Value {
    constructor(dtype, value) {
        this.dtype = dtype;
        this.value = value;
    }

    toString() {
        if (!this.dtype)
            return "null";
        switch (this.dtype.name) {
            case ValueType.NUMBER:
                return this.value.toString();
            case ValueType.STRING:
                return this.value;
            case ValueType.BOOL:
                return this.value.toString();
            case ValueType.NULL:
                return "null";
            case ValueType.ERROR:
                return this.value;
            case ValueType.FN:
                return `<function ${this.value.name}>`;
            case ValueType.JSFN:
                return `<jsfunction ${this.value.name}>`;
            default:
                return "unknown";
        }
    }
}

const CONSTRUCTOR_NUMBER = Object.freeze({
    "name": ValueType.NUMBER,
    "static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_NUMBER, value));
    }
});

const CONSTRUCTOR_STRING = Object.freeze({
    "name": ValueType.STRING,
    "static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_STRING, value));
    }
})

const CONSTRUCTOR_BOOL = Object.freeze({
    "name": ValueType.BOOL,
    "static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_BOOL, value));
    }
})

const SINGLETON_NULL = new Value(null, null);
const CONSTRUCTOR_NULL = Object.freeze({
    "name": ValueType.NULL,
    "static.new": function(state) {
        state.stack.push(SINGLETON_NULL);
    }
})

const CONSTRUCTOR_ERROR = Object.freeze({
    "name": ValueType.ERROR,
    "static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_ERROR, value));
    }
})

const CONSTRUCTOR_FN = Object.freeze({
    "name": ValueType.FN,
    "static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_FN, value));
    }
})

const CONSTRUCTOR_JSFN = Object.freeze({
    "name": ValueType.JSFN,
    "static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_FN, value));
    }
})

const get4Number = (pc, codeArray) => {
    let value = 0;
    for (let i = 0; i < 4; i++) {
        value |= codeArray[pc + i] << (i * 8);
    }
    return value;
}

const getNumber = (pc, codeArray) => {
    let value = 0;
    for (let i = 0; i < 8; i++) {
        value |= codeArray[pc + i] << (i * 8);
    }
    return value;
}

const nameLookup = (name, scope) => {
    let current = scope;
    while (current != null) {
        if (current.hasOwnProperty(name)) {
            return current[name];
        }
        current = current["$"];
    }
    return null;
}

const binMul = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["static.new"](state, a.value * b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binDiv = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["static.new"](state, a.value / b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binMod = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["static.new"](state, a.value % b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binAdd = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["static.new"](state, a.value + b.value);
    } else if (a.dtype.name == ValueType.STRING && b.dtype.name == ValueType.STRING) {
        CONSTRUCTOR_STRING["static.new"](state, a.value + b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for +: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binSub = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["static.new"](state, a.value - b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binShl = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["static.new"](state, a.value << b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binShr = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["static.new"](state, a.value >> b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binLt = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_BOOL["static.new"](state, a.value < b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for >: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binLe = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_BOOL["static.new"](state, a.value <= b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for >: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binGt = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_BOOL["static.new"](state, a.value > b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for >: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binGe = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_BOOL["static.new"](state, a.value >= b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["static.new"](state, `TypeError: unsupported operand type(s) for >: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binEq = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    CONSTRUCTOR_BOOL["static.new"](state, a.value === b.value);
}

const binNe = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    CONSTRUCTOR_BOOL["static.new"](state, a.value !== b.value);
}

function callScript(state, valueOfTypeScript) {
    // Save current scope
    state.env.push(state.scope);
    state.scope = {
        "$": state.scope //parent
    };
    load(state); // load builtins when script is called
    execute(state, valueOfTypeScript);
    // Restore scope
    state.scope = state.env.pop();
}

function callFn(state, valueOfTypeOfFn) {
    // Save current scope
    state.env.push(state.scope);
    state.scope = {
        "$": state.scope //parent
    };
    execute(state, valueOfTypeOfFn);
    // Restore scope
    state.scope = state.env.pop();
}

function callJsFn(state, valueOfTypeJsfFn, argc) {
    const args = [];
    for (let i = 0; i < argc; i++) {
        args.push(state.stack.pop());
    }
    valueOfTypeJsfFn.value.code(state, ...args);
}

function execute(state, valueOfTypeScriptOrFn) {
    const code = valueOfTypeScriptOrFn.value.code;
    let pc     = 0; // program counter

    while (pc < code.length) {
        const opcode = code[pc];
        switch (opcode) {
            case OPCODE.LOAD_NUMBER: {
                const num = getNumber(pc + 1, code);
                CONSTRUCTOR_NUMBER["static.new"](state, num);
                // 8 bytes + next
                pc += 9;
                break;
            }
            case OPCODE.LOAD_STRING: {
                let index = pc + 1;
                let str = ""
                while (code[index] != 0) {
                    str += String.fromCharCode(code[index]);
                    index++;
                }
                CONSTRUCTOR_STRING["static.new"](state, str);
                // (str + 1nullchr) + next
                pc += str.length + 1 + 1;
                break;
            }
            case OPCODE.LOAD_NULL: {
                CONSTRUCTOR_NULL["static.new"](state);
                // next
                pc += 1;
                break;
            }
            case OPCODE.LOAD_NAME: {
                let index = pc + 1;
                let name = ""
                while (code[index] != 0) {
                    name += String.fromCharCode(code[index]);
                    index++;
                }

                const value = nameLookup(name, state.scope);

                // Allow fault tolerance
                // when name is not found
                // at runtime
                if (value) {
                    state.stack.push(value);
                } else {
                    CONSTRUCTOR_ERROR["static.new"](state, `NameError: name '${name}' is not defined`);
                }

                // (name + 1nullchr) + next
                pc += name.length + 1 + 1;
                break;
            }
            case OPCODE.CALL_FUNCTION: {
                
                const args = get4Number(pc + 1, code);

                const fn = state.stack.pop();
                
                if (fn.dtype.name != ValueType.FN && fn.dtype.name != ValueType.JSFN) {
                    // Allow fault tolerance
                    // when object is not callable
                    // at runtime

                    /**** pop args **/
                    for (let i = 0; i < args; i++) state.stack.pop();
                    CONSTRUCTOR_ERROR["static.new"](state, `TypeError: ${fn.dtype.name} is not callable`);
                    pc += 4 + 1;
                    break;
                }

                if (fn.value.args != -1 && fn.value.args != args) {
                    // Allow fault tolerance
                    // when number of arguments
                    // does not match
                    // at runtime

                    /**** pop args **/
                    for (let i = 0; i < args; i++) state.stack.pop();
                    CONSTRUCTOR_ERROR["static.new"](state, `TypeError: ${fn.value.name}() takes ${fn.value.args} arguments but ${args} were given`);
                    pc += 4 + 1;
                    break;
                }

                if (fn.dtype.name == ValueType.FN)
                    callFn(state, fn);
                else
                    callJsFn(state, fn, args);

                // 4 bytes for argc + next
                pc += 4 + 1;
                break;
            }
            case OPCODE.STORE_FAST: {
                let index = pc + 1;
                let name = ""
                while (code[index] != 0) {
                    name += String.fromCharCode(code[index]);
                    index++;
                }
                state.scope[name] = state.stack.pop();
                // (name + 1nullchr) + next
                pc += name.length + 1 + 1;
                break;
            }
            case OPCODE.STORE_NAME: {
                let index = pc + 1;
                let name = ""
                while (code[index] != 0) {
                    name += String.fromCharCode(code[index]);
                    index++;
                }
                state.scope[name] = state.stack.pop();
                // (name + 1nullchr) + next
                pc += name.length + 1 + 1;
                break;
            }
            case OPCODE.BIN_MUL: {
                binMul(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_DIV: {
                binDiv(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_MOD: {
                binMod(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_ADD: {
                binAdd(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_SUB: {
                binSub(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_SHL: {
                binShl(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_SHR: {
                binShr(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_LT: {
                binLt(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_LE: {
                binLe(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_GT: {
                binGt(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_GE: {
                binGe(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_EQ: {
                binEq(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_NE: {
                binNe(state);
                pc += 1;
                break;
            }
            case OPCODE.MAKE_FUNCTION: {
                let index = pc + 1;
                let name = ""
                while (code[index] != 0) {
                    name += String.fromCharCode(code[index]);
                    index++;
                }

                // 4 bytes for argc
                const argc = get4Number(index + 1, code);

                // 4 bytes for body size
                const bodySize = get4Number(index + 1 + 4, code);

                const begin = index + 1 + 4 + 4;
                const ended = begin + bodySize;
                const body  = code.slice(begin, ended);
            
                CONSTRUCTOR_FN["static.new"](state, ({
                    name: name,
                    args: argc,
                    code: body
                }));
   
                // (name + 1nullchr) + 4 bytes for argc + 4 bytes for body size + body + next
                pc += name.length + 1 + 4 + 4 + bodySize + 1;
                break;
            }
            case OPCODE.POP_TOP: {
                state.stack.pop();
                pc += 1;
                break;
            }
            case OPCODE.JUMP: {
                pc += get4Number(pc + 1, code);
                break;
            }
            case OPCODE.POP_JUMP_IF_FALSE: {
                const value = state.stack.pop();
                if (!value.value) {
                    pc += get4Number(pc + 1, code);
                } else {
                    // 4 byte offset + next
                    pc += 4 + 1;
                }
                break;
            }
            case OPCODE.RETURN: {
                return;
            }
            default: {
                console.error(`Unknown opcode: ${getOpCodeName(opcode)}`);
                return;
            }
        }
    }
}


function load(state) {
    state.scope["println"]
        = new Value(CONSTRUCTOR_JSFN, ({
            name: "println",
            args: -1,
            code: function (state, ...args) {
                console.log(...args.map((a) => a.toString()))
                CONSTRUCTOR_NULL["static.new"](state);
            }
        }));
}

function runBytecode(arrayOfBytes) {
    const state = ({
        stack: [],
        env: [],
        scope: {}
    })
    const asValue = new Value(ValueType.SCRIPT, ({
        name: "main",
        args: 0,
        code: arrayOfBytes
    }));
    callScript(state, asValue);
    if (state.stack.length != 1)
        console.error(`Runtime error: stack is not empty (${state.stack.length})`);
}

module.exports = {
    runBytecode
}

