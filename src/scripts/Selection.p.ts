export class Selection {
    public disposer;
    private _updaters;
    private _events;
    private _ranges;
    private _rowCount;
    private _columnCount;
    private _selectionMode;
    private _cursor;

    constructor(selectionMode: SelectionMode = SelectionMode.SingleRow) {
        this.disposer = new Fundamental.Disposer();
        this._ranges = [];
        this._rowCount = 0;
        this._columnCount = 0;
        this._selectionMode = selectionMode;
        this._cursor = Position.Null;
        this.disposer.addDisposable(this._events = new Fundamental.EventSite());
        this.disposer.addDisposable(this._updaters = new Microsoft.Office.Controls.Fundamental.UpdaterGroup());
        this._updaters.add(this._getSelectionChangeUpdater());
        this._updaters.add(this._getCursorChangeUpdater());
        this._updaters.update();
    }

    public dispose() {
        this.disposer.dispose();
    }

    public on() {
        return this._events.on.apply(this._events, arguments);
    }

    public off() {
        return this._events.off.apply(this._events, arguments);
    }

    public ranges() {
        return this._ranges;
    }

    public rowCount() {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_rowCount',
            args: arguments,
            afterChange: () => {
                this._ranges = this._normalize(this._ranges);

                if (!this._ranges) {
                    this._ranges = [];
                }

                this._cursor = this._normalizeCursor(this._cursor);
                this._ensureSingleSelection();
                this._updaters.update();
            },
        });
    }

    public columnCount() {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_columnCount',
            args: arguments,
            afterChange: () => {
                this._ranges = this._normalize(this._ranges);

                if (!this._ranges) {
                    this._ranges = [];
                }

                this._cursor = this._normalizeCursor(this._cursor);
                this._ensureSingleSelection();
                this._updaters.update();
            },
        });
    }

    public cursor() {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_cursor',
            args: arguments,
            beforeChange: (sender, args) => {
                args.newValue = this._normalizeCursor(args.newValue);

                if (args.newValue.equals(args.oldValue)) {
                    args.cancel = true;
                }
            },
            afterChange: () => {
                this._ensureSingleSelection();
                this._updaters.update();
            },
        });
    }

    public rangeOfCursor() {
        return this.rangeOfPosition(this._cursor);
    }

    public rangeOfPosition(position) {
        for (var index = 0; index < this._ranges.length; index++) {
            var range = this._ranges[index];

            switch (range.type()) {
                case RangeType.Row:
                    if (position.rowIndex >= range.top()
                        && position.rowIndex <= range.bottom()) {
                        return range;
                    }
                    break;

                case RangeType.Column:
                    if (position.columnIndex >= range.front()
                        && position.columnIndex <= range.end()) {
                        return range;
                    }
                    break;

                case RangeType.Range:
                    if (position.rowIndex >= range.top()
                        && position.rowIndex <= range.bottom()
                        && position.columnIndex >= range.front()
                        && position.columnIndex <= range.end()) {
                        return range;
                    }
                    break;
            }
        }
    }

    public moveCursor(cursorMovement: CursorMovement, pageRange?: Range) {
        if (!this._cursor.isValid() || this._rowCount == 0 || this._columnCount == 0) {
            return Position.Null;
        }

        var rowIndex = this._cursor.rowIndex, columnIndex = this._cursor.columnIndex;

        switch (cursorMovement) {
            case CursorMovement.Forward:
                columnIndex++;
                break;

            case CursorMovement.Backward:
                columnIndex--;
                break;

            case CursorMovement.Up:
                rowIndex--;
                break;

            case CursorMovement.Down:
                rowIndex++
                break;

            case CursorMovement.LineFirst:
                columnIndex = 0;
                break;

            case CursorMovement.LineEnd:
                columnIndex = this._columnCount - 1;
                break;

            case CursorMovement.PageUp:
                break;

            case CursorMovement.PageDown:
                break;

            case CursorMovement.Top:
                rowIndex = 0;
                break;

            case CursorMovement.Bottom:
                rowIndex = this._rowCount - 1;
                break;

        }

        return this._normalizeCursor(new Position(rowIndex, columnIndex));
    }

    public remove(range: Range) {
        if (this._ranges.length == 0) {
            return;
        }

        var ranges = this._normalize([range]);

        if (!ranges) {
            return;
        }

        range = ranges[0];

        switch (range.type()) {
            case RangeType.Row:
                this._removeRows(range);
                break;

            case RangeType.Column:
                this._removeColumns(range);
                break;
        }

        this._ranges.sort(Range.compare);
        this._updaters.update();
    }

    public insert(range: Range) {
        if (this._ranges.length == 0) {
            return;
        }

        if (!range.isValid()) {
            return;
        }

        switch (range.type()) {
            case RangeType.Row:
                if (range.top() <= this._rowCount) {
                    this._insertRows(range);
                }
                break;

            case RangeType.Column:
                if (range.front() <= this._columnCount) {
                    this._insertColumns(range);
                }
                break;
        }

        this._ranges.sort(Range.compare);
        this._updaters.update();
    }

    public deselect(range: Range) {
        if (this._selectionMode == SelectionMode.SingleRow ||
            this._selectionMode == SelectionMode.Cell) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'Deny to deselect in current mode, move cursor instead');
        }
        if (this._ranges.length == 0) {
            return;
        }

        var ranges = this._normalize([range]);

        if (!ranges) {
            return;
        }

        range = ranges[0];

        switch (range.type()) {
            case RangeType.Row:
                this._deselectRow(range);
                break;

            case RangeType.Column:
                this._deselectColumn(range);
                break;

            case RangeType.Range:
                switch (this._ranges[0].type()) {
                    case RangeType.Row:
                        this._deselectRow(range);
                        break;

                    case RangeType.Column:
                        this._deselectColumn(range);
                        break;

                    case RangeType.Range:
                        for (var index = 0; index < this._ranges.length; index++) {
                            if (this._ranges[index].equals(range)) {
                                this._ranges.splice(index, 1);
                                return;
                            }
                        }
                        break;
                }
                break;
        }

        this._ranges.sort(Range.compare);
        this._updaters.update();
    }

    public select(range: Range, keepSelectedRanges = true) {
        if (this._selectionMode == SelectionMode.SingleRow ||
            this._selectionMode == SelectionMode.Cell) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'Deny to select in current mode, move cursor instead');
        }
        var ranges = this._normalize([range]);

        if (!ranges) {
            return;
        }

        range = ranges[0];

        if (!keepSelectedRanges) {
            this._ranges = [];
        }

        switch (this._selectionMode) {
            case SelectionMode.MultipleRows:
                if (range.type() != RangeType.Row) {
                    throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'invilidate range type [' + RangeType[range.type()]+ ']');
                }

                this._merge(range);
                break;

            case SelectionMode.Range:
                if (this._ranges.length == 0 || this._ranges[this._ranges.length - 1].type() != range.type() || range.type() == RangeType.Range) {
                    this._ranges = [range];
                } else {
                    this._merge(range);
                }
                break;

            case SelectionMode.Cell:
                if (range.type() != RangeType.Range) {
                    throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'invilidate range type [' + RangeType[range.type()]+ ']');
                }

                if (range.rowCount() != 1 || range.columnCount() != 1) {
                    throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'cannot select more than 1 cell');
                }

                this._ranges = [range];
                break;
        }

        this._ranges.sort(Range.compare);
        this._updaters.update();
    }

    public clear() {
        this._ranges = [];
        this._ensureSingleSelection();
        this._ranges.sort(Range.compare);
        this._updaters.update();
    }

    public selectionMode() {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_selectionMode',
            args: arguments,
            afterChange: () => this.clear()
        });
    }

    public rowSelected(rowIndex: number) {
        for (var i = 0; i < this._ranges.length; i++) {
            var range = this._ranges[i];

            if (range.type() != RangeType.Row) {
                return false;
            }

            if (range.top() <= rowIndex && range.bottom() >= rowIndex) {
                return true;
            }
        };

        return false;
    }

    public clone() {
        var clonedObject = new Selection(this._selectionMode);

        clonedObject._ranges = this._ranges.slice();
        clonedObject._rowCount = this._rowCount;
        clonedObject._columnCount = this._columnCount;
        return clonedObject;
    }

    private _removeRows(range) {
        if (this._ranges.length == 0) {
            return;
        }

        var removeTop = range.top(),
            removeBottom = range.bottom(),
            cursorRowIndex = this._cursor.rowIndex,
            result = [],
            count = removeBottom - removeTop + 1;


        if (this._ranges[0].type() == RangeType.Column) {
            this._rowCount -= count;
            return;
        }

        if (cursorRowIndex >= removeTop && cursorRowIndex <= removeBottom) {
            if (removeBottom == this._rowCount - 1) {
                this._cursor = new Position(removeTop - 1, this._cursor.columnIndex);
            } else {
                this._cursor = new Position(removeTop, this._cursor.columnIndex);
            }
        } else if (cursorRowIndex > removeBottom) {
            this._cursor = new Position(cursorRowIndex - count, this._cursor.columnIndex);
        }

        if (this._rowCount > count) {
            if (this._selectionMode == SelectionMode.MultipleRows
                || this._selectionMode == SelectionMode.Range) {
                for (var index = 0; index < this._ranges.length; index++) {
                    var range = this._ranges[index],
                        rangeTop = range.top(),
                        rangeBottom = range.bottom();

                    if (rangeBottom < removeTop) {
                        result.push(range);
                    } else if (rangeTop > removeBottom) {
                        result.push(new Range(range.type(), rangeTop - count, rangeBottom - count, range.front(), range.end()));
                    } else if (rangeTop >= removeTop && rangeBottom <= removeBottom) {
                        continue;
                    } else if (rangeTop < removeTop && rangeBottom > removeBottom) {
                        result.push(new Range(range.type(), rangeTop, rangeBottom - count, range.front(), range.end()));
                    } else if (rangeTop < removeTop) {
                        result.push(new Range(range.type(), rangeTop, removeTop - 1, range.front(), range.end()));
                    } else if (rangeBottom > removeBottom) {
                        result.push(new Range(range.type(), removeTop, rangeBottom - count, range.front(), range.end()));
                    } else {
                        throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'error code path');
                    }
                }
            }
        }

        this._ranges = result;
        this._ensureSingleSelection();
        this._rowCount -= count;
    }

    private _removeColumns(range) {
        if (this._ranges.length == 0) {
            return;
        }

        var removeFront = range.front(),
            removeEnd = range.end(),
            cursorColumnIndex = this._cursor.columnIndex,
            result = [],
            count = removeEnd - removeFront + 1;

        if (this._ranges[0].type() == RangeType.Row) {
            this._columnCount -= count;
            return;
        }

        if (cursorColumnIndex >= removeFront && cursorColumnIndex <= removeEnd) {
            if (removeEnd == this._columnCount - 1) {
                this._cursor = new Position(this._cursor.rowIndex, removeFront - 1);
            } else {
                this._cursor = new Position(this._cursor.rowIndex, removeFront);
            }
        } else if (cursorColumnIndex > removeEnd) {
            this._cursor = new Position(this._cursor.rowIndex, cursorColumnIndex - count);
        }

        if (this._rowCount > count) {
            if (this._selectionMode == SelectionMode.MultipleRows
                || this._selectionMode == SelectionMode.Range) {
                for (var index = 0; index < this._ranges.length; index++) {
                    var range = this._ranges[index],
                        rangeFront = range.front(),
                        rangeEnd = range.end();

                    if (rangeEnd < removeFront) {
                        result.push(range);
                    } else if (rangeFront > removeEnd) {
                        result.push(new Range(range.type(), range.top(), range.bottom(), rangeFront - count, rangeEnd - count));
                    } else if (rangeFront >= removeFront && rangeEnd <= removeEnd) {
                        continue;
                    } else if (rangeFront < removeFront && rangeEnd > removeEnd) {
                        result.push(new Range(range.type(), range.top(), range.bottom(), rangeFront, rangeEnd - count));
                    } else if (rangeFront < removeFront) {
                        result.push(new Range(range.type(), range.top(), range.bottom(), rangeFront, removeFront - 1));
                    } else if (rangeEnd > removeEnd) {
                        result.push(new Range(range.type(), range.top(), range.bottom(), removeEnd + 1, rangeEnd));
                    } else {
                        throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'error code path');
                    }
                }
            }
        }

        this._ranges = result;
        this._ensureSingleSelection();
        this._columnCount -= count;
    }

    private _insertRows(range) {
        if (this._ranges.length == 0) {
            return;
        }

        var insertTop = range.top(),
            insertBottom = range.bottom(),
            cursorRowIndex = this._cursor.rowIndex,
            result = [],
            count = insertBottom - insertTop + 1;

        this._rowCount += count;

        if (this._ranges[0].type() == RangeType.Column) {
            return;
        }

        if (cursorRowIndex >= insertTop) {
            this._cursor = new Position(cursorRowIndex + count, this._cursor.columnIndex);
        }

        if (this._rowCount > count) {
            if (this._selectionMode == SelectionMode.MultipleRows
                || this._selectionMode == SelectionMode.Range) {
                for (var index = 0; index < this._ranges.length; index++) {
                    var range = this._ranges[index],
                        rangeTop = range.top(),
                        rangeBottom = range.bottom();

                    if (rangeBottom < insertTop) {
                        result.push(range);
                    } else if (rangeTop >= insertTop) {
                        result.push(new Range(RangeType.Row, rangeTop + count, rangeBottom + count, range.front(), range.end()));
                    } else if (rangeTop < insertTop && rangeBottom >= insertTop) {
                        result.push(new Range(RangeType.Row, rangeTop, rangeBottom + count, range.front(), range.end()));
                    } else {
                        throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'error code path');
                    }
                }
            }
        }

        this._ranges = result;
        this._ensureSingleSelection();
    }

    private _insertColumns(range) {
        if (this._ranges.length == 0) {
            return;
        }

        var insertFront = range.front(),
            insertEnd = range.end(),
            cursorColumnIndex = this._cursor.columnIndex,
            result = [],
            count = insertEnd - insertFront + 1;

        this._columnCount += count;

        if (this._ranges[0].type() == RangeType.Row) {
            return;
        }

        if (cursorColumnIndex >= insertFront) {
            this._cursor = new Position(this._cursor.rowIndex, cursorColumnIndex + count);
        }

        if (this._columnCount > count) {
            if (this._selectionMode == SelectionMode.MultipleRows
                || this._selectionMode == SelectionMode.Range) {
                for (var index = 0; index < this._ranges.length; index++) {
                    var range = this._ranges[index],
                        rangeFront = range.front(),
                        rangeEnd = range.end();

                    if (rangeEnd < insertFront) {
                        result.push(range);
                    } else if (rangeFront >= insertFront) {
                        result.push(new Range(RangeType.Column, range.top(), range.bottom(), rangeFront + count, rangeEnd + count));
                    } else if (rangeFront < insertFront && rangeEnd >= insertFront) {
                        result.push(new Range(RangeType.Column, range.top(), range.bottom(), rangeFront, rangeEnd + count));
                    } else {
                        throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'error code path');
                    }
                }
            }
        }

        this._ranges = result;
        this._ensureSingleSelection();
    }

    private _deselectRow(range) {
        if (range.type() != RangeType.Row) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'cannot deselect range with type [' + RangeType[range.type()] + ']');
        }

        var result = [],
            deselectTop = range.top(),
            deselectBottom = range.bottom();

        for (var index = 0; index < this._ranges.length; index++) {
            var range = this._ranges[index],
                rangeTop = range.top(),
                rangeBottom = range.bottom();

            if (rangeTop > deselectBottom || rangeBottom < deselectTop) {
                result.push(range);
                continue;
            } else if (rangeTop >= deselectTop && rangeBottom <= deselectBottom) {
                continue;
            } else if (rangeTop < deselectTop && rangeBottom > deselectBottom) {
                result.push(new Range(RangeType.Row, rangeTop, deselectTop - 1, NaN, NaN));
                result.push(new Range(RangeType.Row, deselectBottom + 1, rangeBottom, NaN, NaN));
            } else if (rangeTop < deselectTop) {
                result.push(new Range(RangeType.Row, rangeTop, deselectTop - 1, NaN, NaN));
            } else if (rangeBottom > deselectBottom) {
                result.push(new Range(RangeType.Row, deselectBottom + 1, rangeBottom, NaN, NaN));
            } else {
                throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'error code path');
            }
        }

        this._ranges = result;
    }

    private _deselectColumn(range) {
        if (range.type() != RangeType.Column) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'cannot deselect range with type [' + RangeType[range.type()] + ']');
        }

        var result = [],
            deselectFront = range.front(),
            deselectEnd = range.end();

        for (var index = 0; index < this._ranges.length; index++) {
            var range = this._ranges[index],
                rangeFront = range.front(),
                rangeEnd = range.end();

            if (rangeFront > deselectFront || rangeEnd < deselectEnd) {
                result.push(range);
                continue;
            } else if (rangeFront >= deselectFront && rangeEnd <= deselectEnd) {
                continue;
            } else if (rangeFront < deselectFront && rangeEnd > deselectEnd) {
                result.push(new Range(RangeType.Column, NaN, NaN, rangeFront, deselectFront - 1));
                result.push(new Range(RangeType.Column, NaN, NaN, deselectEnd + 1, rangeEnd));
            } else if (rangeFront < deselectFront) {
                result.push(new Range(RangeType.Column, NaN, NaN, rangeFront, deselectFront - 1));
            } else if (rangeEnd > deselectEnd) {
                result.push(new Range(RangeType.Column, NaN, NaN, deselectEnd + 1, rangeEnd));
            } else {
                throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'error code path');
            }
        }

        this._ranges = result;
    }

    private _normalizeCursor(cursor) {
        if (this._rowCount == 0 || this._columnCount == 0) {
            return Position.Null;
        }

        if (cursor.rowIndex < this._rowCount && cursor.columnCount < this._columnCount) {
            return cursor;
        }

        var rowIndex = cursor.rowIndex >= 0 && !isNaN(cursor.rowIndex) ? cursor.rowIndex : 0,
            columnIndex = cursor.columnIndex >= 0 && !isNaN(cursor.columnIndex) ? cursor.columnIndex : 0;

        return new Position(Math.min(rowIndex, this._rowCount - 1), Math.min(columnIndex, this._columnCount - 1));
    }

    private _normalize(ranges: Range[]) {
        if (this._rowCount == 0 || this._columnCount == 0) {
            return;
        }

        var result = [];

        for (var index = 0; index < ranges.length; index++) {
            var range = ranges[index];

            switch (range.type()) {
                case RangeType.Row:
                    if (range.top() >= this._rowCount) {
                        continue;
                    } else if (range.bottom() < this._rowCount) {
                        result.push(range);
                    } else {
                        result.push(new Range(RangeType.Row, range.top(), this._rowCount - 1, NaN, NaN));
                    }
                    break;

                case RangeType.Column:
                    if (range.front() >= this._columnCount) {
                        continue;
                    } else if (range.end() < this._columnCount) {
                        result.push(range);
                    } else {
                        result.push(new Range(RangeType.Column, NaN, NaN, range.front(), this._columnCount - 1));
                    }
                    break;

                case RangeType.Range:
                    if (range.top() >= this._rowCount || range.front() >= this._columnCount) {
                        continue;
                    } else if (range.bottom() < this._rowCount && range.end() < this._columnCount) {
                        result.push(range);
                    } else {
                        result.push(
                            new Range(
                                RangeType.Range,
                                range.top(),
                                Math.min(range.bottom(), this._rowCount - 1),
                                range.front(),
                                Math.min(range.end(), this._columnCount - 1)));
                    }
                    break;
            }
        }
        return result.length ? result : null;
    }

    private _merge(range: Range) {
        var merged = true;

        while (merged) {
            merged = false;

            for (var i = 0; i < this._ranges.length; i++) {
                var union = Range.union(this._ranges[i], range);

                if (union) {
                    this._ranges.splice(i, 1);
                    range = union;
                    merged = true;
                    break;
                }
            }
        }

        this._ranges.push(range);
    }

    private _ensureSingleSelection() {
        if (this._selectionMode == SelectionMode.SingleRow) {
            if (this._cursor.isValid()) {
                this._ranges = [new Range(RangeType.Row, this._cursor.rowIndex, this._cursor.rowIndex, NaN, NaN)];
            } else {
                this._ranges = [Range.Null];
            }
        } else if (this._selectionMode == SelectionMode.Cell) {
            if (this._cursor.isValid()) {
                this._ranges = [new Range(RangeType.Range, this._cursor.rowIndex, this._cursor.rowIndex, this._cursor.columnIndex, this._cursor.columnIndex)];
            } else {
                this._ranges = [Range.Null];
            }
        }
    }

    private _getSelectionChangeUpdater() {
        return new Microsoft.Office.Controls.Fundamental.Updater(
            () => {
                return this._ranges;
            },
            (newValue, oldValue) => {
                this._events.emit('selectionChange', this, { oldValue: oldValue, newValue: newValue });
            });
    }

    private _getCursorChangeUpdater() {
        return new Microsoft.Office.Controls.Fundamental.Updater(
            () => {
                return this._cursor;
            },
            (newValue, oldValue) => {
                this._events.emit('cursorChange', this, { oldValue: oldValue, newValue: newValue });
            });
    }
}

