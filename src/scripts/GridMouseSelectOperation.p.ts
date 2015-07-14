class GridMouseSelectOperation implements IOperation {
    public disposer;
    private _runtime;
    private _cellPosition;
    private _deferred;
    private _selectionService: IGridSelection;
    private _viewportService: IGridViewport;
    private _firstRowIndex;
    private _firstColumnIndex;
    private _selectedRange;
    private _selectionMode;
    private _oldSelectedRanges;
    private _lastColumnIndex;
    private _lastRowIndex;
    private _rtl;

    constructor(cellPosition) {
        this.disposer = new Fundamental.Disposer(() => {
            if (!this._oldSelectedRanges || this._oldSelectedRanges.length == 0) {
            } else {
                this._selectionService.select(this._oldSelectedRanges[0], false);
            }
        });

        this._cellPosition = cellPosition;
    }

    public start(runtime, selectionService, viewportService) {
        this._runtime = runtime;
        this._selectionService = selectionService;
        this._viewportService = viewportService;
        this._oldSelectedRanges = this._selectionService.selectedRanges();
        this._rtl = this._runtime.direction.rtl();
        this._deferred = $.Deferred();

        var rowId = this._runtime.dataContexts.rowsDataContext.getRowIdByIndex(this._cellPosition.columnIndex),
            columnId = this._runtime.dataContexts.columnsDataContext.getColumnIdByIndex(this._cellPosition.columnIndex);

        if (!rowId || !columnId) {
            if (!this._oldSelectedRanges || this._oldSelectedRanges.length == 0) {
            } else {
                this._selectionService.select(this._oldSelectedRanges[0], false);
            }
            this._deferred.reject();
            return this._deferred.promise();
        }

        if (this._selectionService.selectionMode() == SelectionMode.SingleRow ||
            this._selectionService.selectionMode() == SelectionMode.Cell) {
            if (!this._oldSelectedRanges || this._oldSelectedRanges.length == 0) {
            } else {
                this._selectionService.select(this._oldSelectedRanges[0], false);
            }
            this._deferred.reject();
            return this._deferred.promise();
        }

        this._firstColumnIndex = this._runtime.dataContexts.columnsDataContext.getColumnIndexById(columnId);
        this._firstRowIndex = this._runtime.dataContexts.rowsDataContext.getRowIndexById(rowId);

        this._selectionMode = this._selectionService.selectionMode();

        this.disposer.addDisposable(new Fundamental.EventAttacher($(window), 'mouseup', (event) => this._onMouseUp(event)));
        this.disposer.addDisposable(new Fundamental.EventAttacher($(window), 'mousemove', (event) => this._onMouseMove(event)));
        return this._deferred.promise();
    }

    private _onMouseUp(event) {
        if (event.which == 1) {
            if (!this._oldSelectedRanges || this._oldSelectedRanges.length == 0) {
            } else {
                this._selectionService.select(this._oldSelectedRanges[0], false);
            }

            if (this._selectedRange) {
                this._deferred.resolve({
                    range: this._selectedRange,
                    action: 'select'
                });
            } else {
                this._deferred.reject();
            }
        }
    }

    private _onMouseMove(event) {
        if (this._selectionMode != SelectionMode.MultipleRows && this._selectionMode != SelectionMode.Range) {
            return;
        }

        var result = this._viewportService.getCellPositionByEvent(event),
            cellPosition = result && result.type == 'content' ? result.position : null;

        if (!cellPosition) {
            return;
        }

        var rowIndex = cellPosition.top,
            columnIndex = cellPosition.front,
            rtl = this._runtime.direction.rtl();

        var pointerToViewportCoordinate = Fundamental.CoordinateFactory.fromEvent(this._rtl, event)['mouse'].minus(Microsoft.Office.Controls.Fundamental.CoordinateFactory.fromElement(this._rtl, this._viewportService.contentViewport()));
        var frontOffset, topOffset;

        if (pointerToViewportCoordinate.front() < this._viewportService.contentViewport().clientWidth * Constants.RatioToOperationScrollArea) {
            frontOffset = -Constants.OperationScrollNumber;
        } else if (pointerToViewportCoordinate.front() > this._viewportService.contentViewport().clientWidth * (1 - Constants.RatioToOperationScrollArea)) {
            frontOffset = Constants.OperationScrollNumber;
        }

        if (pointerToViewportCoordinate.top() < this._viewportService.contentViewport().clientWidth * Constants.RatioToOperationScrollArea) {
            topOffset = -Constants.OperationScrollNumber;
        } else if (pointerToViewportCoordinate.top() > this._viewportService.contentViewport().clientWidth * (1 - Constants.RatioToOperationScrollArea)) {
            topOffset = Constants.OperationScrollNumber;
        }

        if (frontOffset != 0 || topOffset != 0) {
            this._runtime.scroll(topOffset, frontOffset);
        }

        if (isNaN(rowIndex) || isNaN(columnIndex)) {
            return;
        }

        if ((this._selectionMode == SelectionMode.MultipleRows && this._lastRowIndex != rowIndex) ||
            (this._selectionMode == SelectionMode.Range && (this._lastRowIndex != rowIndex || this._lastColumnIndex != columnIndex))) {
            this._lastRowIndex = rowIndex;
            this._lastColumnIndex = columnIndex;

            if (this._selectionMode == SelectionMode.SingleRow ||
                this._selectionMode == SelectionMode.MultipleRows) {
                this._selectedRange = new Range(RangeType.Row, this._firstRowIndex, rowIndex, NaN, NaN);
            } else {
                this._selectedRange = new Range(RangeType.Range, this._firstRowIndex, rowIndex, this._firstColumnIndex, columnIndex);
            }

            this._selectionService.select(this._selectedRange, false);
        }
    }

    public dispose() {
        this.disposer.dispose();
    }
}

