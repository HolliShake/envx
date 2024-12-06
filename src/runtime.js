const { OPCODE, getOpCodeName } = require("./opcode");

const ValueType  = Object.freeze({
    SCRIPT : "script",
    FN     : "fn",
    JSFN   : "jsfn",
    TYPE   : "type",
    NUMBER : "number",
    STRING : "string",
    BOOL   : "bool",
    NULL   : "null",
    ERROR  : "error",
    ARRAY  : "array"
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
            case ValueType.ARRAY: {
                let str = "[" + this.value.map((v) => (this == v) ? "[self]" : v.toString()).join(", ") + "]";
                return str;
            }
            case ValueType.FN:
                return `<function ${this.value.name} />`;
            case ValueType.JSFN:
                return `<jsfunction ${this.value.name} />`;
            case ValueType.TYPE:
                return `<type @${this.value.name} />`;
            default:
                return "unknown";
        }
    }
}


const CONSTRUCTOR_FN = ({
    "name": ValueType.FN,
    "private.static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_FN, value));
    }
});

const CONSTRUCTOR_JSFN = ({
    "name": ValueType.JSFN,
    "private.static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_FN, value));
    }
});

const BASE_PROPERTIES = ({
    "toString": new Value(CONSTRUCTOR_JSFN, ({
        name: "toString",
        args: 0,
        code: function(state, ...args) {
            CONSTRUCTOR_STRING["private.static.new"](state, args[0].toString());
        }
    })),
});

const CONSTRUCTOR_ERROR = Object.freeze({
    ...BASE_PROPERTIES,
    "name": ValueType.ERROR,
    "private.static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_ERROR, value));
    }
});

const CONSTRUCTOR_TYPE = ({
    ...BASE_PROPERTIES,
    "name": ValueType.TYPE,
});

const CONSTRUCTOR_NUMBER = ({
    ...BASE_PROPERTIES,
    "name": ValueType.NUMBER,
    "private.static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_NUMBER, value));
    },
    /****************/
    "isEven": new Value(CONSTRUCTOR_JSFN, ({
        name: "isEven",
        args: 0,
        code: function(state, ...args) {
            CONSTRUCTOR_BOOL["private.static.new"](state, args[0].value % 2 == 0);
        }
    })),
    /****************/ 
    "static.mul": new Value(CONSTRUCTOR_JSFN, ({
        name: "mul",
        args: 2,
        code: function(state, ...args) {
            state.stack.push(args[1]);
            state.stack.push(args[2]);
            binMul(state);
        }
    })),
    "static.div": new Value(CONSTRUCTOR_JSFN, ({
        name: "div",
        args: 2,
        code: function(state, ...args) {
            state.stack.push(args[1]);
            state.stack.push(args[2]);
            binDiv(state);
        }
    })),
    "static.mod": new Value(CONSTRUCTOR_JSFN, ({
        name: "mod",
        args: 2,
        code: function(state, ...args) {
            state.stack.push(args[1]);
            state.stack.push(args[2]);
            binMod(state);
        }
    })),
    "static.add": new Value(CONSTRUCTOR_JSFN, ({
        name: "add",
        args: 2,
        code: function(state, ...args) {
            state.stack.push(args[1]);
            state.stack.push(args[2]);
            binAdd(state);
        }
    })),
    "static.sub": new Value(CONSTRUCTOR_JSFN, ({
        name: "sub",
        args: 2,
        code: function(state, ...args) {
            state.stack.push(args[1]);
            state.stack.push(args[2]);
            binSub(state);
        }
    })),
});

const CONSTRUCTOR_STRING = ({
    ...BASE_PROPERTIES,
    "name": ValueType.STRING,
    "private.static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_STRING, value));
    },
    /****************/
    "concat": new Value(CONSTRUCTOR_JSFN, ({
        name: "concat",
        args: 1,
        code: function(state, ...args) {
            state.stack.push(args[0]);
            state.stack.push(args[1]);
            binAdd(state);
        }
    })),
});

