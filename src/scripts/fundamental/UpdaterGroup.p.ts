export class UpdaterGroup {
    public disposer;
    private _updaters: Updater[];

    constructor() {
        this._updaters = [];
        this.disposer = new Fundamental.Disposer(() => {
            this._updaters = null;
        });
    }

    public add(updaters) {
        if (this.disposer.isDisposed) {
            return;
        }

        if ($.isArray(updaters)) {
            for (var i = 0; i < updaters.length; i++) {
                this._updaters.push(updaters[i]);
            }
        } else {
            this._updaters.push(updaters);
        }
    }

    public update() {
        if (this.disposer.isDisposed) {
            return;
        }

        var result = false;

        for (var i = 0; i < this._updaters.length; i++) {
            result = this._updaters[i].update() ? true : result;
        }

        return result;
    }

    public reset() {
        if (this.disposer.isDisposed) {
            return;
        }

        for (var i = 0; i < this._updaters.length; i++) {
            this._updaters[i].reset();
        }
    }

    public ignore() {
        if (this.disposer.isDisposed) {
            return;
        }

        var result = false;

        for (var i = 0; i < this._updaters.length; i++) {
            result = this._updaters[i].ignore() ? true : result;
        }
        return result;
    }
}

