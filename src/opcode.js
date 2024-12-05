

const OPCODE = Object.freeze({
    LOAD_NUMBER    : 0x0f,
    LOAD_STRING    : 0x10,
    LOAD_BOOL      : 0x11,
    LOAD_NULL      : 0x12,
    LOAD_NAME      : 0x13,
    CALL_FUNCTION  : 0x14,
    MAKE_FUNCTION  : 0x15,
    STORE_FAST     : 0x16,
    STORE_NAME     : 0x17,
    BIN_MUL        : 0x18,
    BIN_DIV        : 0x19,
    BIN_MOD        : 0x1a,
    BIN_ADD        : 0x1b,
    BIN_SUB        : 0x1c,
    BIN_SHL        : 0x1d,
    BIN_SHR        : 0x1e,
    BIN_LT         : 0x1f,
    BIN_LE         : 0x20,
    BIN_GT         : 0x21,
    BIN_GE         : 0x22,
    BIN_EQ         : 0x23,
    BIN_NE         : 0x24,
    BIN_AND        : 0x25,
    BIN_OR         : 0x26,
    BIN_XOR        : 0x27,
    POP_TOP        : 0x28,
    POP_JUMP_IF_FALSE : 0x29,
    JUMP              : 0x2a,
    RETURN            : 0x2b,
})

const getOpCodeName = (opcode) => {
    for (const [key, value] of Object.entries(OPCODE)) {
        if (value === opcode) {
            return key;
        }
    }
    return null;
}

module.exports = {
    OPCODE,
    getOpCodeName
};