const CONSTRUCTOR_BOOL = ({
    ...BASE_PROPERTIES,
    "name": ValueType.BOOL,
    "private.static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_BOOL, value));
    }
});

const CONSTRUCTOR_NULL = Object.freeze({
    ...BASE_PROPERTIES,
    "name": ValueType.NULL,
    "private.static.new": function(state) {
        state.stack.push(new Value(CONSTRUCTOR_NULL, null));
    }
});

const CONSTRUCTOR_ARRAY = ({
    ...BASE_PROPERTIES,
    "name": ValueType.ARRAY,
    "private.static.new": function(state, value) {
        state.stack.push(new Value(CONSTRUCTOR_ARRAY, value));
    },
    /****************/
    "push": new Value(CONSTRUCTOR_JSFN, ({
        name: "push",
        args: -1,
        code: function(state, ...args) {
            const obj = args[0];
            obj.value.push(...[...args].slice(1));
            CONSTRUCTOR_NULL['private.static.new'](state)
        }
    })),
    "pop": new Value(CONSTRUCTOR_JSFN, ({
        name: "pop",
        args: 0,
        code: function(state, ...args) {
            if (args[0].value.length == 0) {
                CONSTRUCTOR_ERROR["private.static.new"](state, "IndexError: pop from empty list");
                return;
            }
            const obj = args[0];
            state.stack.push(obj.value.pop());
        }
    })),
    "peek": new Value(CONSTRUCTOR_JSFN, ({
        name: "peek",
        args: 0,
        code: function(state, ...args) {
            if (args[0].value.length == 0) {
                CONSTRUCTOR_ERROR["private.static.new"](state, "IndexError: peek from empty list");
                return;
            }
            const obj = args[0];
            state.stack.push(obj.value[obj.value.length - 1]);
        }
    })),
    "length": new Value(CONSTRUCTOR_JSFN, ({
        name: "length",
        args: 0,
        code: function(state, ...args) {
            const obj = args[0];
            CONSTRUCTOR_NUMBER["private.static.new"](state, obj.value.length);
        }
    })),
});

const valueToJsObj = (value) => {
    switch (value?.dtype?.name ?? null) {
        case ValueType.NUMBER:
            return value.value;
        case ValueType.STRING:
            return value.value;
        case ValueType.BOOL:
            return value.value;
        case ValueType.ERROR:
            return value.value.toString();
        case ValueType.ARRAY:
            return value.value.map(x => valueToJsObj(x));
        case ValueType.SCRIPT:
        case ValueType.FN:
        case ValueType.JSFN:
        case ValueType.NULL:
        default:
            return null;
    }
}

const jsObjToValue = (jsObj) => {
    if (typeof jsObj === "number") {
        return new Value(CONSTRUCTOR_NUMBER, jsObj);
    } else if (typeof jsObj === "string") {
        return new Value(CONSTRUCTOR_STRING, jsObj);
    } else if (typeof jsObj === "boolean") {
        return new Value(CONSTRUCTOR_BOOL, jsObj);
    } else if (jsObj && jsObj.constructor.name == "Array") {
        return new Value(CONSTRUCTOR_ARRAY, jsObj.map(x => jsObjToValue(x)));
    } else {
        return new Value(CONSTRUCTOR_NULL, null);
    }
}

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

const getGlobalScope = (scope) => {
    let current = scope;
    while (current["$"] != null) {
        current = current["$"];
    }
    return current;
}

const logNot = (state) => {
    const a = state.stack.pop();
    CONSTRUCTOR_BOOL["private.static.new"](state, !a.value);
}

const bitNot = (state) => {
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, ~a.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for ~: '${a.dtype.name}'`);
    }
}

const pos = (state) => {
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, +a.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: bad operand type for unary +: '${a.dtype.name}'`);
    }
}

