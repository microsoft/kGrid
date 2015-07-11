/// <summary>
/// List control class
/// </summary>
export class ColumnsDataContext {
    public disposer;
    private _events;
    private _columns;
    private _visibleColumnIds;
    private _lastColumnId;

    constructor() {
        this.disposer = new Fundamental.Disposer(() => {
            this._columns = null;
            this._visibleColumnIds = null;
        });

        this._visibleColumnIds = [];
        this._columns = [];
        this._lastColumnId = 0;
        this.disposer.addDisposable(this._events = new Fundamental.EventSite());
    }

    public dispose() {
        this.disposer.dispose();
    }

    public on(eventName, handler) {
        this._events.on(eventName, handler);
    }

    public off(eventName, handler) {
        this._events.off(eventName, handler);
    }

    public addColumns(columnDefinitions) {
        var columnIds = [];

        for (var i = 0; i < columnDefinitions.length; i++) {
            var columnDefinition = columnDefinitions[i],
                columnIndex = this._columns.length,
                columnId = this._generateColumnId();

            this._columns[columnId] = {
                columnId: columnId,
                cellRender: !!columnDefinition.cellRender ? columnDefinition.cellRender : new SimpleTextCellRender(),
                headerRender: !!columnDefinition.headerRender ? columnDefinition.headerRender : new SimpleTextHeaderRender(),
                cellEditor: columnDefinition.cellEditor,
                raw: columnDefinition,
            };

            columnIds.push(columnId);
            this._visibleColumnIds.push(columnId);
        }

        return columnIds;
    }

    public getColumnIndexById(columnId) {
        var index = this._visibleColumnIds.indexOf(columnId);

        return index < 0 ? NaN : index;
    }

    public getColumnIdByIndex(columnIndex) {
        var columnId = this._visibleColumnIds[columnIndex]

        return columnId;
    }

    public visibleColumns(visibleColumns?: any[]) {
        if (arguments.length > 0) {
            this._visibleColumnIds = [];

            for (var columnIndex = 0; columnIndex < visibleColumns.length; columnIndex++) {
                var columnId = visibleColumns[columnIndex].columnId,
                    width = visibleColumns[columnIndex].width,
                    column = this._columns[columnId];

                if (!column) {
                    throw Microsoft.Office.Controls.Fundamental.createError(0, 'ColumnsDataContext', 'invalid column id: ' + columnId);
                }

                if (typeof(width) != 'undefined') {
                    width = parseFloat(width);

                    if (isNaN(width)) {
                        column.width = NaN;
                    } else if (width <= 0) {
                        throw Microsoft.Office.Controls.Fundamental.createError(0, 'ColumnsDataContext', 'invalid width: ' + columns[columnIndex].width);
                    } else {
                        column.width = width;
                    }
                }

                this._visibleColumnIds.push(columnId);
            }

            this._events.emit('visibleColumnIdsChange', this, this._visibleColumnIds);
        } else {
            var columns = [];
            for (var columnIndex = 0; columnIndex < this._visibleColumnIds.length; columnIndex++) {
                var columnId = this._visibleColumnIds[columnIndex],
                    column = this._columns[columnId];

                columns.push({
                    columnId: columnId,
                    columnIndex: columnIndex,
                    width: column.width,
                });
            }

            return columns;
        }
    }

    private hideColumnByIndex(columnIndex) {
        if (columnIndex < 0 || columnIndex >= this._visibleColumnIds.length) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'ColumnsDataContext', 'Invalidate columnIndex:' + columnIndex + ', validate range is [0, ' + this._visibleColumnIds.length + ']');
        }

        this._visibleColumnIds.splice(columnIndex, 1);
        // this._runtime.selection.remove(new Range(RangeType.Column, NaN, NaN, columnIndex, columnIndex));
        // this._updateColumnPosition();
        // this._invalidateHeader();
        // this._runtime.updateUI(1);
    }

    private showColumnByIndex(columnIndex, columnUniqueId) {
        if (columnIndex < 0 || columnIndex > this._visibleColumnIds.length) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'ColumnsDataContext', 'Invalidate columnIndex:' + columnIndex + ', validate range is [0, ' + this._visibleColumnIds.length + ']');
        }

        var column = this._columns[columnUniqueId];

        if (!column) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'ColumnsDataContext', 'Column with id ' + columnUniqueId + ' does not exist');
        }

        this._visibleColumnIds.splice(columnIndex, 0, columnUniqueId);
        // this._runtime.selection.insert(new Range(RangeType.Column, NaN, NaN, columnIndex, columnIndex));
        // this._updateColumnPosition();
        // this._invalidateHeader();
        // this._runtime.updateUI(1);
    }

    private _generateColumnId() {
        return 'c' + (this._lastColumnId++);
    }

    // private _updateColumnPosition() {
    //     var cellVBorderWidth = this._options.theme.value('table.cellVBorder').width, accumulateFront = 0;

    //     for (var i = 0; i < this._visibleColumnMap.length; i++) {
    //         var columnUniqueId = this._visibleColumnMap[i], column = this._options.columns[columnUniqueId];

    //         column.table.front = accumulateFront;
    //         accumulateFront += this.getColumnWidth(columnUniqueId) + cellVBorderWidth;
    //     }

    //     this._renderRangeUpdater.update();
    // }
}

