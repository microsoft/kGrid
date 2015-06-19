export class Range {
    public static Null = new Range(RangeType.Range, NaN, NaN, NaN, NaN);
    private _options;

    constructor(type: RangeType, top, bottom, front, end) {
        if (isNaN(top) || isNaN(bottom) || type == RangeType.Column) {
            top = bottom = NaN;
        } else if (bottom < top) {
            var t = bottom;

            bottom = top;
            top = t;
        }

        if (top < 0) {
            top = bottom = NaN;
        }

        if (isNaN(front) || isNaN(end) || type == RangeType.Row) {
            front = end = NaN;
        } else if (end < front) {
            var f = end;

            end = front;
            front = f;
        }

        if (front < 0) {
            front = end = NaN;
        }

        if (type == RangeType.Range) {
            if (isNaN(front) || isNaN(top)) {
                front = end = top = bottom = NaN;
            }
        }

        this._options = {
            type: type,
            top: top,
            bottom: bottom,
            front: front,
            end: end,
        };
    }

    public isValid() {
        return !isNaN(this.top()) || !isNaN(this.front());
    }

    public type() {
        return this._options.type;
    }

    public top() {
        return this._options.top;
    }

    public bottom() {
        return this._options.bottom;
    }

    public front() {
        return this._options.front;
    }

    public end() {
        return this._options.end;
    }

    public rowCount() {
        if (this._options.type == RangeType.Column) {
            return NaN;
        }
        return this._options.bottom - this._options.top + 1;
    }

    public columnCount() {
        if (this._options.type == RangeType.Row) {
            return NaN;
        }
        return this._options.end - this._options.front + 1;
    }

    public equals(range) {
        if (!range) {
            return false;
        }

        if (!!this.isValid() != !!range.isValid()) {
            return false;
        }

        if (this._options.type != range._options.type) {
            return false;
        }

        return this._options.top == range._options.top
            && this._options.bottom == range._options.bottom
            && this._options.front == range._options.front
            && this._options.end == range._options.end;
    }

    public static compare(range0, range1) {
        switch (range0.type()) {
            case RangeType.Row:
                return Microsoft.Office.Controls.Fundamental.Calculator.compareValueArray([range0.type(), range0.top(), range0.bottom()], [range1.type(), range1.top(), range1.bottom()]);

            case RangeType.Column:
                return Microsoft.Office.Controls.Fundamental.Calculator.compareValueArray([range0.type(), range0.front(), range0.end()], [range1.type(), range1.front(), range1.end()]);

            case RangeType.Range:
                return Microsoft.Office.Controls.Fundamental.Calculator.compareValueArray([range0.type(), range0.top(), range0.front(), range0.bottom(), range0.end()], [range1.type(), range0.top(), range1.front(), range1.bottom(), range1.end()]);
        }
    }

    public static intersection(range0, range1) {
        var type0 = range0.type(),
            type1 = range1.type();

        if (type0 == type1 ) {
            if (type0 == RangeType.Row) {
                var intersection = Microsoft.Office.Controls.Fundamental.Calculator.intersection(range0.top(), range0.bottom(), range1.top(), range1.bottom());

                if (intersection) {
                    return new Range(RangeType.Row, intersection.lower, intersection.upper, NaN, NaN);
                }
            } else if (type0 == RangeType.Column) {
                var intersection = Microsoft.Office.Controls.Fundamental.Calculator.intersection(range0.front(), range0.end(), range1.front(), range1.end());

                if (intersection) {
                    return new Range(RangeType.Column, NaN, NaN, intersection.lower, intersection.upper);
                }
            } else if (type0 == RangeType.Range) {
                var intersectionRow = Microsoft.Office.Controls.Fundamental.Calculator.intersection(range0.top(), range0.bottom(), range1.top(), range1.bottom());
                var intersectionColumn = Microsoft.Office.Controls.Fundamental.Calculator.intersection(range0.front(), range0.end(), range1.front(), range1.end());

                if (intersectionRow && intersectionColumn) {
                    return new Range(RangeType.Range, intersectionRow.lower, intersectionRow.upper, intersectionColumn.lower, intersectionColumn.upper);
                }
            }
        } else if (type0 == RangeType.Range || type1 == RangeType.Range) {
            if (type0 == RangeType.Range) {
                var r = range0, range0 = range1, range1 = r,
                    t = type0, type0 = type1, type1 = t;
            }

            if (type0 == RangeType.Row) {
                var intersection = Microsoft.Office.Controls.Fundamental.Calculator.intersection(range0.top(), range0.bottom(), range1.top(), range1.bottom());

                if (intersection) {
                    return new Range(RangeType.Range, intersection.lower, intersection.upper, range1.front(), range1.end());
                }
            } else {
                var intersection = Microsoft.Office.Controls.Fundamental.Calculator.intersection(range0.front(), range0.end(), range1.front(), range1.end());

                if (intersection) {
                    return new Range(RangeType.Range, range1.top(), range1.bottom(), intersection.lower, intersection.upper);
                }
            }
        }
    }

    public static union(range0, range1) {
        var type0 = range0.type(),
            type1 = range1.type();

        if (type0 == type1 ) {
            if (type0 == RangeType.Row) {
                var union = Microsoft.Office.Controls.Fundamental.Calculator.union(range0.top(), range0.bottom() + 1, range1.top(), range1.bottom() + 1);

                if (union) {
                    return new Range(RangeType.Row, union.lower, union.upper - 1, NaN, NaN);
                }
            } else if (type0 == RangeType.Column) {
                var union = Microsoft.Office.Controls.Fundamental.Calculator.union(range0.front(), range0.end() + 1, range1.front(), range1.end() + 1);

                if (union) {
                    return new Range(RangeType.Column, NaN, NaN, union.lower, union.upper - 1);
                }
            }
        }
    }

    public static moveInto(restriction, range) {
    }
}

