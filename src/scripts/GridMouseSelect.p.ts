class GridMouseSelect implements Fundamental.IFeature {
    public disposer;
    private _runtime: GridRuntime;
    private _invoke;
    private _viewportService: IGridViewport;
    private _operatorService: IGridOperator;
    private _selectionService: IGridSelection;

    constructor() {
        this.disposer = new Fundamental.Disposer(() => {
            this._runtime = null;
            this._invoke = null;
            this._viewportService = null;
            this._operatorService = null;
            this._selectionService = null;
        });
    }

    public name() {
        return 'mouseSelect';
    }

    public inject() {
    }

    public initialize(runtime, $invoke, viewportService, operatorService, selectionService) {
        this._runtime = runtime;
        this._invoke = $invoke;
        this._viewportService = viewportService;
        this._operatorService = operatorService;
        this._selectionService = selectionService;
        this.disposer.addDisposable(new Fundamental.EventAttacher($(viewportService.rootElement()), 'mousedown', (event) => this._viewportMouseDown(event)));
    }

    private _viewportMouseDown(event) {
        // Left button
        if (event.which == 1) {
            var result = this._viewportService.getCellPositionByEvent(event),
                cellPosition = result && result.type == 'content' ? result.position : null;

            if (!cellPosition) {
                return;
            }

            this._startMouseSelect('mouseSelect', cellPosition);
        }
    }

    private _startMouseSelect(name, cellPosition) {
        return this._operatorService.start(name, new GridMouseSelectOperation(cellPosition))
            .done((result) => {
                var args = {
                        range: result.range,
                        reason: 'mouse',
                        cancel: false,
                    };

                this._runtime.events.internal.emit(result.action == 'select' ? 'beforeSelect' : 'beforeDeselect', this, args);

                if (!args.cancel) {
                    if (result.action == 'select') {
                        this._selectionService.select(args.range, false);
                    } else {
                        this._selectionService.deselect(args.range);
                    }
                }
            });
    }

}

