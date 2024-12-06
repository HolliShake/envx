

const OPCODE = Object.freeze({
    LOAD_NUMBER        : 0x0f,
    LOAD_STRING        : 0x10,
    LOAD_BOOL          : 0x11,
    LOAD_NULL          : 0x12,
    LOAD_NAME          : 0x13,
    CALL_FUNCTION      : 0x14,
    MAKE_FUNCTION      : 0x15,
    STORE_FAST         : 0x16,
    STORE_NAME         : 0x17,
    STORE_GLOBAL       : 0x18,
    LOG_NOT            : 0x19,
    BIT_NOT            : 0x1a,
    POS                : 0x1b,
    NEG                : 0x1c,
    BIN_MUL            : 0x1d,
    BIN_DIV            : 0x1e,
    BIN_MOD            : 0x1f,
    BIN_ADD            : 0x20,
    BIN_SUB            : 0x21,
    BIN_SHL            : 0x22,
    BIN_SHR            : 0x23,
    BIN_LT             : 0x24,
    BIN_LE             : 0x25,
    BIN_GT             : 0x26,
    BIN_GE             : 0x27,
    BIN_EQ             : 0x28,
    BIN_NE             : 0x29,
    BIN_AND            : 0x2a,
    BIN_OR             : 0x2b,
    BIN_XOR            : 0x2c,
    POP_TOP            : 0x2d,
    DUP_TOP            : 0x2e,
    POP_JUMP_IF_FALSE  : 0x2f,
    JUMP               : 0x30,
    RETURN             : 0x31
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

