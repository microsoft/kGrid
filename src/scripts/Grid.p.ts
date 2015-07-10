class Grid {
    public disposer;
    private _theme;

    public constructor(rowsDataContext, columnsDataContext, theme) {
        this.disposer = new Fundamental.Disposer(() => {
            this._elements = null;
        });
    }

    public dispose() {
        this.disposer.dispose();
    }
}

