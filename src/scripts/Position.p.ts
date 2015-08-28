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

    public equals(position) {
        if (!this.isValid() && !position.isValid()) {
            return true;
        }

        return this.rowIndex == position.rowIndex && this.columnIndex == position.columnIndex;
    }
}

