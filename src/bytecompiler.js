

const { throwError } = require('./error.js');
const { OPCODE } = require('./opcode.js');
const { Ast } = require('./parser.js');
const { runBytecode } = require('./runtime.js');

const preserve = (numberOfBytes) => {
    return Array.from(Array(numberOfBytes).keys()).map(() => 0);
}

const setBytes = (bytecode, begin, numberOfBytes, value) => {
    const bytes = slice4Number(value);
    for (let i = 0; i < numberOfBytes; i++) {
        bytecode[begin + i] = bytes[i];
    }
}

const slice4Number = (num) => [
    num & 0xff,
    (num >>  8) & 0xff,
    (num >> 16) & 0xff,
    (num >> 24) & 0xff
]

const sliceNumber = (num) => [
    num & 0xff,
    (num >>  8) & 0xff,
    (num >> 16) & 0xff,
    (num >> 24) & 0xff,
    (num >> 32) & 0xff,
    (num >> 40) & 0xff,
    (num >> 48) & 0xff,
    (num >> 56) & 0xff
]

const deSliceNumber = (num) => {
    let result = 0;
    for (let i = 0; i < num.length; i++) {
        result |= num[i] << (i * 8);
    }
    return result;
}

const sliceWord = (word) => [
    ...(word.split("").map((c) => c.charCodeAt(0))),
    0 // add zero the end of word as nullchar
]

class Visitor {
    constructor() {

    }

    visit(node) {
        switch (node.type) {
            case Ast.ID:
                this.astId(node);
                break;
            case Ast.NUMBER:
                this.astNumber(node);
                break;
            case Ast.STRING:
                this.astString(node);
                break;
            case Ast.ACCESS:
                this.astAccess(node);
                break;
            case Ast.CALL:
                this.astCalll(node);
                break;
            case Ast.LNOT:
                this.astLogNot(node);
                break;
            case Ast.BNOT:
                this.astBitNot(node);
                break;
            case Ast.POS:
                this.astPos(node);
                break;
            case Ast.NEG:
                this.astNeg(node);
                break;
            case Ast.BIN_MUL:
                this.astBinMul(node);
                break;
            case Ast.BIN_DIV:
                this.astBinDiv(node);
                break;
            case Ast.BIN_MOD:
                this.astBinMod(node);
                break;
            case Ast.BIN_ADD:
                this.astBinAdd(node);
                break;
            case Ast.BIN_SUB:
                this.astBinSub(node);
                break
            case Ast.BIN_SHL:
                this.astBinShl(node);
                break;
            case Ast.BIN_SHR:
                this.astBinShr(node);
                break;
            case Ast.BIN_LT:
                this.astBinLt(node);
                break;
            case Ast.BIN_LTE:
                this.astBinLe(node);
                break;
            case Ast.BIN_GT:
                this.astBinGt(node);
                break;
            case Ast.BIN_GTE:
                this.astBinGe(node);
                break;
            case Ast.BIN_EQ:
                this.astBinEq(node);
                break;
            case Ast.BIN_NEQ:
                this.astBinNe(node);
                break;
            case Ast.BIN_ASSIGN:
                this.astAssign(node);
                break;
            case Ast.BIN_MUL_ASS:
                this.astMulAssign(node);
                break;
            case Ast.BIN_DIV_ASS:
                this.astDivAssign(node);
                break;
            case Ast.BIN_MOD_ASS:
                this.astModAssign(node);
                break;
            case Ast.BIN_ADD_ASS:
                this.astAddAssign(node);
                break;
            case Ast.BIN_SUB_ASS:
                this.astSubAssign(node);
                break;
            case Ast.BIN_SHL_ASS:
                this.astShlAssign(node);
                break;
            case Ast.BIN_SHR_ASS:
                this.astShrAssign(node);
                break;
            case Ast.BIN_AND_ASS:
                this.astAndAssign(node);
                break;
            case Ast.BIN_OR_ASS:
                this.astOrAssign(node);
                break;
            case Ast.BIN_XOR_ASS:
                this.astXorAssign(node);
                break;
            case Ast.EXPR_STMNT:
                this.astExprStmt(node);
                break;
            case Ast.VAR:
                this.astVar(node);
                break;
            case Ast.CONST:
                this.astConst(node);
                break;
            case Ast.LOCAL:
                this.astLocal(node);
                break;
            case Ast.IF:
                this.astIf(node);
                break;
            case Ast.FN:
                this.astfn(node);
                break;
            case Ast.DO_WHILE:
                this.astDoWhile(node);
                break;
            case Ast.WHILE:
                this.astWhile(node);
                break;
            case Ast.BLOCK:
                this.astBlock(node);
                break;
            case Ast.CONTINUE:
                this.astContinue(node);
                break;
            case Ast.BREAK:
                this.astBreak(node);
                break;
            case Ast.RETURN_STMNT:
                this.astReturn(node);
                break;
            default:
                throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Unknown node type ${node.type}`, node.position);
        }
    }
}

const SCOPE = Object.freeze({
    GLOBAL: 0,
    LOCAL : 1,
    SINGLE: 2,
    FN    : 3,
    LOOP  : 4,
})

const randomName = () => {
    const charPool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";    
    const maxChars = 8;
    let result = "";
    for (let i = 0; i < maxChars; i++) {
        result += charPool.charAt(Math.floor(Math.random() * charPool.length));
    }
    return result;
}

const scopeInside = (scope, scopeId) => {
    let current = scope;
    while (current) {
        if (current["$type"] == scopeId) {
            return true;
        }
        current = current["$"];
    }
}

const symbolExits = (scope, name) => {
    return !!scope[name];
}

const symbolExitsGlobally = (scope, name) => {
    let current = scope;
    while (current) {
        if (current[name]) {
            return true;
        }
        current = current["$"];
    }
    return false;
}

const storeSymbol = (scope, name, data) => {
    scope[name] = data;
}

const getSymbol = (scope, name) => {
    let current = scope;
    while (current) {
        if (current[name]) {
            return current[name];
        }
        current = current["$"];
    }
    return null;
}

class ByteComiler extends Visitor {
    constructor(parser) {
        super();
        this.parser = parser;
        this.bytecode = [];
        this.scope = null;
    }

    astId(node) {
        const symbol = getSymbol(this.scope, node.value);

        const toWrite =
            ((symbol && symbol.isGloal) || !symbol)
                ? node.value // use actual name if global
                : symbol.tmpName;
        this.bytecode.push(...[OPCODE.LOAD_NAME, ...sliceWord(toWrite)]);
    }

    astNumber(node) {
        this.bytecode.push(...[
            OPCODE.LOAD_NUMBER,
           ...sliceNumber(Number(node.value))
        ]);
    }

    astString(node) {
        this.bytecode.push(...[
            OPCODE.LOAD_STRING,
            ...sliceWord(node.value)
        ]);
    }

    astAccess(node) { 
        this.visit(node.object);

        if (node.member.type != Ast.ID) {
            throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Expected identifier but got ${node.member.type}`, node.member.position);
        }

