const { throwError } = require('./error');
const { Tokenizer, TokenType, Keywords } = require('./tokenizer');


const Ast = Object.freeze({
    ID      : "ID",
    NUMBER  : "NUMBER",
    STRING  : "STRING",
    BOOL    : "BOOL",
    NULL    : "NULL",
    ACCESS  : "ACCESS",
    CALL    : "CALL",
    INDEX   : "INDEX",
    BIN_MUL : "BIN_MUL",
    BIN_DIV : "BIN_DIV",
    BIN_MOD : "BIN_MOD",
    BIN_ADD : "BIN_ADD",
    BIN_SUB : "BIN_SUB",
    BIN_SHL : "BIN_SHL",
    BIN_SHR : "BIN_SHR",
    BIN_LT  : "BIN_LT",
    BIN_GT  : "BIN_GT",
    BIN_LTE : "BIN_LTE",
    BIN_GTE : "BIN_GTE",
    BIN_EQ  : "BIN_EQ",
    BIN_NEQ : "BIN_NEQ",
    BIN_AND : "BIN_AND",
    BIN_OR  : "BIN_OR",
    BIN_XOR : "BIN_XOR",
    BIN_LAND: "BIN_LAND",
    BIN_LOR : "BIN_LOR",
    EXPR_STMNT: "EXPR_STMNT",
    EMPTY   : "EMPTY",
    VAR     : "VAR",
    CONST   : "CONST",
    LOCAL   : "LOCAL",
    IF      : "IF",
    FN      : "FN",
    RETURN_STMNT: "RETURN_STMNT",
    PROGRAM: "PROGRAM",
});

function mergePos(pos1, pos2) {
    return ({
        sline: pos1.sline,
        scolm: pos1.scolm,
        eline: pos2.eline,
        ecolm: pos2.ecolm
    })
}

class Parser {
    constructor(envName, data) {
        this.tokenizer = new Tokenizer(envName, data);
        this.look = this.prev = null;
    }

    check(token) {
        if (token.constructor.name == "String" && this.look.type == TokenType.SYMBOL || this.look.type == TokenType.KEYWORD) {
            return this.look.value == token;
        } else if (token.constructor.name == "String") {
            return token == this.look.type || token == this.look.value;
        }
       return false;
    }

    consume(token) {
        if (this.check(token)) {
            this.prev = this.look;
            this.look = this.tokenizer.getNext();
            return;
        }
        throwError(this.tokenizer.envName, this.tokenizer.data, `Expected ${token} but found ${this.look.value}`, this.look.position);
    }

    terminal() {
        if (this.check(TokenType.ID)) {
            const value = ({
                type: Ast.ID,
                value: this.look.value,
                position: this.look.position
            })
            this.consume(TokenType.ID);
            return value;
        }
        else if (this.check(TokenType.NUMBER)) {
            const value = ({
                type: Ast.NUMBER,
                value: this.look.value,
                position: this.look.position
            })
            this.consume(TokenType.NUMBER);
            return value;
        }
        else if (this.check(TokenType.STRING)) {
            const value = ({
                type: Ast.STRING,
                value: this.look.value,
                position: this.look.position
            })
            this.consume(TokenType.STRING);
            return value;
        }
        else if (this.check(TokenType.KEYWORD)) {
            if (this.check("true") || this.check("false")) {
                const value = ({
                    type: Ast.BOOL,
                    value: this.look.value,
                    position: this.look.position
                })
                this.consume(this.look.value);
                return value;
            }
            else if (this.check("null")) {
                const value = ({
                    type: Ast.NULL,
                    value: this.look.value,
                    position: this.look.position
                })
                this.consume(this.look.value);
                return value;
            }
        }
        return null;
    }