const neg = (state) => {
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, -a.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: bad operand type for unary -: '${a.dtype.name}'`);
    }
}

const binMul = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value * b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binDiv = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value / b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binMod = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value % b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binAdd = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value + b.value);
    } else if (a.dtype.name == ValueType.STRING && b.dtype.name == ValueType.STRING) {
        CONSTRUCTOR_STRING["private.static.new"](state, a.value + b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for +: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binSub = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value - b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binShl = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value << b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binShr = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value >> b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for -: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binLt = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_BOOL["private.static.new"](state, a.value < b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for >: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binLe = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_BOOL["private.static.new"](state, a.value <= b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for >: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binGt = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_BOOL["private.static.new"](state, a.value > b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for >: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binGe = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_BOOL["private.static.new"](state, a.value >= b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for >: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binEq = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    CONSTRUCTOR_BOOL["private.static.new"](state, a.value === b.value);
}

const binNe = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    CONSTRUCTOR_BOOL["private.static.new"](state, a.value !== b.value);
}

const binAnd = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value & b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for &: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binOr = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value | b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for |: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

const binXor = (state) => {
    const b = state.stack.pop();
    const a = state.stack.pop();
    if (a.dtype.name == ValueType.NUMBER && b.dtype.name == ValueType.NUMBER) {
        CONSTRUCTOR_NUMBER["private.static.new"](state, a.value ^ b.value);
    } else {
        // Allow fault tolerance
        // when operands are not compatible
        // at runtime
        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: unsupported operand type(s) for ^: '${a.dtype.name}' and '${b.dtype.name}'`);
    }
}

function callScript(state, valueOfTypeScript) {
    // Save current scope
    state.env.push(state.scope);
    const current = state.scope = {
        "$": state.scope //parent
    };
    load(state); // load builtins when script is called
    execute(state, valueOfTypeScript);
    // Restore scope
    state.scope = state.env.pop();
    return current;
}

function callFn(state, valueOfTypeOfFn, isMethod = false) {
    // Save current scope
    state.env.push(state.scope);
    const current = state.scope = {
        "$": state.scope //parent
    };
    if (isMethod) {
        current['this'] = state.stack.pop();
    }
    execute(state, valueOfTypeOfFn);
    // Restore scope
    state.scope = state.env.pop();
    return current;
}

