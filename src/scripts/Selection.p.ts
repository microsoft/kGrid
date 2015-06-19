export class Selection {
    public disposer;
    private _options;
    private _updaters;
    private _events;

    constructor(selectionMode: SelectionMode = SelectionMode.SingleRow) {
        this.disposer = new Fundamental.Disposer();
        this._options = new Fundamental.PropertyBag({
            ranges: [],
            rowCount: 0,
            columnCount: 0,
            selectionMode: selectionMode,
            cursor: Position.Null,
        });
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
        return this._options.ranges;
    }

    public rowCount() {
        return this._options.$property({
            name: 'rowCount',
            args: arguments,
            afterChange: () => {
                this._options.ranges = this._normalize(this._options.ranges);

                if (!this._options.ranges) {
                    this._options.ranges = [];
                }

                this._options.cursor = this._normalizeCursor(this._options.cursor);
                this._ensureSingleSelection();
                this._updaters.update();
            },
        });
    }

    public columnCount() {
        return this._options.$property({
            name: 'columnCount',
            args: arguments,
            afterChange: () => {
                this._options.ranges = this._normalize(this._options.ranges);

                if (!this._options.ranges) {
                    this._options.ranges = [];
                }

                this._options.cursor = this._normalizeCursor(this._options.cursor);
                this._ensureSingleSelection();
                this._updaters.update();
            },
        });
    }

    public cursor() {
        return this._options.$property({
            name: 'cursor',
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
        return this.rangeOfPosition(this._options.cursor);
    }

    public rangeOfPosition(position) {
        for (var index = 0; index < this._options.ranges.length; index++) {
            var range = this._options.ranges[index];

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
        if (!this._options.cursor.isValid() || this._options.rowCount == 0 || this._options.columnCount == 0) {
            return Position.Null;
        }

        var rowIndex = this._options.cursor.rowIndex, columnIndex = this._options.cursor.columnIndex;

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
                columnIndex = this._options.columnCount - 1;
                break;

            case CursorMovement.PageUp:
                break;

            case CursorMovement.PageDown:
                break;

            case CursorMovement.Top:
                rowIndex = 0;
                break;

            case CursorMovement.Bottom:
                rowIndex = this._options.rowCount - 1;
                break;

        }

        return this._normalizeCursor(new Position(rowIndex, columnIndex));
    }

    public remove(range: Range) {
        if (this._options.ranges.length == 0) {
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

        this._options.ranges.sort(Range.compare);
        this._updaters.update();
    }

    public insert(range: Range) {
        if (this._options.ranges.length == 0) {
            return;
        }

        if (!range.isValid()) {
            return;
        }

        switch (range.type()) {
            case RangeType.Row:
                if (range.top() <= this._options.rowCount) {
                    this._insertRows(range);
                }
                break;

            case RangeType.Column:
                if (range.front() <= this._options.columnCount) {
                    this._insertColumns(range);
                }
                break;
        }

        this._options.ranges.sort(Range.compare);
        this._updaters.update();
    }

    public deselect(range: Range) {
        if (this._options.selectionMode == SelectionMode.SingleRow ||
            this._options.selectionMode == SelectionMode.Cell) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'Deny to deselect in current mode, move cursor instead');
        }
        if (this._options.ranges.length == 0) {
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
                switch (this._options.ranges[0].type()) {
                    case RangeType.Row:
                        this._deselectRow(range);
                        break;

                    case RangeType.Column:
                        this._deselectColumn(range);
                        break;

                    case RangeType.Range:
                        for (var index = 0; index < this._options.ranges.length; index++) {
                            if (this._options.ranges[index].equals(range)) {
                                this._options.ranges.splice(index, 1);
                                return;
                            }
                        }
                        break;
                }
                break;
        }

        this._options.ranges.sort(Range.compare);
        this._updaters.update();
    }

    public select(range: Range, keepSelectedRanges = true) {
        if (this._options.selectionMode == SelectionMode.SingleRow ||
            this._options.selectionMode == SelectionMode.Cell) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'Deny to select in current mode, move cursor instead');
        }
        var ranges = this._normalize([range]);

        if (!ranges) {
            return;
        }

        range = ranges[0];

        if (!keepSelectedRanges) {
            this._options.ranges = [];
        }

        switch (this._options.selectionMode) {
            case SelectionMode.MultipleRows:
                if (range.type() != RangeType.Row) {
                    throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'invilidate range type [' + RangeType[range.type()]+ ']');
                }

                this._merge(range);
                break;

            case SelectionMode.Range:
                if (this._options.ranges.length == 0 || this._options.ranges[this._options.ranges.length - 1].type() != range.type() || range.type() == RangeType.Range) {
                    this._options.ranges = [range];
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

                this._options.ranges = [range];
                break;
        }

        this._options.ranges.sort(Range.compare);
        this._updaters.update();
    }

    public clear() {
        this._options.ranges = [];
        this._ensureSingleSelection();
        this._options.ranges.sort(Range.compare);
        this._updaters.update();
    }

    public selectionMode() {
        return this._options.$property({
            name: 'selectionMode',
            args: arguments,
            afterChange: () => this.clear()
        });
    }

    public rowSelected(rowIndex: number) {
        for (var i = 0; i < this._options.ranges.length; i++) {
            var range = this._options.ranges[i];

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
        var clonedObject = new Selection(this._options.selection);

        clonedObject._options.ranges = this._options.ranges.slice();
        clonedObject._options.rowCount = this._options.rowCount;
        clonedObject._options.columnCount = this._options.columnCount;
        clonedObject._options.selectionMode = this._options.selectionMode;
        return clonedObject;
    }

    private _removeRows(range) {
        if (this._options.ranges.length == 0) {
            return;
        }

        var removeTop = range.top(),
            removeBottom = range.bottom(),
            cursorRowIndex = this._options.cursor.rowIndex,
            result = [],
            count = removeBottom - removeTop + 1;


        if (this._options.ranges[0].type() == RangeType.Column) {
            this._options.rowCount -= count;
            return;
        }

        if (cursorRowIndex >= removeTop && cursorRowIndex <= removeBottom) {
            if (removeBottom == this._options.rowCount - 1) {
                this._options.cursor = new Position(removeTop - 1, this._options.cursor.columnIndex);
            } else {
                this._options.cursor = new Position(removeTop, this._options.cursor.columnIndex);
            }
        } else if (cursorRowIndex > removeBottom) {
            this._options.cursor = new Position(cursorRowIndex - count, this._options.cursor.columnIndex);
        }

        if (this._options.rowCount > count) {
            if (this._options.selectionMode == SelectionMode.MultipleRows
                || this._options.selectionMode == SelectionMode.Range) {
                for (var index = 0; index < this._options.ranges.length; index++) {
                    var range = this._options.ranges[index],
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

        this._options.ranges = result;
        this._ensureSingleSelection();
        this._options.rowCount -= count;
    }

    private _removeColumns(range) {
        if (this._options.ranges.length == 0) {
            return;
        }

        var removeFront = range.front(),
            removeEnd = range.end(),
            cursorColumnIndex = this._options.cursor.columnIndex,
            result = [],
            count = removeEnd - removeFront + 1;

        if (this._options.ranges[0].type() == RangeType.Row) {
            this._options.columnCount -= count;
            return;
        }

        if (cursorColumnIndex >= removeFront && cursorColumnIndex <= removeEnd) {
            if (removeEnd == this._options.columnCount - 1) {
                this._options.cursor = new Position(this._options.cursor.rowIndex, removeFront - 1);
            } else {
                this._options.cursor = new Position(this._options.cursor.rowIndex, removeFront);
            }
        } else if (cursorColumnIndex > removeEnd) {
            this._options.cursor = new Position(this._options.cursor.rowIndex, cursorColumnIndex - count);
        }

        if (this._options.rowCount > count) {
            if (this._options.selectionMode == SelectionMode.MultipleRows
                || this._options.selectionMode == SelectionMode.Range) {
                for (var index = 0; index < this._options.ranges.length; index++) {
                    var range = this._options.ranges[index],
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

        this._options.ranges = result;
        this._ensureSingleSelection();
        this._options.columnCount -= count;
    }

    private _insertRows(range) {
        if (this._options.ranges.length == 0) {
            return;
        }

        var insertTop = range.top(),
            insertBottom = range.bottom(),
            cursorRowIndex = this._options.cursor.rowIndex,
            result = [],
            count = insertBottom - insertTop + 1;

        this._options.rowCount += count;

        if (this._options.ranges[0].type() == RangeType.Column) {
            return;
        }

        if (cursorRowIndex >= insertTop) {
            this._options.cursor = new Position(cursorRowIndex + count, this._options.cursor.columnIndex);
        }

        if (this._options.rowCount > count) {
            if (this._options.selectionMode == SelectionMode.MultipleRows
                || this._options.selectionMode == SelectionMode.Range) {
                for (var index = 0; index < this._options.ranges.length; index++) {
                    var range = this._options.ranges[index],
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

        this._options.ranges = result;
        this._ensureSingleSelection();
    }

    private _insertColumns(range) {
        if (this._options.ranges.length == 0) {
            return;
        }

        var insertFront = range.front(),
            insertEnd = range.end(),
            cursorColumnIndex = this._options.cursor.columnIndex,
            result = [],
            count = insertEnd - insertFront + 1;

        this._options.columnCount += count;

        if (this._options.ranges[0].type() == RangeType.Row) {
            return;
        }

        if (cursorColumnIndex >= insertFront) {
            this._options.cursor = new Position(this._options.cursor.rowIndex, cursorColumnIndex + count);
        }

        if (this._options.columnCount > count) {
            if (this._options.selectionMode == SelectionMode.MultipleRows
                || this._options.selectionMode == SelectionMode.Range) {
                for (var index = 0; index < this._options.ranges.length; index++) {
                    var range = this._options.ranges[index],
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

        this._options.ranges = result;
        this._ensureSingleSelection();
    }

    private _deselectRow(range) {
        if (range.type() != RangeType.Row) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'cannot deselect range with type [' + RangeType[range.type()] + ']');
        }

        var result = [],
            deselectTop = range.top(),
            deselectBottom = range.bottom();

        for (var index = 0; index < this._options.ranges.length; index++) {
            var range = this._options.ranges[index],
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

        this._options.ranges = result;
    }

    private _deselectColumn(range) {
        if (range.type() != RangeType.Column) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Selection', 'cannot deselect range with type [' + RangeType[range.type()] + ']');
        }

        var result = [],
            deselectFront = range.front(),
            deselectEnd = range.end();

        for (var index = 0; index < this._options.ranges.length; index++) {
            var range = this._options.ranges[index],
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

        this._options.ranges = result;
    }

    private _normalizeCursor(cursor) {
        if (this._options.rowCount == 0 || this._options.columnCount == 0) {
            return Position.Null;
        }

        if (cursor.rowIndex < this._options.rowCount && cursor.columnCount < this._options.columnCount) {
            return cursor;
        }

        var rowIndex = cursor.rowIndex >= 0 && !isNaN(cursor.rowIndex) ? cursor.rowIndex : 0,
            columnIndex = cursor.columnIndex >= 0 && !isNaN(cursor.columnIndex) ? cursor.columnIndex : 0;

        return new Position(Math.min(rowIndex, this._options.rowCount - 1), Math.min(columnIndex, this._options.columnCount - 1));
    }

    private _normalize(ranges: Range[]) {
        if (this._options.rowCount == 0 || this._options.columnCount == 0) {
            return;
        }

        var result = [];

        for (var index = 0; index < ranges.length; index++) {
            var range = ranges[index];

            switch (range.type()) {
                case RangeType.Row:
                    if (range.top() >= this._options.rowCount) {
                        continue;
                    } else if (range.bottom() < this._options.rowCount) {
                        result.push(range);
                    } else {
                        result.push(new Range(RangeType.Row, range.top(), this._options.rowCount - 1, NaN, NaN));
                    }
                    break;

                case RangeType.Column:
                    if (range.front() >= this._options.columnCount) {
                        continue;
                    } else if (range.end() < this._options.columnCount) {
                        result.push(range);
                    } else {
                        result.push(new Range(RangeType.Column, NaN, NaN, range.front(), this._options.columnCount - 1));
                    }
                    break;

                case RangeType.Range:
                    if (range.top() >= this._options.rowCount || range.front() >= this._options.columnCount) {
                        continue;
                    } else if (range.bottom() < this._options.rowCount && range.end() < this._options.columnCount) {
                        result.push(range);
                    } else {
                        result.push(
                            new Range(
                                RangeType.Range,
                                range.top(),
                                Math.min(range.bottom(), this._options.rowCount - 1),
                                range.front(),
                                Math.min(range.end(), this._options.columnCount - 1)));
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

            for (var i = 0; i < this._options.ranges.length; i++) {
                var union = Range.union(this._options.ranges[i], range);

                if (union) {
                    this._options.ranges.splice(i, 1);
                    range = union;
                    merged = true;
                    break;
                }
            }
        }

        this._options.ranges.push(range);
    }

    private _ensureSingleSelection() {
        if (this._options.selectionMode == SelectionMode.SingleRow) {
            if (this._options.cursor.isValid()) {
                this._options.ranges = [new Range(RangeType.Row, this._options.cursor.rowIndex, this._options.cursor.rowIndex, NaN, NaN)];
            } else {
                this._options.ranges = [Range.Null];
            }
        } else if (this._options.selectionMode == SelectionMode.Cell) {
            if (this._options.cursor.isValid()) {
                this._options.ranges = [new Range(RangeType.Range, this._options.cursor.rowIndex, this._options.cursor.rowIndex, this._options.cursor.columnIndex, this._options.cursor.columnIndex)];
            } else {
                this._options.ranges = [Range.Null];
            }
        }
    }

    private _getSelectionChangeUpdater() {
        return new Microsoft.Office.Controls.Fundamental.Updater(
            () => {
                return this._options.ranges;
            },
            (newValue, oldValue) => {
                this._events.emit('selectionChange', this, { oldValue: oldValue, newValue: newValue });
            });
    }

    private _getCursorChangeUpdater() {
        return new Microsoft.Office.Controls.Fundamental.Updater(
            () => {
                return this._options.cursor;
            },
            (newValue, oldValue) => {
                this._events.emit('cursorChange', this, { oldValue: oldValue, newValue: newValue });
            });
    }
}

