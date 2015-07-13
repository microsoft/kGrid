export class GridPosition implements IGridPosition, Fundamental.IFeature {
    private _invoke;
    private _runtime : GridRuntime;

    public constructor() {
    }

    public name() {
        return 'gridPosition';
    }

    public initialize(runtime, $invoke) {
        this._invoke = $invoke;
        this._runtime = runtime;
    }

    public getRect(topRowIndex, bottomRowIndex, frontColumnIndex, endColumnIndex, type?) {
        if (!type || type == 'content') {
            var rowHeight = this._runtime.theme.values['content.row.height'].number,
                cellHBorder = this._runtime.theme.values['content.cell.border-bottom'].number;

            // if (rowIndex < 0 || isNaN(rowIndex) || rowIndex >= this._options.rowCount || columnIndex < 0 || isNaN(columnIndex) || columnIndex > this._visibleColumnMap.length - 1) {
            //     return Fundamental.Rect.Null;
            // }

            // var columnUniqueId = this._visibleColumnMap[columnIndex],
            //     column = this._options.columns[columnUniqueId];

            // return {
            //     top: rowIndex * rowHeight + rowIndex * cellHBorder.width,
            //     height: rowHeight,
            //     front: column.table.front,
            //     width: this.getColumnWidth(columnUniqueId),
            // };
        } else if (type == 'header') {
        }
    }
}

