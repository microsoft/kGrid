export class Operator {
    public disposer;
    private _operation: IOperation;
    private _deferred: JQueryDeferred<any>;
    private _name;

    constructor() {
        this.disposer = new Fundamental.Disposer(() => this.stop());
    }

    public start(name, operation: IOperation): JQueryPromise<any> {
        var deferred = this._deferred = $.Deferred();

        if (this._operation) {
            deferred.reject();
            return deferred.promise();
        }

        var args = Array.prototype.slice.call(arguments, 2);

        this._operation = operation;
        this._name = name;
        this._operation.start.apply(this._operation, args)
            .always(() => this._operation && this._operation.disposer.dispose())
            .done(() => deferred.resolve.apply(deferred, arguments))
            .fail(() => deferred.reject.apply(deferred, arguments))
            .always(() => this.stop());

        return deferred.promise();
    }

    public stop() {
        if (this._operation) {
            var operation = this._operation;

            this._operation = null;
            operation.disposer.dispose();

            if (this._deferred) {
                this._deferred.reject();
            }
        }

        this._deferred = null;
    }

    public name() {
        return this._name;
    }

    public dispose() {
        this.disposer.dispose();
    }
}

