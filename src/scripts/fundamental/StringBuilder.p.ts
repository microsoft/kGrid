export class StringBuilder {
    // Per http://jsperf.com/array-join-vs-string-connect
    // use string is faster than array join
    private _buffer;

    constructor() {
        this._buffer = '';
    }

    public append(text) {
        this._buffer += text;
    }

    public toString() {
        return this._buffer;
    }
}