function callJsFn(state, valueOfTypeJsfFn, argc, isMethod = false) {
    const args = [];
    if (isMethod) {
        args.push(state.stack.pop());
    }
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
                CONSTRUCTOR_NUMBER["private.static.new"](state, num);
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
                CONSTRUCTOR_STRING["private.static.new"](state, str);
                // (str + 1nullchr) + next
                pc += str.length + 1 + 1;
                break;
            }
            case OPCODE.LOAD_NULL: {
                CONSTRUCTOR_NULL["private.static.new"](state);
                // next
                pc += 1;
                break;
            }
            case OPCODE.MAKE_ARRAY: {
                const size = get4Number(pc + 1, code);

                const arr = [];
                for (let i = 0; i < size; i++) {
                    arr.push(state.stack.pop());
                }
                
                CONSTRUCTOR_ARRAY["private.static.new"](state, arr);

                // 4 bytes for size + next
                pc += 4 + 1;
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
                    CONSTRUCTOR_ERROR["private.static.new"](state, `NameError: name '${name}' is not defined`);
                }

                // (name + 1nullchr) + next
                pc += name.length + 1 + 1;
                break;
            }
            case OPCODE.GET_ATTRIBUTE: {
                let index = pc + 1;
                let name = ""
                while (code[index] != 0) {
                    name += String.fromCharCode(code[index]);
                    index++;
                }

                const obj = state.stack.pop();
                let attr = null;

                if (obj.dtype.name == ValueType.TYPE) {
                    // Get static attribute
                    attr  = obj.value[`static.${name}`];
                } else {
                    // Get static attribute
                    attr  = obj.dtype[name];
                }

                if (attr) {
                    state.stack.push(attr);
                }
                else {
                    // Allow fault tolerance
                    // when attribute is not found
                    // at runtime
                    CONSTRUCTOR_ERROR["private.static.new"](state, `AttributeError: '${obj.dtype.name}' object has no attribute '${name}'`);
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
                    CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: ${fn.dtype.name} is not callable`);
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
                    CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: ${fn.value.name}() takes ${fn.value.args} arguments but ${args} were given`);
                    pc += 4 + 1;
                    break;
                }

                if (fn.dtype.name == ValueType.FN)
                    callFn(state, fn, false);
                else
                    callJsFn(state, fn, args, false);

                // 4 bytes for argc + next
                pc += 4 + 1;
                break;
            }
            case OPCODE.CALL_METHOD: {
                const args = get4Number(pc + 1, code);

                const fn = state.stack.pop();
                
                if (fn.dtype.name != ValueType.FN && fn.dtype.name != ValueType.JSFN) {
                    /**** Pop thisArg **/
                    state.stack.pop();

                    // Allow fault tolerance
                    // when object is not callable
                    // at runtime

                    /**** pop args **/
                    for (let i = 0; i < args; i++) state.stack.pop();
                    CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: ${fn.dtype.name} is not callable`);
                    pc += 4 + 1;
                    break;
                }

                if (fn.value.args != -1 && fn.value.args != args) {
                    /**** Pop thisArg **/
                    state.stack.pop();

                    // Allow fault tolerance
                    // when number of arguments
                    // does not match
                    // at runtime

                    /**** pop args **/
                    for (let i = 0; i < args; i++) state.stack.pop();
                    CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: ${fn.value.name}() takes ${fn.value.args} arguments but ${args} were given`);
                    pc += 4 + 1;
                    break;
                }

                if (fn.dtype.name == ValueType.FN)
                    callFn(state, fn, true);
                else
                    callJsFn(state, fn, args, true);

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
            case OPCODE.STORE_GLOBAL: {
                let index = pc + 1;
                let name = ""
                while (code[index] != 0) {
                    name += String.fromCharCode(code[index]);
                    index++;
                }
                getGlobalScope(state.scope)[name] = state.stack.pop();
                // (name + 1nullchr) + next
                pc += name.length + 1 + 1;
                break;
            }
            case OPCODE.SET_ATTRIBUTE: {
                const obj = state.stack.pop();
                const val = state.stack.pop();
                
                let index = pc + 1;
                let name = ""
                while (code[index] != 0) {
                    name += String.fromCharCode(code[index]);
                    index++;
                }

                switch (obj.dtype.name) {
                    case ValueType.TYPE: {
                        obj.value[name] = val;
                        break
                    }
                    default: {
                        // Allow fault tolerance
                        // when object is not type
                        // at runtime
                        CONSTRUCTOR_ERROR["private.static.new"](state, `TypeError: ${obj.dtype.name} object does not support item assignment`);
                        break;
                    }
                }

                // (name + 1nullchr) + next
                pc += name.length + 1 + 1;
                break;
            }
            case OPCODE.LOG_NOT: {
                logNot(state);
                pc += 1;
                break;
            }
            case OPCODE.BIT_NOT: {
                bitNot(state);
                pc += 1;
                break;
            }
            case OPCODE.POS: {
                pos(state);
                pc += 1;
                break;
            }
            case OPCODE.NEG: {
                neg(state);
                pc += 1;
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
            case OPCODE.BIN_AND: {
                binAnd(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_OR: {
                binOr(state);
                pc += 1;
                break;
            }
            case OPCODE.BIN_XOR: {
                binXor(state);
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
            
                CONSTRUCTOR_FN["private.static.new"](state, ({
                    name: name,
                    args: argc,
                    code: body
                }));
   
                // (name + 1nullchr) + 4 bytes for argc + 4 bytes for body size + body + next
                pc += name.length + 1 + 4 + 4 + bodySize + 1;
                break;
            }
            case OPCODE.POP_TOP: {
                const t = state.stack.pop();
                if (!t) {
                    throw new Error("Runtime error: stack is empty");
                }
                pc += 1;
                break;
            }
            case OPCODE.DUP_TOP: {
                const top = state.stack[state.stack.length - 1];
                state.stack.push(top);
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
                throw new Error(`Unknown opcode: ${getOpCodeName(opcode)}`);
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
                CONSTRUCTOR_NULL["private.static.new"](state);
            }
        }));
    
    state.scope["Fn"]
        = new Value(CONSTRUCTOR_TYPE, CONSTRUCTOR_FN);
    
    state.scope["JsFn"]
        = new Value(CONSTRUCTOR_TYPE, CONSTRUCTOR_JSFN);

    state.scope["Number"]
        = new Value(CONSTRUCTOR_TYPE, CONSTRUCTOR_NUMBER);
    
    state.scope["String"]
        = new Value(CONSTRUCTOR_TYPE, CONSTRUCTOR_STRING);
    
    state.scope["Boolean"]
        = new Value(CONSTRUCTOR_TYPE, CONSTRUCTOR_BOOL);
    
    state.scope["Error"]
        = new Value(CONSTRUCTOR_TYPE, CONSTRUCTOR_ERROR);
}

