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
        if (!this._textTransformer) {
            this._buffer += text;
        } else {
            this._textTransformer.context = this._context;
            this._buffer += this._textTransformer.transform(text);
        }
    }

    public context(value?) {
        return PropertyBag.property({
            target: this,
            name: '_context',
            args: arguments,
            afterRead: (sender, args) => {
                if (!this._textTransformer) {
                    if (!args.newValue) {
                        args.newValue = this._context = {};
                    }

                    this._textTransformer = new TextTransformer(args.newValue);
                }
            },
            afterChange: (sender, args) => {
                if (args.newValue) {
                    this._textTransformer = new TextTransformer(args.newValue);
                } else {
                    this._textTransformer = null;
                }
            },
        });
    }

    public toString() {
        return this._buffer;
    }
}

