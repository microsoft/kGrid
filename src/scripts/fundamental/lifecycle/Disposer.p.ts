export class Disposer {
    public isDisposed;
    public isDisposing;
    private _disposeCallback;
    private _disposables;

    /**
     * This callback is called when this object is disposing
     * @callback Microsoft.Office.Controls.Fundamental.Disposer~DisposeCallback
     */

    /**
     * This class is designed to manage lifecycle. A class which have lifecycle management
     * should be designed as following pattern
     *
     *     class classWithLifecycle {
     *         public disposer;
     *
     *         constructor() {
     *             this.disposer = new Disposer(() => {
     *                 // Do whatever you want to do in disposing
     *             });
     *         }
     *
     *         // This function is optional, keep the compatibility to IDisposable interface.
     *         // The owner disposer will call this.disposer.dispose first and then call this.dispose
     *         // as second choice
     *         public dispose() {
     *             this.disposer.dispose();
     *         }
     *     }
     *
     * The object owner need to call theObject.disposer.dispose() method to dispose the object.
     * The benefits of using this are:
     * 1. The Disposer class can handle the double dispose issue
     * 2. Object owner can use [addDisposable]{@link Microsoft.Office.Controls.Fundamental.Disposer#addDisposable} method to add the object to its disposer and it will
     * be disposed automatically the owner is disposing
     * 3. The constructor takes one callback to do extra dispose work. So developer can write dispose
     * logic close to the constructor and easy to find what didn't do in disposing
     *
     * @constructor Microsoft.Office.Controls.Fundamental.Disposer
     * @param {Microsoft.Office.Controls.Fundamental.Disposer~DisposeCallback=} disposeCallback - a callback will be called in disposing
     */
    constructor(disposeCallback?) {
        this.isDisposed = false;
        this.isDisposing = false;
        this._disposeCallback = disposeCallback;
        this._disposables = [];
    }

    /**
     * @method Microsoft.Office.Controls.Fundamental.Disposer#addDisposable
     * @param {object} disposable - an object which will be disposed when "this" is disposed. The object should implement {@link Microsoft.Office.Controls.Fundamental.IDisposable} or expose dispose function
     */
    public addDisposable(disposable) {
        if (this.isDisposed || this.isDisposing) {
            if (disposable.disposer) {
                disposable.disposer.dispose();
            } else if (disposable.dispose) {
                disposable.dispose();
            }

            return;
        }

        this._disposables.push(disposable);
    }

    /**
     * @method Microsoft.Office.Controls.Fundamental.Disposer#dispose
     */
    public dispose() {
        if (this.isDisposed || this.isDisposing) {
            return;
        }

        this.isDisposing = true;

        if (this._disposeCallback) {
            this._disposeCallback();
        }

        for (var i = 0; i < this._disposables.length; i++) {
            if (this._disposables[i].disposer) {
                this._disposables[i].disposer.dispose();
            } else if (this._disposables[i].dispose) {
                this._disposables[i].dispose();
            }
        }

        this._disposables = null;
        this.isDisposed = true;
    }
}

