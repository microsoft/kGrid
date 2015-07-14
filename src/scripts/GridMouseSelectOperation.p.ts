class GridMouseSelectOperation implements IOperation {
    public disposer;
    private _runtime;
    private _startCellPosition;
    private _deferred;
    private _selectionService: IGridSelection;
    private _viewportService: IGridViewport;
    private _selectedRange;
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

        this._startCellPosition = cellPosition;
    }

    public canStart() {
        // return true;
    }

    public start(runtime, selectionService, viewportService) {
        this._runtime = runtime;
        this._selectionService = selectionService;
        this._viewportService = viewportService;
        this._rtl = this._runtime.direction.rtl();
        this._deferred = $.Deferred();

        var rowId = this._runtime.dataContexts.rowsDataContext.getRowIdByIndex(this._startCellPosition.columnIndex),
            columnId = this._runtime.dataContexts.columnsDataContext.getColumnIdByIndex(this._startCellPosition.rowIndex);

        if (!rowId || !columnId) {
            this._deferred.reject();
            return this._deferred.promise();
        }

        if (this._selectionService.selectionMode() == SelectionMode.SingleRow ||
            this._selectionService.selectionMode() == SelectionMode.Cell) {
            this._deferred.reject();
            return this._deferred.promise();
        }

        this._oldSelectedRanges = this._selectionService.selectedRanges();

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
        if (this._selectionService.selectionMode() != SelectionMode.MultipleRows && this._selectionService.selectionMode() != SelectionMode.Range) {
            return;
        }

        var result = this._viewportService.getCellPositionByEvent(event),
            cellPosition = result && result.type == 'content' ? result.position : null;

        if (!cellPosition) {
            return;
        }

        var rowIndex = cellPosition.rowIndex,
            columnIndex = cellPosition.columnIndex,
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
            this._viewportService.scroll(topOffset, frontOffset);
            console.log('scroll(' + topOffset + ', ' + frontOffset + ')');
        }

        console.log('rowIndex: ' + rowIndex);
        console.log('columnIndex: ' + columnIndex);
        if (isNaN(rowIndex) || isNaN(columnIndex)) {
            return;
        }

        if ((this._selectionService.selectionMode() == SelectionMode.MultipleRows && this._lastRowIndex != rowIndex) ||
            (this._selectionService.selectionMode() == SelectionMode.Range && (this._lastRowIndex != rowIndex || this._lastColumnIndex != columnIndex))) {
            this._lastRowIndex = rowIndex;
            this._lastColumnIndex = columnIndex;

            if (this._selectionService.selectionMode() == SelectionMode.MultipleRows) {
                this._selectedRange = new Range(RangeType.Row, this._startCellPosition.rowIndex, rowIndex, NaN, NaN);
            } else {
                this._selectedRange = new Range(RangeType.Range, this._startCellPosition.rowIndex, rowIndex, this._startCellPosition.columnIndex, columnIndex);
            }

            this._selectionService.select(this._selectedRange, false);
            console.log('select(' + JSON.stringify(this._selectedRange) + ')');
        }
    }

    public dispose() {
        this.disposer.dispose();
    }
}

