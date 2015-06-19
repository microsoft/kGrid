export class Updater {
    private _checker;
    private _updater;
    private _isFirstTime;
    private _lastValue;

    constructor(checker, updater) {
        this._checker = checker;
        this._updater = updater;
        this._isFirstTime = true;
    }

    public update() {
        var value = typeof(this._checker) == "function" ? this._checker() : this._checker;

        if (this._isFirstTime) {
            this._isFirstTime = false;
            this._lastValue = JSON.stringify(value);
            this._updater(value, value);
            return true;
        } else if (JSON.stringify(value) !== this._lastValue) {
            var lastValue = JSON.parse(this._lastValue)

            this._lastValue = JSON.stringify(value);
            this._updater(value, lastValue);
            return true;
        }

        return false;
    }

    public reset() {
        this._isFirstTime = true;
        this._lastValue = undefined;
    }

    public ignore() {
        var value = typeof(this._checker) == "function" ? this._checker() : this._checker;

        if (this._isFirstTime) {
            this._isFirstTime = false;
            this._lastValue = value;
        } else if (JSON.stringify(value) !== this._lastValue) {
            this._lastValue = JSON.stringify(value);
        }
    }
}

