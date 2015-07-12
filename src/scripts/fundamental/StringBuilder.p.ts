export class StringBuilder {
    // Per http://jsperf.com/array-join-vs-string-connect
    // use string is faster than array join
    private _buffer;
    private _textTransformer;
    private _context;

    constructor() {
        this._buffer = '';
    }

    public append(text) {
        if (!this._context) {
            this._buffer += text;
        } else {
            if (!this._textTransformer) {
                this._textTransformer = new TextTransformer(this._context);
            } else {
                this._textTransformer.context = this._context;
            }

            this._buffer += this._textTransformer.transform(text);
        }
    }

    public context(value?) {
        if (arguments.length == 0) {
            if (!this._context) {
                this._context = {};
            }

            return this._context;
        } else {
            return this._context = value;
        }
    }

    public toString() {
        return this._buffer;
    }
}

