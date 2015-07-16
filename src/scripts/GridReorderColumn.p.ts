class GridReorderColumn implements Fundamental.IFeature {
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
        return 'reorderColumn';
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
                cellPosition = result && result.type == 'header' ? result.position : null;

            if (!cellPosition) {
                return;
            }

            this._startReorderColumn('reorderColumn', cellPosition, event);
        }
    }

    private _startReorderColumn(name, cellPosition, event) {
        var isTouch = Microsoft.Office.Controls.Fundamental.BrowserDetector.isTouchEvent(event.type),
            pointerId = Microsoft.Office.Controls.Fundamental.BrowserDetector.getChangedPointerIdentifier(event)[0],
            coordinate = Microsoft.Office.Controls.Fundamental.CoordinateFactory.fromEvent(this._runtime.direction.rtl(), event)[pointerId];

        return this._operatorService.start(name, new GridReorderColumnOperation(isTouch, pointerId, coordinate))
        .done((oldColumnIndex, newColumnIndex) => {
            // if (oldColumnIndex == 0 || newColumnIndex == 0) {
            //     var headerCellElement = this.getHeaderCellElement(this._visibleColumnMap[0]);

            //     if (headerCellElement) {
            //         headerCellElement.removeClass('msoc-list-table-header-cell-first');
            //     }
            // }

            // var columnUniqueId = this._visibleColumnMap.splice(oldColumnIndex, 1)[0];

            // this._visibleColumnMap.splice(newColumnIndex - (oldColumnIndex < newColumnIndex ? 1 : 0), 0, columnUniqueId);

            // if (oldColumnIndex == 0 || newColumnIndex == 0) {
            //     var headerCellElement = this.getHeaderCellElement(this._visibleColumnMap[0]);

            //     if (headerCellElement) {
            //         headerCellElement.addClass('msoc-list-table-header-cell-first');
            //     }
            // }

            // this._updateColumnPosition();
            // this._runtime.updateUI(1);
        });
    }
}

