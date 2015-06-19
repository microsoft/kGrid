export class DynamicStylesheetUpdater {
    public disposer;
    private _stylesheet: Microsoft.Office.Controls.Fundamental.DynamicStylesheet;
    private _updater: Updater;
    private _generators = [];

    constructor(id) {
        this._stylesheet = new Microsoft.Office.Controls.Fundamental.DynamicStylesheet(id);
        this._generators = [];
        this._updater = new Updater(
            () => {
                if (this.disposer.isDisposed) {
                    return;
                }

                return $.map(this._generators, (generator) => generator()).join('');
            },
            (newValue) => {
                if (this.disposer.isDisposed) {
                    return;
                }

                this._stylesheet.content(newValue)
            });
        this.disposer = new Fundamental.Disposer(() => {
            this._generators = null;
            this._updater = null;
        });
    }

    public add(generator) {
        if (this.disposer.isDisposed) {
            return;
        }

        this._generators.push(generator);
    }

    public reset() {
        if (this.disposer.isDisposed) {
            return;
        }

        this._updater.reset();
        this._stylesheet.content('');
    }

    public getUpdater() {
        if (this.disposer.isDisposed) {
            return;
        }

        return this._updater;
    }
}

