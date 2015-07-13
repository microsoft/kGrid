export class Grid {
    public disposer;
    private _runtime: GridRuntime;
    private _invoke;

    public constructor(container, features, $invoke) {
        this.disposer = new Fundamental.Disposer(() => {
            this._runtime = null;
        });

        if (!features) {
            features = [new GridPosition(), new GridRender(), new GridSelection()];
        }

        if (!$invoke) {
            this._invoke = invoke.inherit();
        } else {
            this._invoke = $invoke.inherit();
        }

        this._runtime = new GridRuntime();
        this._runtime.width = $(container).width();
        this._runtime.height = $(container).height();
        this._runtime.dataContexts = {
            rowsDataContext: new RowsDataContext(),
            columnsDataContext: new ColumnsDataContext(),
        };
        this._runtime.container = container;
        this._runtime.features = features;
        this._runtime.id = (new Date()).valueOf();

        this._runtime.theme = new Fundamental.Theme('<div prefix=""><div class="content" prefix="content."><div class="selection" prefix="content.selection."></div><div class="cursor" prefix="content.cursor."></div><div class="cell" prefix="content.cell."></div><div class="row" prefix="content.row."></div><div class="row alternate" prefix="content.row:alternate."><div class="row odd" prefix="content.row:odd."><div class="row even" prefix="content.row:even."></div><div class="row hover" prefix="content.row:hover."></div></div><div class="header" prefix="header."><div class="row" prefix="header.row."></div><div class="cell" prefix="header.cell."></div></div></div>', 'kGrid');
        this._runtime.theme.load('default');
        this._runtime.selectionMode = SelectionMode.SingleRow;
        this._runtime.events = new Fundamental.EventSite();
        this._runtime.rootClass = 'msoc-list-' + this._runtime.id;
        this._runtime.direction = new Fundamental.TextDirection(Fundamental.TextDirection.LTR);

        // FIXME: initialize the injection
        this._invoke.inject('grid', this);
        this._invoke.inject('runtime', this._runtime);

        $.each(this._runtime.features, (index, feature) => {
            this.disposer.addDisposable(feature);
            this._invoke.withThis(feature, feature.inject);
        });

        $.each(this._runtime.features, (index, feature) => {
            this._invoke.withThis(feature, feature.initialize);
        });

        this._invoke((rootElement) => {
            // var renderContext = {
            //     headerCells: [],
            // };

            // this._runtime.renderingScheduler.addWorker((context) => this._renderHeaderCellWorker(context), renderContext, 800);

            // window.setTimeout(() => {
            //     this._runtime.updaters.update();
            //     this._runtime.renderingScheduler.start(true);

            //     // FIXME: [low][1 day] Add a firefox checker
            //     // Workaround FireFox bug https://bugzilla.mozilla.org/show_bug.cgi?id=706792
            //     // this._elements.canvasContainer.css('width', '1000000px');
            //     // this._elements.canvasContainer.css('height', '1000000px');
            //     // this._elements.viewport.scrollLeft(0);
            //     // this._elements.viewport.scrollTop(0);
            //     // this._elements.canvasContainer.css('width', '');
            //     // this._elements.canvasContainer.css('height', '');
            //     // this._elements.headerCanvasContainer.css('width', '1000000px');
            //     // this._elements.headerCanvasContainer.css('height', '1000000px');
            //     // this._elements.headerViewport.scrollLeft(0);
            //     // this._elements.headerViewport.scrollTop(0);
            //     // this._elements.headerCanvasContainer.css('width', '');
            //     // this._elements.headerCanvasContainer.css('height', '');
            // });
        });
    }

    public dispose() {
        this.disposer.dispose();
    }

    public rowsDataContext(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime.dataContexts,
            name: 'rowsDataContext',
            args: arguments,
            beforeChange: (sender, args) => {
                args.cancel = true;
            },
        });
    }

    public columnsDataContext(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime.dataContexts,
            name: 'columnsDataContext',
            args: arguments,
            beforeChange: (sender, args) => {
                args.cancel = true;
            },
        });
    }

    public width(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime,
            name: 'width',
            args: arguments,
            afterChange: (sender, args) => {
                $(this._runtime.container).css('width', args.newValue + 'px');
                this._runtime.events.emit('propertyChange', this, { name: 'width', newValue: args.newValue, oldValue: args.oldValue });
            },
        });
    }

    public height(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime,
            name: 'height',
            args: arguments,
            afterChange: (sender, args) => {
                $(this._runtime.container).css('height', args.newValue + 'px');
                this._runtime.events.emit('propertyChange', this, { name: 'height', newValue: args.newValue, oldValue: args.oldValue });
            },
        });
    }
}

