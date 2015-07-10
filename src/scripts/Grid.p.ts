class Grid {
    public disposer;
    private _id;
    private _theme;
    private _container;
    private _elements;
    private _width;
    private _height;
    private _dataContexts;

    public constructor(container) {
        this.disposer = new Fundamental.Disposer(() => {
            this._width = NaN;
            this._height = NaN;
            this._elements = null;
            this._container = null;
        });

        this._width = NaN;
        this._height = NaN;
        this._dataContext = null;
        this._container = container;
        this._id = (new Date()).valueOf();
    }

    public dispose() {
        this.disposer.dispose();
    }

    public rowsDataContext(value?) {
        return Fundamental.PropertyBag.property({
            target: this._dataContexts,
            name: 'rowsDataContext',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }

    public columnsDataContext(value?) {
        return Fundamental.PropertyBag.property({
            target: this._dataContexts,
            name: 'columnsDataContext',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }

    public width(value?) {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_width',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }

    public height(value?) {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_height',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }
}

