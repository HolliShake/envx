

const OPCODE = Object.freeze({
    LOAD_NUMBER        : 0x0f,
    LOAD_STRING        : 0x10,
    LOAD_BOOL          : 0x11,
    LOAD_NULL          : 0x12,
    LOAD_NAME          : 0x13,
    GET_ATTRIBUTE      : 0x14,
    CALL_FUNCTION      : 0x15,
    CALL_METHOD        : 0x16,
    MAKE_FUNCTION      : 0x17,
    STORE_FAST         : 0x18,
    STORE_NAME         : 0x19,
    STORE_GLOBAL       : 0x1a,
    LOG_NOT            : 0x1b,
    BIT_NOT            : 0x1c,
    POS                : 0x1d,
    NEG                : 0x1e,
    BIN_MUL            : 0x1f,
    BIN_DIV            : 0x20,
    BIN_MOD            : 0x21,
    BIN_ADD            : 0x22,
    BIN_SUB            : 0x23,
    BIN_SHL            : 0x24,
    BIN_SHR            : 0x25,
    BIN_LT             : 0x26,
    BIN_LE             : 0x27,
    BIN_GT             : 0x28,
    BIN_GE             : 0x29,
    BIN_EQ             : 0x2a,
    BIN_NE             : 0x2b,
    BIN_AND            : 0x2c,
    BIN_OR             : 0x2d,
    BIN_XOR            : 0x2e,
    POP_TOP            : 0x2f,
    DUP_TOP            : 0x30,
    POP_JUMP_IF_FALSE  : 0x31,
    JUMP               : 0x32,
    RETURN             : 0x33
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

