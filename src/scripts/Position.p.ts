export class Position {
    public static Null = new Position(NaN, NaN);
    public rowIndex;
    public columnIndex;

    constructor(rowIndex, columnIndex) {
        this.rowIndex = rowIndex;
        this.columnIndex = columnIndex;
    }

    public isValid() {
        return !isNaN(this.rowIndex) && !isNaN(this.columnIndex);
    }

    public equals(cursor) {
        if (!this.isValid() && !cursor.isValid()) {
            return true;
        }

        return this.rowIndex == cursor.rowIndex && this.columnIndex == cursor.columnIndex;
    }
}

