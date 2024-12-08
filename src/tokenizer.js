const { throwError } = require("./error.js");

const Keywords = Object.freeze([
    'if',
    'else',
    'do',
    'while',
    'for',
    'break',
    'continue',
    'return',
    'fn',
    'var',
    'local',
    'const',
    'true',
    'false',
    'null'
]);

const TokenType = Object.freeze({
    ID: 'id',
    KEYWORD: 'keyword',
    NUMBER: 'number',
    STRING: 'string',
    SYMBOL: 'symbol',
    EOF: 'eof'
});

class Tokenizer {
    constructor(envName, data) {
        this.envName = envName;
        this.data = data;
        this.size = data.length;
        this.look = data.charAt(0)
        this.indx = 0;
        this.line = 1;
        this.colm = 1;
    }

    forward() {
        if (this.look == '\n') {
            this.line++;
            this.colm = 1;
        } else {
            this.colm++;
        }
        this.look = this.data.charAt(++this.indx) ?? '\0';
    }

    isEof() {
        return this.indx >= this.size;
    }

    isIdentifierStart() {
        return this.look.match(/[a-zA-Z_]/);
    }

    isDigit() {
        return this.look.match(/[0-9]/);
    }

    isHexDigit() {
        return this.look.match(/[0-9a-fA-F]/);
    }

    isOctDigit() {
        return this.look.match(/[0-7]/);
    }

    isBinDigit() {
        return this.look.match(/[0-1]/);
    }

    isString() {
        return this.look == '"';
    }

    skipWhite() {
        while (!this.isEof() && this.look == '' || this.look == ' ' || this.look == '\t' || this.look == '\n' || this.look == '\r') {
            this.forward();
        }
    }

    nextId() {
        let token = '';
        const pos = {
            sline: this.line,
            eline: this.line,
            scolm: this.colm,
            ecolm: this.colm,
        };
        while (!this.isEof() && this.isIdentifierStart() || (token.length > 0 && this.isDigit())) {
            token += this.look;
            this.forward();
        }
        return ({
            type: (!Keywords.includes(token)) ? TokenType.ID : TokenType.KEYWORD,
            value: token,
            position: pos
        });
    }

    nextNumber() {
        let token = '';
        const pos = {
            sline: this.line,
            eline: this.line,
            scolm: this.colm,
            ecolm: this.colm,
        };
        while (!this.isEof() && this.isDigit()) {
            token += this.look;
            this.forward();
        }
        if (token == "0") {
            switch (this.look) {
                case 'x':
                case 'X':
                    token += this.look;
                    this.forward();
                    if (!this.isHexDigit(this.look))
                        throwError(this.envName, this.data, "Invalid hex digit", pos);
                    while (!this.isEof() && this.isHexDigit()) {
                        token += this.look;
                        this.forward();
                    }
                    break;
                case 'b':
                case 'B':
                    token += this.look;
                    this.forward();
                    if (!this.isBinDigit(this.look))
                        throwError(this.envName, this.data, "Invalid binary digit", pos);
                    while (!this.isEof() && this.isBinDigit()) {
                        token += this.look;
                        this.forward();
                    }
                    break;
                case 'o':
                case 'O':
                    token += this.look;
                    this.forward();
                    if (!isOctalDigit(this.look))
                        throwError(this.envName, this.data, "Invalid octal digit", pos);
                    
                    while (!this.isEof() && this.isOctDigit()) {
                        token += this.look;
                        this.forward();
                    }
            }

            if (token != "0") {
                return ({
                    type: TokenType.NUMBER,
                    value: Number(token).toString(),
                    position: pos
                });
            }
        }
        if (this.look == '.') {
            token += this.look;
            this.forward();
            if (!this.isDigit())
                throwError(this.envName, this.data, "Invalid number", pos);
            while (!this.isEof() && this.isDigit()) {
                token += this.look;
                this.forward();
            }
        }
        return ({
            type: TokenType.NUMBER,
            value: Number(token).toString(),
            position: pos
        });
    }

    nextString() {
        let token = '';
        const pos = {
            sline: this.line,
            eline: this.line,
            scolm: this.colm,
            ecolm: this.colm,
        };
        let op = this.isString(), cl = false;
        this.forward();
        cl = this.isString();

        while (!this.isEof() && !(op && cl)) {
            if (this.look == '\n') {
                throwError(this.envName, this.data, "Invalid string", pos);
            }
            if (this.look == '\\') {
                this.forward();
                switch (this.look) {
                    case 'b' : token += '\b'; break;
                    case 'n' : token += '\n'; break;
                    case 't' : token += '\t'; break;
                    case 'r' : token += '\r'; break;
                    case '0' : token += '\0'; break;
                    case '\'': token += '\''; break;
                    case '\"': token += '\"'; break;
                    default  : token += this.look; break;
                }
            } else {
                token += this.look;
            }
            this.forward();
            cl = this.isString();
        }
        if (!(op && cl))
            throwError(this.envName, this.data, "Invalid string", pos);
        this.forward();
        return ({
            type: TokenType.STRING,
            value: token,
            position: pos
        });
    }

    nextSymbol() {
        let token = '';
        const pos = {
            sline: this.line,
            eline: this.line,
            scolm: this.colm,
            ecolm: this.colm,
        };
        switch (this.look) {
            case '(':
            case ')':
            case '[':
            case ']':
            case '{':
            case '}':
            case '.':
            case '?':
            case ',':
            case ':':
            case ';': {
                token += this.look;
                this.forward();
                break;
            }
            case '*': {
                token += this.look;
                this.forward();
                if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '/': {
                token += this.look;
                this.forward();
                if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '%': {
                token += this.look;
                this.forward();
                if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '+': {
                token += this.look;
                this.forward();
                if (this.look == '+') {
                    token += this.look;
                    this.forward();
                } else if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '-': {
                token += this.look;
                this.forward();
                if (this.look == '-') {
                    token += this.look;
                    this.forward();
                } else if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '<': {
                token += this.look;
                this.forward();
                if (this.look == '<') {
                    token += this.look;
                    this.forward();
                }
                if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '>': {
                token += this.look;
                this.forward();
                if (this.look == '>') {
                    token += this.look;
                    this.forward();
                }
                if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '=': {
                token += this.look;
                this.forward();
                if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '!': {
                token += this.look;
                this.forward();
                if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '&': {
                token += this.look;
                this.forward();
                if (this.look == '&') {
                    token += this.look;
                    this.forward();
                } else if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '|': {
                token += this.look;
                this.forward();
                if (this.look == '|') {
                    token += this.look;
                    this.forward();
                } else if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
            case '^': {
                token += this.look;
                this.forward();
                if (this.look == '=') {
                    token += this.look;
                    this.forward();
                }
                break;
            }
        }
        return ({
            type: TokenType.SYMBOL,
            value: token,
            position: pos
        });
    }

    nextEof() {
        return {
            type: TokenType.EOF,
            value: '\0',
            position: {
                sline: this.line,
                eline: this.line,
                scolm: this.colm,
                ecolm: this.colm,
            }
        };
    }

    getNext() {
        while (true) {
            this.skipWhite();
            if (this.isEof()) break;
            if (this.isIdentifierStart()) {
                return this.nextId();
            } else if (this.isDigit()) {
                return this.nextNumber();
            } else if (this.isString()) {
                return this.nextString();
            } else {
                return this.nextSymbol();
            }
        }
        return this.nextEof();
    }
}

module.exports = {
    Keywords,
    TokenType,
    Tokenizer
};