    memberOrCall() {
        let node = this.terminal();
        if (!node) {
            return node;
        }

        while (this.check(".") || this.check("(") || this.check("[")) {
            if (this.check(".")) {
                this.consume(".");
                const member = this.terminal();
                if (!member) {
                    throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
                }
                node = ({
                    type: Ast.ACCESS,
                    object: node,
                    member: member,
                    position: mergePos(node.position, this.prev.position)
                });
            } else if (this.check("(")) {
                this.consume("(");
                const args = [];
                let arg = this.primary();
                if (arg) {
                    args.push(arg);
                    while (this.check(",")) {
                        this.consume(",");
                        arg = this.primary();
                        if (!arg) {
                            throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
                        }
                        args.push(arg);
                    }
                }
                this.consume(")");
                node = ({
                    type: Ast.CALL,
                    object: node,
                    args: args,
                    position: mergePos(node.position, this.prev.position)
                });
            }
            else if (this.check("[")) {
                this.consume("[");
                const index = this.primary();
                if (!index) {
                    throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
                }
                this.consume("]");
                node = ({
                    type: Ast.INDEX,
                    object: node,
                    index: index,
                    position: mergePos(node.position, this.prev.position)
                });
            }
        }

        return node;
    }

    mul() {
        let node = this.memberOrCall();
        if (!node) {
            return node;
        }
        while (this.check("*") || this.check("/") || this.check("%")) {
            const op = this.look.value;
            this.consume(this.look.value);
            const right = this.memberOrCall();
            if (!right) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
            }
            node = ({
                type: (function() {
                    if (op == "*") {
                        return Ast.BIN_MUL;
                    }
                    else if (op == "/") {
                        return Ast.BIN_DIV;
                    }
                    else if (op == "%") {
                        return Ast.BIN_MOD;
                    }
                })(),
                op: op,
                left: node,
                right: right,
                position: mergePos(node.position, right.position)
            });
        }
        return node;
    }

    add() {
        let node = this.mul();
        if (!node) {
            return node;
        }
        while (this.check("+") || this.check("-")) {
            const op = this.look.value;
            this.consume(this.look.value);
            const right = this.mul();
            if (!right) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected mul but found ${this.look.value}`, this.look.position);
            }
            node = ({
                type: (function() {
                    if (op == "+") {
                        return Ast.BIN_ADD;
                    }
                    else if (op == "-") {
                        return Ast.BIN_SUB;
                    }
                })(),
                op: op,
                left: node,
                right: right,
                position: mergePos(node.position, right.position)
            });
        }
        return node;
    }

    shift() {
        let node = this.add();
        if (!node) {
            return node;
        }
        while (this.check("<<") || this.check(">>")) {
            const op = this.look.value;
            this.consume(this.look.value);
            const right = this.add();
            if (!right) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected add but found ${this.look.value}`, this.look.position);
            }
            node = ({
                type: (function() {
                    if (op == "<<") {
                        return Ast.BIN_SHL;
                    }
                    else if (op == ">>") {
                        return Ast.BIN_SHR;
                    }
                })(),
                op: op,
                left: node,
                right: right,
                position: mergePos(node.position, right.position)
            });
        }
        return node;
    }

    rel() {
        let node = this.shift();
        if (!node) {
            return node;
        }
        while (this.check("<") || this.check(">") || this.check("<=") || this.check(">=")) {
            const op = this.look.value;
            this.consume(this.look.value);
            const right = this.shift();
            if (!right) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected shift but found ${this.look.value}`, this.look.position);
            }
            node = ({
                type: (function() {
                    if (op == "<") {
                        return Ast.BIN_LT;
                    }
                    else if (op == ">") {
                        return Ast.BIN_GT;
                    }
                    else if (op == "<=") {
                        return Ast.BIN_LTE;
                    }
                    else if (op == ">=") {
                        return Ast.BIN_GTE;
                    }
                })(),
                op: op,
                left: node,
                right: right,
                position: mergePos(node.position, right.position)
            });
        }
        return node;
    }

    eq() {
        let node = this.rel();
        if (!node) {
            return node;
        }
        while (this.check("==") || this.check("!=")) {
            const op = this.look.value;
            this.consume(this.look.value);
            const right = this.rel();
            if (!right) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected rel but found ${this.look.value}`, this.look.position);
            }
            node = ({
                type: (function() {
                    if (op == "==") {
                        return Ast.BIN_EQ;
                    }
                    else if (op == "!=") {
                        return Ast.BIN_NEQ;
                    }
                })(),
                op: op,
                left: node,
                right: right,
                position: mergePos(node.position, right.position)
            });
        }
        return node;
    }

    bit() {
        let node = this.eq();
        if (!node) {
            return node;
        }
        while (this.check("&") || this.check("|") || this.check("^")) {
            const op = this.look.value;
            this.consume(this.look.value);
            const right = this.eq();
            if (!right) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected eq but found ${this.look.value}`, this.look.position);
            }
            node = ({
                type: (function() {
                    if (op == "&") {
                        return Ast.BIN_AND;
                    }
                    else if (op == "|") {
                        return Ast.BIN_OR;
                    }
                    else if (op == "^") {
                        return Ast.BIN_XOR;
                    }
                })(),
                op: op,
                left: node,
                right: right,
                position: mergePos(node.position, right.position)
            });
        }
        return node;
    }

    logic() {
        let node = this.bit();
        if (!node) {
            return node;
        }
        while (this.check("&&") || this.check("||")) {
            const op = this.look.value;
            this.consume(this.look.value);
            const right = this.bit();
            if (!right) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected bit but found ${this.look.value}`, this.look.position);
            }
            node = ({
                type: (function() {
                    if (op == "&&") {
                        return Ast.BIN_LAND;
                    }
                    else if (op == "||") {
                        return Ast.BIN_LOR;
                    }
                })(),
                op: op,
                left: node,
                right: right,
                position: mergePos(node.position, right.position)
            });
        }
        return node;
    }

    primary() {
        return this.logic();
    }

    mandatory() {
        const node = this.primary();
        if (node) {
            return node;
        }
        throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
    }

    statement() {
        if (this.check("var")) {
            return this.varStmnt();
        }
        else if (this.check("const")) {
            return this.constStmnt();
        }
        else if (this.check("local")) {
            return this.localStmnt();
        }
        else if (this.check("if")) {
            return this.ifStmnt();
        }
        else if (this.check("fn")) {
            return this.fn();
        }
        else if (this.check("return")) {
            return this.returnStmnt();
        }
        return this.exprStmnt();
    }

    returnStmnt() {
        let start = this.look.position, ended = {};
        this.consume("return");
        const node = this.primary();
        this.consume(";");
        ended = this.prev.position;
        return ({
            type: Ast.RETURN_STMNT,
            expr: node,
            position: mergePos(start, ended)
        });
    }

    exprStmnt() {
        let start = this.look.position, ended = {};
        const node = this.primary();
        if (node) {
            this.consume(";");
            ended = this.prev.position;
            return ({
                type: Ast.EXPR_STMNT,
                expr: node,
                position: mergePos(start, ended)
            });
        }
        if (this.check(";")) {
            while (this.check(";")) {
                this.consume(";");
            }
            ended = this.prev.position;
            return ({
                type: Ast.EMPTY,
                position: mergePos(start, ended)
            });
        }
        return node;
    }

    varStmnt() {
        let start = this.look.position, ended = {};
        this.consume("var");

        const declarations = [];

        let name = this.terminal();
        if (!name) {
            throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
        }

        if (this.check("=")) {
            this.consume("=");
            const value = this.primary();
            if (!value) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
            }
            declarations.push({
                nameNode: name,
                valueNode: value
            });
        }

        while (this.check(",")) {
            this.consume(",");
            name = this.terminal();
            if (!name) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
            }
            if (this.check("=")) {
                this.consume("=");
                const value = this.primary();
                if (!value) {
                    throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
                }
                declarations.push({
                    nameNode: name,
                    valueNode: value
                });
            }
        }
        this.consume(";");
        return ({
            type: Ast.VAR,
            declarations: declarations,
            position: mergePos(start, ended)
        });
    }

    constStmnt() {
        let start = this.look.position, ended = {};
        this.consume("const");

        const declarations = [];

        let name = this.terminal();
        if (!name) {
            throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
        }

        if (this.check("=")) {
            this.consume("=");
            const value = this.primary();
            if (!value) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
            }
            declarations.push({
                nameNode: name,
                valueNode: value
            });
        }

        while (this.check(",")) {
            this.consume(",");
            name = this.terminal();
            if (!name) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
            }
            if (this.check("=")) {
                this.consume("=");
                const value = this.primary();
                if (!value) {
                    throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
                }
                declarations.push({
                    nameNode: name,
                    valueNode: value
                });
            }
        }
        this.consume(";");
        return ({
            type: Ast.CONST,
            declarations: declarations,
            position: mergePos(start, ended)
        });
    }

    localStmnt() {
        let start = this.look.position, ended = {};
        this.consume("local");

        const declarations = [];

        let name = this.terminal();
        if (!name) {
            throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
        }

        if (this.check("=")) {
            this.consume("=");
            const value = this.primary();
            if (!value) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
            }
            declarations.push({
                nameNode: name,
                valueNode: value
            });
        }

        while (this.check(",")) {
            this.consume(",");
            name = this.terminal();
            if (!name) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
            }
            if (this.check("=")) {
                this.consume("=");
                const value = this.primary();
                if (!value) {
                    throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
                }
                declarations.push({
                    nameNode: name,
                    valueNode: value
                });
            }
        }
        this.consume(";");
        return ({
            type: Ast.LOCAL,
            declarations: declarations,
            position: mergePos(start, ended)
        });
    }

    ifStmnt() {
        let start = this.look.position, ended = {};
        this.consume("if");
        this.consume("(");
        const condition = this.primary();
        if (!condition) {
            throwError(this.tokenizer.envName, this.tokenizer.data, `Expected primary but found ${this.look.value}`, this.look.position);
        }
        this.consume(")");
        const then = this.statement();
        if (!then) {
            throwError(this.tokenizer.envName, this.tokenizer.data, `Expected statement but found ${this.look.value}`, this.look.position);
        }
        let elseN = null;
        if (this.check("else")) {
            this.consume("else");
            elseN = this.statement();
            if (!elseN) {
                throwError(this.tokenizer.envName, this.tokenizer.data, `Expected statement but found ${this.look.value}`, this.look.position);
            }
        }
        ended = this.prev.position;
        return ({
            type: Ast.IF,
            condition: condition,
            then: then,
            else: elseN,
            position: mergePos(start, ended)
        });
    }

    fn() {
        let start = this.look.position, ended = {};
        this.consume("fn");
        const name = this.terminal();
        if (!name)
            throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
        this.consume("(");
        const parameters = [];
        let pN = this.terminal();
        if (pN) {
            parameters.push(pN);
            while (this.check(",")) {
                this.consume(",");
                pN = this.terminal();
                if (!pN) {
                    throwError(this.tokenizer.envName, this.tokenizer.data, `Expected terminal but found ${this.look.value}`, this.look.position);
                }
                parameters.push(pN);
            }
        }
        this.consume(")");
        this.consume("{");
        const body = [];
        let bodyN = this.statement();
        while (bodyN) {
            body.push(bodyN);
            bodyN = this.statement();
        }
        this.consume("}");
        ended = this.prev.position;
        return ({
            type: Ast.FN,
            name: name,
            parameters: parameters,
            body: body,
            position: mergePos(start, ended)
        })
    }

    program() {
        let start = this.look.position, ended = {};
        const children = []
        let childN = this.statement();
        while (childN) {
            children.push(childN);
            childN = this.statement();
        }
        this.consume(TokenType.EOF);
        ended = this.prev.position;
        return ({
            type: Ast.PROGRAM,
            children: children,
            position: mergePos(start, ended)
        });
    }

    parse() {
        this.look = this.prev = this.tokenizer.getNext();
        return this.program();
    }
}


module.exports = {
    Ast,
    Parser
}