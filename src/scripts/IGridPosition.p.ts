export interface IGridPosition {
    getColumnWidthById(columnId);
    getColumnWidthByIndex(columnIndex);
    getRowHeightById(rowId);
    getRowHeightByIndex(rowIndex);
    getRect(topRowIndex, bottomRowIndex, frontColumnIndex, endColumnIndex, tag?);
}

