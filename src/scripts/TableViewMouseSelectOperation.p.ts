class TableViewMouseSelectOperation implements IOperation {
    public disposer;
    private _tableView: TableView;
    private _visibleColumnMap;
    private _runtime;
    private _cellElement;
    private _selectionUpdater;
    private _deferred;
    private _firstRowIndex;
    private _firstColumnIndex;
    private _selectedRange;
    private _selectionMode;
    private _oldSelection;
    private _lastColumnIndex;
    private _lastRowIndex;
    private _rtl;

    constructor() {
        this.disposer = new Fundamental.Disposer(() => {
            this._runtime.selection = this._oldSelection;
            this._selectionUpdater.update();
        });
    }

    public start(tableView, runtime, event, selectionUpdater) {
        this._tableView = tableView;
        this._visibleColumnMap = this._tableView.visibleColumnMap();
        this._runtime = runtime;
        this._oldSelection = this._runtime.selection;
        this._selectionUpdater = selectionUpdater;
        this._cellElement = $(event.target).closest('.msoc-list-table-cell');
        this._rtl = this._runtime.direction.rtl();
        this._deferred = $.Deferred();
        var rowUniqueId = this._cellElement.attr('data-rowUniqueId');
        var columnUniqueId = this._cellElement.attr('data-columnUniqueId');

        if (!rowUniqueId || !columnUniqueId) {
            this._runtime.selection = this._oldSelection;
            this._deferred.reject();
            return this._deferred.promise();
        }

        if (this._oldSelection.selectionMode() == SelectionMode.SingleRow ||
            this._oldSelection.selectionMode() == SelectionMode.Cell) {
            this._runtime.selection = this._oldSelection;
            this._deferred.reject();
            return this._deferred.promise();
        }

        this._firstColumnIndex = this._visibleColumnMap.indexOf(columnUniqueId);
        this._firstRowIndex = this._runtime.getRowByUniqueId(rowUniqueId).rowIndex;

        this._selectionMode = this._runtime.selection.selectionMode();

        this.disposer.addDisposable(new Support.EventAttacher($(window), 'mouseup', (event) => this._onMouseUp(event)));
        this.disposer.addDisposable(new Support.EventAttacher($(window), 'mousemove', (event) => this._onMouseMove(event)));
        return this._deferred.promise();
    }

    private _onMouseUp(event) {
        if (event.which == 1) {
            this._runtime.selection = this._oldSelection;

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
        var cellElement = $(event.target).closest('.msoc-list-table-cell');
        var rowUniqueId = cellElement.attr('data-rowUniqueId');
        var columnUniqueId = cellElement.attr('data-columnUniqueId');

        if (!rowUniqueId || !columnUniqueId) {
            return;
        }

        var columnIndex = this._visibleColumnMap.indexOf(columnUniqueId);
        var rowIndex = this._runtime.getRowByUniqueId(rowUniqueId).rowIndex;
        var rtl = this._runtime.direction.rtl();

        if (this._selectionMode != SelectionMode.MultipleRows && this._selectionMode != SelectionMode.Range) {
            return;
        }

        var pointerToViewportCoordinate = Support.CoordinateFactory.fromEvent(this._rtl, event)['mouse'].minus(Support.CoordinateFactory.fromElement(this._rtl, this._runtime.elements.headerViewport));
        var frontOffset, topOffset;

        if (pointerToViewportCoordinate.front() < this._runtime.viewportClientWidth * Constants.RatioToOperationScrollArea) {
            frontOffset = -Constants.OperationScrollNumber;
        } else if (pointerToViewportCoordinate.front() > this._runtime.viewportClientWidth * (1 - Constants.RatioToOperationScrollArea)) {
            frontOffset = Constants.OperationScrollNumber;
        }

        if (pointerToViewportCoordinate.top() < this._runtime.viewportClientHeight * Constants.RatioToOperationScrollArea) {
            topOffset = -Constants.OperationScrollNumber;
        } else if (pointerToViewportCoordinate.top() > this._runtime.viewportClientHeight * (1 - Constants.RatioToOperationScrollArea)) {
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

            this._runtime.selection = this._oldSelection.clone();
            this._runtime.selection.select(this._selectedRange);
            this._selectionUpdater.update();
        }
    }

    public dispose() {
        this.disposer.dispose();
    }
}

