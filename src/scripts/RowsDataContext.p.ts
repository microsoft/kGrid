/// <summary>
/// List control class
/// </summary>
export class RowsDataContext {
    public disposer;
    private _rowId2IndexMap;
    private _rowIndex2IdMap;
    private _rows;
    private _rowCount;
    private _events;
    private _lastRowId;

    constructor() {
        this.disposer = new Fundamental.Disposer(() => {
            this._rowIndex2IdMap = null;
            this._rowId2IndexMap = null;
            this._rows = null;
            this._rowCount = 0;
        });

        this._lastRowId = 0;
        this._rowIndex2IdMap = [];
        this._rowId2IndexMap = [];
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

    public rowCount(value?) {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_rowCount',
            args: arguments,
            afterChange: (sender, args) => {
                var oldValue = args.oldValue,
                    newValue = args.newValue;

                if (newValue < oldValue) {
                    for (var i = newValue; i < oldValue; i++) {
                        var rowId = this._rowIndex2IdMap[i];

                        if (rowId) {
                            delete this._rowId2IndexMap[rowId];
                        }

                        delete this._rowIndex2IdMap[i];
                        delete this._rows[i];
                    }
                }

                this._rows.length = this._rowIndex2IdMap.length = newValue;
                this._events.emit('rowCountChange', this, newValue);
            },
        });
    }

    public rows(value?) {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_rows',
            args: arguments,
            beforeChange: (sender, args) => {
                var rows = args.newValue;

                if (args.newValue == null || typeof(args.newValue) == 'undefined') {
                    args.newValue = rows = [];
                } else if (!$.isArray(rows)) {
                    throw Microsoft.Office.Controls.Fundamental.createError(0, 'GridDataContext', 'rows must be an array');
                }

                this._rowIndex2IdMap = [];

                for (var i = 0; i < rows.length; i++) {
                    if (typeof(rows) != 'undefined') {
                        var rowId = this._generateRowId();

                        this._rowIndex2IdMap[i] = rowId;
                        this._rowId2IndexMap[rowId] = i;
                    }
                }

                args.newValue = rows.slice();
                this._events.emit('rowCountChange', this, args.newValue);
            },
        });
    }

    public getRowIdByIndex(rowIndex) {
        return this._rowId2IndexMap[rowIndex];
    }

    public getRowIndexById(rowId) {
        return this._rowIndex2IdMap[rowId];
    }

    public getRowById(rowId) {
        var rowInfo = this._getRowInfoById(rowId);

        if (rowInfo) {
            return rowInfo.raw;
        }
    }

    public getRowByIndex(rowIndex) {
        return this._rows[rowIndex];
    }

    public getRowsByIndex(topRowIndex, count) {
        var rows = [], bottomRowIndex = topRowIndex + count - 1;

        for (var rowIndex = topRowIndex; rowIndex <= bottomRowIndex && rowIndex < this._rowCount; rowIndex++) {
            rows.push(this._rows[rowIndex]);
        }

        return rows;
    }

    public updateRowById(row, rowId) {
        var rowIndex = this._getRowInfoById(rowId);

        if (rowIndex) {
            this.updateRowsByIndex([row], rowIndex.rowIndex, 1);
        }
    }

    public updateRowByIndex(row, rowIndex: number) {
        // FIXME: [high][1 day] should we add the row count when the index is exceed the row count?
        this.updateRowsByIndex([row], rowIndex, 1);
    }

    public updateRowsByIndex(rows, startRowIndex: number, count?: number) {
        if (typeof(count) == 'undefined') {
            count = rows.length;
        }

        for (var rowIndex = startRowIndex; rowIndex < startRowIndex + count; rowIndex++) {
            var newValue = rows[rowIndex - startRowIndex], rowId: any;
            this._rows[rowIndex] = newValue;

            if (typeof(newValue) != 'undefined') {
                if (!this._rowIndex2IdMap[rowIndex]) {
                    rowId = this._generateRowId();

                    this._rowIndex2IdMap[rowIndex] = rowId;
                    this._rowId2IndexMap[rowId] = rowIndex;
                }
            } else {
                var rowId = this._rowIndex2IdMap[rowIndex];

                if (rowId) {
                    delete this._rowIndex2IdMap[rowIndex];
                    delete this._rowId2IndexMap[rowId];
                }
            }
        }

        this._events.emit('updateRows', this, { range: new Range(RangeType.Row, startRowIndex, startRowIndex + rows.length - 1, NaN, NaN), });
    }

    public removeRowById(rowId: number) {
        var rowInfo = this._getRowInfoById(rowId);

        if (rowInfo) {
            this.removeRowsByIndex(rowInfo.rowIndex, 1);
        }
    }

    public removeRowByIndex(rowIndex: number) {
        this.removeRowsByIndex(rowIndex, 1);
    }

    public removeRowsByIndex(startRowIndex: number, count: number) {
        // FIXME: [high][1 day] add boundary check here
        var removedRows = this._rowIndex2IdMap.splice(startRowIndex, count);
        this._rows.splice(startRowIndex, count);

        for (var rowIndex = 0; rowIndex < removedRows.length; rowIndex++) {
            var rowId = removedRows[rowIndex];

            if (rowId) {
                delete this._rowId2IndexMap[rowId];
            }
        }


        for (var rowIndex = startRowIndex; rowIndex < this._rowIndex2IdMap.length; rowIndex++) {
            var rowId = this._rowIndex2IdMap[rowIndex];

            if (rowId) {
                this._rowId2IndexMap[rowId] = rowIndex;
            }
        }

        this._rowCount -= count;
        this._events.emit('removeRows', this, { range: new Range(RangeType.Row, startRowIndex, startRowIndex + count - 1, NaN, NaN), });
        this._events.emit('rowCountChange', this, this._rowCount);
    }

    public insertRowById(rowId: number) {
        var rowInfo = this._getRowInfoById(rowId);

        if (rowInfo) {
            this.insertRowsByIndex(rowInfo.rowIndex, 1);
        }
    }

    public insertRowByIndex(rowIndex: number) {
        this.insertRowsByIndex(rowIndex, 1);
    }

    public insertRowsByIndex(rows, startRowIndex: number, count?: number) {
        // FIXME: [high][1 day] add boundary check here
        if (typeof(count) == 'undefined') {
            count = rows.length;
        }

        var spliceParameters = [startRowIndex, 0];

        for (var rowIndex = startRowIndex; rowIndex < this._rowCount; rowIndex++) {
            var rowId = this._rowIndex2IdMap[rowIndex];

            if (typeof(rowId) != 'undefined') {
                this._rowId2IndexMap[rowId] = rowIndex + count;
            }
        }

        for (var rowIndex = 0; rowIndex < count; rowIndex++) {
            spliceParameters.push(undefined);
        }

        this._rowIndex2IdMap.splice.apply(this._rowIndex2IdMap, spliceParameters);
        this._rows.splice.apply(this._rows, spliceParameters);

        for (var rowIndex = startRowIndex; rowIndex < startRowIndex + count; rowIndex++) {
            var newValue = rows[rowIndex - startRowIndex],
                rowId: any;
            this._rows[rowIndex] = newValue;

            if (typeof(newValue) != 'undefined') {
                if (!this._rowIndex2IdMap[rowIndex]) {
                    rowId = this._generateRowId();

                    this._rowIndex2IdMap[rowIndex] = rowId;
                    this._rowId2IndexMap[rowId] = rowIndex;
                }
            } else {
                var row = this._rowIndex2IdMap[rowIndex];

                if (row) {
                    rowId = this._rowIndex2IdMap[rowIndex];

                    delete this._rowIndex2IdMap[rowIndex];
                    delete this._rowId2IndexMap[rowId];
                }
            }
        }

        this._rowCount += count;
        this._events.emit('insertRows', this, { range: new Range(RangeType.Row, startRowIndex, startRowIndex + rows.length - 1, NaN, NaN), });
        this._events.emit('rowCountChange', this, this._rowCount);
    }

    private _generateRowId() {
        return 'r' + (this._lastRowId++);
    }

    private _getRowInfoById(rowId) {
        if (typeof(this._rowId2IndexMap[rowId]) != 'undefined') {
            var rowIndex = this._rowId2IndexMap[rowId];

            return {
                rowIndex: rowIndex,
                rowId: rowId,
                raw: this._rows[rowIndex],
            };
        }
    }
}

