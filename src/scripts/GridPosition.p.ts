export class GridPosition implements IGridPosition, Fundamental.IFeature {
    private _invoke;
    private _runtime : GridRuntime;

    public constructor() {
    }

    public name() {
        return 'position';
    }

    public inject($invoke) {
        $invoke.inject('positionService', this);
    }

    public initialize(runtime, $invoke) {
        this._invoke = $invoke;
        this._runtime = runtime;
    }

    public getColumnWidthById(columnId) {
        var width = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId).width;

        // FIXME: default column width
        return isNaN(width) || width < 0 ? 50 : width;
    }

    public getColumnWidthByIndex(columnIndex) {
        var width = this._runtime.dataContexts.columnsDataContext.getColumnByIndex(columnIndex).width;

        // FIXME: default column width
        return isNaN(width) || width < 0 ? 50 : width;
    }

    public getRowHeightById(rowId) {
        return this._runtime.theme.values['content.row.height'].number;
    }

    public getRowHeightByIndex(rowIndex) {
        return this._runtime.theme.values['content.row.height'].number;
    }

    public getRect(topRowIndex, frontColumnIndex, bottomRowIndex, endColumnIndex, tag?) {
        var type = tag ? tag.type : null;

        if (!type || type == 'content') {
            if (!this._validateContentCellIndex(topRowIndex, frontColumnIndex) || !this._validateContentCellIndex(bottomRowIndex, endColumnIndex)) {
                return Fundamental.Rect.Null;
            }

            var rowHeight = this.getRowHeightByIndex(topRowIndex),
                cellHBorder = this._runtime.theme.values['content.cell.border-bottom'].number,
                visibleColumnIds = this._runtime.dataContexts.columnsDataContext.visibleColumnIds(),
                frontColumnFront = 0,
                endColumnFront = 0;

            for (var columnIndex = 0; columnIndex <= endColumnIndex; columnIndex++) {
                var column = this._runtime.dataContexts.columnsDataContext.getColumnByIndex(columnIndex);

                if (columnIndex < frontColumnIndex) {
                    frontColumnFront += this.getColumnWidthByIndex(columnIndex);
                }

                endColumnFront += this.getColumnWidthByIndex(columnIndex);
            }

            return new Fundamental.Rect(
                topRowIndex * rowHeight + topRowIndex * cellHBorder,
                frontColumnFront,
                (bottomRowIndex - topRowIndex + 1) * rowHeight + (bottomRowIndex - topRowIndex) * cellHBorder,
                endColumnFront - frontColumnFront);
        } else if (type == 'header') {
        }
    }

    private _validateContentCellIndex(rowIndex, columnIndex) {
        return rowIndex >= 0 && rowIndex < this._runtime.dataContexts.rowsDataContext.rowCount() && columnIndex >= 0  && columnIndex < this._runtime.dataContexts.columnsDataContext.visibleColumnIds().length;
    }
}

