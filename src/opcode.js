

const OPCODE = Object.freeze({
    LOAD_NUMBER        : 0x0f,
    LOAD_STRING        : 0x10,
    LOAD_BOOL          : 0x11,
    LOAD_NULL          : 0x12,
    LOAD_NAME          : 0x13,
    MAKE_ARRAY         : 0x14,
    GET_ATTRIBUTE      : 0x15,
    CALL_FUNCTION      : 0x16,
    CALL_METHOD        : 0x17,
    MAKE_FUNCTION      : 0x18,
    STORE_FAST         : 0x19,
    STORE_NAME         : 0x1a,
    STORE_GLOBAL       : 0x1b,
    SET_ATTRIBUTE      : 0x1c,
    LOG_NOT            : 0x1d,
    BIT_NOT            : 0x1e,
    POS                : 0x1f,
    NEG                : 0x20,
    BIN_MUL            : 0x21,
    BIN_DIV            : 0x22,
    BIN_MOD            : 0x23,
    BIN_ADD            : 0x24,
    BIN_SUB            : 0x25,
    BIN_SHL            : 0x26,
    BIN_SHR            : 0x27,
    BIN_LT             : 0x28,
    BIN_LE             : 0x29,
    BIN_GT             : 0x2a,
    BIN_GE             : 0x2b,
    BIN_EQ             : 0x2c,
    BIN_NE             : 0x2d,
    BIN_AND            : 0x2e,
    BIN_OR             : 0x2f,
    BIN_XOR            : 0x30,
    POP_TOP            : 0x31,
    DUP_TOP            : 0x32,
    POP_JUMP_IF_FALSE  : 0x33,
    JUMP               : 0x34,
    RETURN             : 0x35
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

