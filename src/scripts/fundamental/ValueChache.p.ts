export class ValueCache {
    private _getter;
    private _cached = false;
    private _value;

    constructor(getter) {
        this._getter = getter;
    }

    public val(options) {
        if (!this._cached) {
            this._value = this._getter();
            this._cached = true;
        }

        return this._value;
    }

    public invalidate() {
        this._value = undefined;
        this._cached = false;
    }
}

