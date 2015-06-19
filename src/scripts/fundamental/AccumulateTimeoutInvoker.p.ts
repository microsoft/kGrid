// FIXME: [low][1 day] change to promise
export class AccumulateTimeoutInvoker {
    public disposer;
    private _timeout;
    private _callback;
    private _handler;

    constructor(callback, timeout) {
        this._timeout = timeout;
        this._callback = callback;
        this.disposer = new Fundamental.Disposer(() => {
            if (this._handler) {
                window.clearTimeout(this._handler);
                this._handler = null;
            }
        });
    }

    public invoke(args = null) {
        if (this._handler) {
            window.clearTimeout(this._handler);
            this._handler = null;
        }

        this._handler = window.setTimeout(() => {
            this._handler = null;
            this._callback(args);
        }, this._timeout);
    }

    public dispose() {
        this.disposer.dispose();
    }
}

