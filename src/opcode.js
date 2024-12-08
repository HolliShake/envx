

const OPCODE = Object.freeze({
    LOAD_NUMBER        : 0x0f,
    LOAD_STRING        : 0x10,
    LOAD_BOOL          : 0x11,
    LOAD_NULL          : 0x12,
    LOAD_NAME          : 0x13,
    MAKE_ARRAY         : 0x14,
    MAKE_OBJECT        : 0x15,
    GET_ATTRIBUTE      : 0x16,
    CALL_FUNCTION      : 0x17,
    CALL_METHOD        : 0x18,
    GET_INDEX          : 0x19,
    MAKE_FUNCTION      : 0x1a,
    STORE_FAST         : 0x1b,
    STORE_NAME         : 0x1c,
    STORE_GLOBAL       : 0x1d,
    SET_ATTRIBUTE      : 0x1e,
    SET_INDEX          : 0x1f,
    LOG_NOT            : 0x20,
    BIT_NOT            : 0x21,
    POS                : 0x22,
    NEG                : 0x23,
    PREFIX_INC         : 0x24,
    PREFIX_DEC         : 0x25,
    POSTFIX_INC        : 0x26,
    POSTFIX_DEC        : 0x27,
    BIN_MUL            : 0x28,
    BIN_DIV            : 0x29,
    BIN_MOD            : 0x2a,
    BIN_ADD            : 0x2b,
    BIN_SUB            : 0x2c,
    BIN_SHL            : 0x2d,
    BIN_SHR            : 0x2e,
    BIN_LT             : 0x2f,
    BIN_LE             : 0x30,
    BIN_GT             : 0x31,
    BIN_GE             : 0x32,
    BIN_EQ             : 0x33,
    BIN_NE             : 0x34,
    BIN_AND            : 0x35,
    BIN_OR             : 0x36,
    BIN_XOR            : 0x37,
    POP_TOP            : 0x38,
    DUP_TOP            : 0x39,
    DUP_2              : 0x3a,
    POP_JUMP_IF_FALSE  : 0x3b,
    JUMP_IF_TRUE_OR_POP: 0x3c,
    JUMP_IF_FALSE_OR_POP: 0x3d,
    JUMP               : 0x3e,
    ROT_2              : 0x3f,
    ROT_3              : 0x40,
    ROT_4              : 0x41,
    RETURN             : 0x42
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