        this.bytecode.push(...[
            OPCODE.GET_ATTRIBUTE, 
            ...sliceWord(node.member.value)
        ]);
    }

    astCalll(node) {
        const args = node.args.reverse();
        for (let i = 0; i < args.length; i++) {
            this.visit(args[i]);
        }

        const isMethodCall = node.object.type == Ast.ACCESS;
        if (isMethodCall) {
            this.visit(node.object.object);
            this.bytecode.push(OPCODE.DUP_TOP);

            if (node.object.member.type != Ast.ID) {
                throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Expected identifier but got ${node.object.member.type}`, node.member.position);
            }

            this.bytecode.push(...[
                OPCODE.GET_ATTRIBUTE, 
                ...sliceWord(node.object.member.value)
            ]);
        }
        else {
            this.visit(node.object);
        }


        this.bytecode.push(...[
            isMethodCall ? OPCODE.CALL_METHOD : OPCODE.CALL_FUNCTION,
            ...slice4Number(args.length)
        ]);
    }

    astLogNot(node) {
        this.visit(node.right);
        this.bytecode.push(OPCODE.LOG_NOT);
    }

    astBitNot(node) {
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIT_NOT);
    }

    astPos(node) {
        this.visit(node.right);
        this.bytecode.push(OPCODE.POS);
    }

    astNeg(node) {
        this.visit(node.right);
        this.bytecode.push(OPCODE.NEG);
    }

    astBinMul(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_MUL);
    }

    astBinDiv(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_DIV);
    }

    astBinMod(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_MOD);
    }

    astBinAdd(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_ADD);
    }

    astBinSub(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_SUB);
    }

    astBinShl(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_SHL);
    }

    astBinShr(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_SHR);
    }

    astBinLt(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_LT);
    }

    astBinLe(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_LE);
    }

    astBinGt(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_GT);
    }

    astBinGe(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_GE);
    }

    astBinEq(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_EQ);
    }

    astBinNe(node) {
        this.visit(node.left);
        this.visit(node.right);
        this.bytecode.push(OPCODE.BIN_NE);
    }

    astAssign0(node) {
        this.visit(node);
    }

    astAssign1(node) {
        this.bytecode.push(OPCODE.DUP_TOP);
        switch (node.type) {
            case Ast.ID: {
                const symbol = getSymbol(this.scope, node.value);
                if (!symbol) {
                    this.bytecode.push(...[
                        OPCODE.STORE_NAME, 
                        ...sliceWord(node.value)
                    ]);
                    break;
                }

                if (symbol.isConst) {
                    throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Cannot assign to constant ${node.value}`, node.position);
                }

                const toWrite =
                    ((symbol && symbol.isGloal) || !symbol)
                        ? node.value // use actual name if global
                        : symbol.tmpName;
                
                this.bytecode.push(...[
                    (symbol.isGloal) ? OPCODE.STORE_GLOBAL : OPCODE.STORE_NAME,
                    ...sliceWord(toWrite)
                ]);
                break;
            }
            default:
                throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Expected identifier but got ${node.type}`, node.position);
        }
    }

    astAssign(node) {
        this.astAssign0(node.right);
        this.astAssign1(node.left);
    }

    astMulAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_MUL);
        this.astAssign1(node.left);
    }

    astDivAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_DIV);
        this.astAssign1(node.left);
    }

    astModAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_MOD);
        this.astAssign1(node.left);
    }

    astAddAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_ADD);
        this.astAssign1(node.left);
    }

    astSubAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_SUB);
        this.astAssign1(node.left);
    }

    astShlAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_SHL);
        this.astAssign1(node.left);
    }

    astShrAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_SHR);
        this.astAssign1(node.left);
    }

    astAndAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_AND);
        this.astAssign1(node.left);
    }

    astOrAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_OR);
        this.astAssign1(node.left);
    }

    astXorAssign(node) {
        this.astAssign0(node.left);
        this.astAssign0(node.right);
        this.bytecode.push(OPCODE.BIN_XOR);
        this.astAssign1(node.left);
    }

    astExprStmt(node) {
        const expr = node.expr;
        this.visit(expr);
        this.bytecode.push(OPCODE.POP_TOP);
    }

    astVar(node) {
        if (this.scope.$type != SCOPE.GLOBAL) {
            throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Variable declaration outside of global scope`, node.position);
        }
        const declairaions = node.declarations;

        for (let i = 0; i < declairaions.length; i++) {
            const pair = declairaions[i];

            // Compile value first
            this.visit(pair.valueNode);

            if (pair.nameNode.type != Ast.ID) {
                throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Expected identifier but got ${pair.nameNode.type}`, pair.nameNode.position);
            }

            // Check if symbol exits
            symbolExits(this.scope, pair.nameNode.value)
                && throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Variable ${pair.nameNode.value} already exits`, node.position);
        
            const name = pair.nameNode.value;
            const tmpName = randomName();
            
            storeSymbol(this.scope, name, {
                tmpName: tmpName,
                actualName: name,
                isConst: false,
                isGloal: true
            });

            this.bytecode.push(...[
                OPCODE.STORE_NAME, 
                ...sliceWord(name) // use actual name if global
            ]);
        }
    }

    astConst(node) {
        const declairaions = node.declarations;

        for (let i = 0; i < declairaions.length; i++) {
            const pair = declairaions[i];

            // Compile value first
            this.visit(pair.valueNode);

            if (pair.nameNode.type != Ast.ID) {
                throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Expected identifier but got ${pair.nameNode.type}`, pair.nameNode.position);
            }

            // Check if symbol exits
            symbolExits(this.scope, pair.nameNode.value)
                && throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Variable ${pair.nameNode.value} already exits`, node.position);
        
            const name = pair.nameNode.value;
            const tmpName = randomName();
            
            storeSymbol(this.scope, name, {
                tmpName: tmpName,
                actualName: name,
                isConst: true,
                isGloal: this.scope.$type == SCOPE.GLOBAL
            });

            const toWrite =
                (this.scope.$type == SCOPE.GLOBAL)
                    ? name // use actual name if global
                    : tmpName;

            this.bytecode.push(...[
                OPCODE.STORE_NAME, 
                ...sliceWord(toWrite) // use actual name if global
            ]);
        }
    }

    astLocal(node) {
        if (!
            (scopeInside(this.scope, SCOPE.LOCAL) ||
             scopeInside(this.scope, SCOPE.FN))
        ) {
            throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Local declaration outside local is prohibited`, node.position);
        }
        const declairaions = node.declarations;

        for (let i = 0; i < declairaions.length; i++) {
            const pair = declairaions[i];

            // Compile value first
            this.visit(pair.valueNode);

            if (pair.nameNode.type != Ast.ID) {
                throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Expected identifier but got ${pair.nameNode.type}`, pair.nameNode.position);
            }

            // Check if symbol exits
            symbolExits(this.scope, pair.nameNode.value)
                && throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Variable ${pair.nameNode.value} already exits`, node.position);
        
            const name = pair.nameNode.value;
            const tmpName = randomName();
            
            storeSymbol(this.scope, name, {
                tmpName: tmpName,
                actualName: name,
                isConst: true,
                isGloal: false
            });

            this.bytecode.push(...[
                OPCODE.STORE_NAME, 
                ...sliceWord(tmpName) // use actual name if global
            ]);
        }
    }

    astIf(node) {
        const base = this.bytecode.length;
        this.visit(node.condition);
        const elseOrNextBegin = this.bytecode.length;
        this.bytecode.push(...[
            OPCODE.POP_JUMP_IF_FALSE, 
            ...preserve(4)
        ]);
        /**** to else **/
        const beginJumpToElseIndex = (this.bytecode.length - 1) - 3;
        // >> then
        this.visit(node.then);

        const endIf = this.bytecode.length;
        this.bytecode.push(...[
            OPCODE.JUMP, 
            ...preserve(4)
        ]);
        /**** to endif **/
        const endJumpIndex = (this.bytecode.length - 1) - 3;

        // >> else?
        const elseCount = this.bytecode.length - elseOrNextBegin;
        setBytes(this.bytecode, beginJumpToElseIndex, 4, elseCount);
        if (node.else) {
            this.visit(node.else);
        }

        // endif
        const endIfCount = this.bytecode.length - endIf;
        setBytes(this.bytecode, endJumpIndex, 4, endIfCount);
    }

    astfn(node) {
        if (this.scope.$type != SCOPE.GLOBAL) {
            throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Function declaration outside of global scope`, node.position);
        }

        if (node.name.type != Ast.ID) {
            throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Expected identifier but got ${node.name.type}`, node.position);
        }

        const old = this.scope;
        this.scope = ({
            "$": this.scope,
            "$type": SCOPE.FN
        })
    
        const name = node.name;
        this.bytecode.push(...[
            OPCODE.MAKE_FUNCTION,
            ...sliceWord(name.value), // function name nth bytes
            ...slice4Number(node.parameters.length), // 4bytes for function parameter count
            ...preserve(4) // 4bytes for function body
        ]);

        const beginBodyCountIndex = (this.bytecode.length - 1) - 3;

        const begin = this.bytecode.length;

        const parameters = node.parameters;
        for (let i = 0; i < parameters.length; i++) {
            if (parameters[i].type != Ast.ID) {
                throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Expected identifier but got ${parameters[i].type}`, parameters[i].position);
            }

            symbolExits(this.scope, parameters[i].value) 
                && throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Parameter ${parameters[i].value} already exits`, parameters[i].position);

            const paramName = randomName();

            storeSymbol(this.scope, parameters[i].value, {
                tmpName: paramName,
                actualName: parameters[i].value,
                isConst: false,
                isGloal: false
            });

            this.bytecode.push(...[
                OPCODE.STORE_FAST,
                ...sliceWord(paramName) // parameter name nth bytes
            ]);
        }

        const body = node.body;
        for (let i = 0; i < body.length; i++) {
            this.visit(body[i]);
        }

        this.bytecode.push(...[
            OPCODE.LOAD_NULL,
            OPCODE.RETURN
        ]);
        const bodyCount = this.bytecode.length - begin;
        setBytes(this.bytecode, beginBodyCountIndex, 4, bodyCount);

        this.scope = old;

        symbolExitsGlobally(this.scope, name.value)
            && throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Function ${name.value} already exits`, node.position);

        storeSymbol(this.scope, name.value, {
            tmpName: name.value,
            actualName: name.value,
            isConst: true,
            isGloal: true
        });

        // Store
        this.bytecode.push(...[
            OPCODE.STORE_NAME,
            ...sliceWord(name.value) // use actual name if global
        ]);
    }

    astDoWhile(node) {
        const begin = this.bytecode.length;
        const old = this.scope;
        this.scope = ({
            "$": this.scope,
            "$type": SCOPE.LOOP,
            "$begin": begin,
            "$breaks": [ /* { breakbegin: ?, toEndWhileIndex: ? } */]
        })
        this.visit(node.body);

        this.visit(node.condition);
        const endWhileBegin = this.bytecode.length;
        this.bytecode.push(...[
            OPCODE.POP_JUMP_IF_FALSE,
            ...preserve(4)
        ]);
        const toEndWhileIndex = (this.bytecode.length - 1) - 3;

        // Jump to condition
        this.bytecode.push(...[
            OPCODE.JUMP,
            ...slice4Number(begin - this.bytecode.length)
        ]);

        const endWhileJump = this.bytecode.length - endWhileBegin;
        setBytes(this.bytecode, toEndWhileIndex, 4, endWhileJump);

        // Fix breaks
        const breaks = this.scope["$breaks"];
        for (let i = 0; i < breaks.length; i++) {
            const breakbegin = breaks[i].breakbegin;
            const toEndWhileIndex = breaks[i].toEndWhileIndex;
            const jump = this.bytecode.length - breakbegin;
            setBytes(this.bytecode, toEndWhileIndex, 4, jump);
        }
        this.scope = old;
    }

    astWhile(node) {
        const begin = this.bytecode.length;
        const old = this.scope;
        this.scope = ({
            "$": this.scope,
            "$type": SCOPE.LOOP,
            "$begin": begin,
            "$breaks": [ /* { breakbegin: ?, toEndWhileIndex: ? } */]
        })
        this.visit(node.condition);
        const endWhileBegin = this.bytecode.length;
        this.bytecode.push(...[
            OPCODE.POP_JUMP_IF_FALSE,
            ...preserve(4)
        ]);
        const toEndWhileIndex = (this.bytecode.length - 1) - 3;

        this.visit(node.body);
        // Jump to condition
        this.bytecode.push(...[
            OPCODE.JUMP,
            ...slice4Number(begin - this.bytecode.length)
        ]);

        const endWhileJump = this.bytecode.length - endWhileBegin;
        setBytes(this.bytecode, toEndWhileIndex, 4, endWhileJump);
        
        // Fix breaks
        const breaks = this.scope["$breaks"];
        for (let i = 0; i < breaks.length; i++) {
            const breakbegin = breaks[i].breakbegin;
            const toEndWhileIndex = breaks[i].toEndWhileIndex;
            const jump = this.bytecode.length - breakbegin;
            setBytes(this.bytecode, toEndWhileIndex, 4, jump);
        }
        this.scope = old;
    }

    astBlock(node) {
        const old = this.scope;
        this.scope = ({
            "$": this.scope,
            "$type": SCOPE.LOCAL
        })
        const children = node.children;
        for (let i = 0; i < children.length; i++) {
            this.visit(children[i]);
        }
        this.scope = old;
    }

    astContinue(node) {
        if (!scopeInside(this.scope, SCOPE.LOOP)) {
            throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Continue statement outside of loop`, node.position);
        }
        let current = this.scope;
        while (current && current['$type'] != SCOPE.LOOP) {
            current = current["$"];
        }
        this.bytecode.push(...[
            OPCODE.JUMP,
            ...slice4Number(current["$begin"] - this.bytecode.length)
        ]);
    }

    astBreak(node) {
        if (!scopeInside(this.scope, SCOPE.LOOP)) {
            throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Break statement outside of loop`, node.position);
        }
        let current = this.scope;
        while (current && current['$type'] != SCOPE.LOOP) {
            current = current["$"];
        }

        const toEndBegin = this.bytecode.length;
        this.bytecode.push(...[
            OPCODE.JUMP,
            ...preserve(4)
        ]);

        const toEndIndex = (this.bytecode.length - 1) - 3;

        current["$breaks"].push({
            breakbegin: toEndBegin,
            toEndWhileIndex: toEndIndex
        });
    }

    astReturn(node) {
        if (!scopeInside(this.scope, SCOPE.FN)) {
            throwError(this.parser.tokenizer.envName, this.parser.tokenizer.data, `Return statement outside of function`, node.position);
        }
        if (node.expr) 
            this.visit(node.expr);
        else {
            this.bytecode.push(OPCODE.LOAD_NULL);
        }
        this.bytecode.push(OPCODE.RETURN);
    }

    compile() {
        const program  = this.parser.parse();
        const old = this.scope
        this.scope = ({
            "$": {},
            "$type": SCOPE.GLOBAL
        })
        const children = program.children; 
        for (let i = 0; i < children.length; i++) {
            this.visit(children[i]);
        }
        this.bytecode.push(...[
            OPCODE.LOAD_NULL,
            OPCODE.RETURN
        ]);
        this.scope = old;
        return this.bytecode;
    }
}

module.exports = {
    ByteComiler
}

