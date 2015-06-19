export class CssTextBuilder {
    // Per http://jsperf.com/array-join-vs-string-connect
    // use string is faster than array join
    private static _selectorState = 0;
    private static _propertyState = 1;
    private _state;
    private _buffer;

    constructor() {
        this._buffer = '';
        this._state = CssTextBuilder._selectorState;
    }

    public append(text) {
        this.pushSelector(text);
    }

    public push(text) {
        this.pushSelector(text);
    }
    public pushSelector(selector) {
        if (this._state == CssTextBuilder._propertyState) {
            this._buffer += '}';
            this._state = CssTextBuilder._selectorState;
        }

        this._buffer += selector;
    }

    public property(name, value, unit?) {
        if (arguments.length > 2 && isNaN(value)) {
            throw(0, 'CssTextBuilder', 'cannot use unit when the second argument are NaN');
        }

        if (this._state == CssTextBuilder._selectorState) {
            this._buffer += '{';
            this._state = CssTextBuilder._propertyState;
        }

        this._buffer += name;
        this._buffer += ':';
        this._buffer += value;

        if (unit) {
            this._buffer += unit;
        }

        this._buffer += ';';
    }

    public propertyBegin() {
        switch (this._state) {
            case CssTextBuilder._selectorState:
                this._buffer += '{';
                this._state = CssTextBuilder._propertyState;
                break;

            case CssTextBuilder._propertyState:
                throw createError(0, 'CssTextBuilder', 'cannot use propertyBegin in propertyState');
        }
    }

    public propertyEnd() {
        switch (this._state) {
            case CssTextBuilder._selectorState:
                throw createError(0, 'CssTextBuilder', 'cannot use propertyEnd in selectorState');
                break;

            case CssTextBuilder._propertyState:
                this._buffer += '}';
                this._state = CssTextBuilder._selectorState;
                break;
        }
    }

    public toString() {
        if (this._state == CssTextBuilder._propertyState) {
            this._buffer += '}';
        }

        return this._buffer;
    }
}