const ENVXGLOBAL = ({});
const EXECUTABLE = ({});

const STATE = ({
    stack: [],
    env: [],
    scope: null
})

// API
function runBytecode(arrayOfBytes) {
    const asValue = new Value(ValueType.SCRIPT, ({
        name: "main",
        args: 0,
        code: arrayOfBytes
    }));
    const env = callScript(STATE, asValue);
    if (STATE.stack.length != 1) {
        console.error(`Runtime error: stack is not empty (${STATE.stack.length})`);
        throw new Error("Runtime error: stack is not empty");
    }
    // Save global names but not executable
    const keys0 = Object.keys(env).filter(k => !k.startsWith("$"));
    for (let i = 0;i < keys0.length; i++) {
        const key = keys0[i];
        ENVXGLOBAL[key] = env[key];
    }
}

// API
function envx(variableName) {
    const finalVariable = variableName || "";
    if (finalVariable.toString().startsWith("PRIVATE_")) 
        return null;
    return valueToJsObj(ENVXGLOBAL[finalVariable]);
}

// API
function envxCall(variableName, ...args) {
    const fn = ENVXGLOBAL[variableName];
    if (!fn)
        return null;

    if (fn.dtype.name != ValueType.FN && fn.dtype.name != ValueType.JSFN)
        return null;

    STATE.env.push(STATE.scope);
    STATE.scope = {
        "$": STATE.scope,
        ...ENVXGLOBAL
    };

    if (fn.dtype.name != ValueType.FN && fn.dtype.name != ValueType.JSFN) {
        // Allow fault tolerance
        // when object is not callable
        // at runtime

        CONSTRUCTOR_ERROR["private.static.new"](STATE, `TypeError: ${fn.dtype.name} is not callable`);
        return valueToJsObj(STATE.stack.pop());
    }

    if (fn.value.args != -1 && fn.value.args != args.length) {
        // Allow fault tolerance
        // when number of arguments
        // does not match
        // at runtime

        CONSTRUCTOR_ERROR["private.static.new"](STATE, `TypeError: ${fn.value.name}() takes ${fn.value.args} arguments but ${args.length} were given`);
        return valueToJsObj(STATE.stack.pop());
    }
    
    const arguments = [...args].reverse().map((jsObj) => jsObjToValue(jsObj));
    STATE.stack.push(...arguments);

    switch (fn.dtype.name) {
        case ValueType.FN:
            callFn(STATE, fn, false);
            STATE.scope = STATE.env.pop();
            return valueToJsObj(STATE.stack.pop());
        case ValueType.JSFN:
            callJsFn(STATE, fn, args.length, false);
            return valueToJsObj(STATE.stack.pop());
        default:
            return null;
    }
}

module.exports = {
    runBytecode,
    envx,
    envxCall
}

