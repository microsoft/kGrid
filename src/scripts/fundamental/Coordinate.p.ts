// Viewport: the coordinate is the offset between the point and the front top conner of document, rtl is taken into account
// ViewportRelative: the coordinate is the offset between two points, rtl is taken into account
export enum CoordinateType {
    Viewport,
    ViewportRelative,
}

export class Coordinate {
    private _options;

    public constructor(type: CoordinateType, x, y, rtl: boolean = false, width?) {
        type = parseInt(<any>type);
        x = parseFloat(x);
        y = parseFloat(y);
        width = parseFloat(width);
        rtl = !!rtl;

        if (Fundamental.CoordinateType[type] == undefined) {
            throw createError(0, 'Coordinate', 'type must be a value of CoordinateType');
        }

        if (!isNaN(width) && width < 0) {
            throw createError('0', 'Coordinate', 'width must be greater or equal than zero');
        }

        this._options = new Fundamental.PropertyBag({
            type: type,
            x: x,
            y: y,
            width: width,
            rtl: rtl,
        });
    }

    private static _addViewportByViewportRelative(left: Coordinate, right: Coordinate) {
        var xOffset = right._options.x, yOffset = right._options.y;

        if (left._options.rtl != right._options.rtl) {
            xOffset = -xOffset;
        }

        var x = left._options.x + xOffset,
            y = left._options.y + yOffset,
            rtl = left._options.rtl,
            width = left._options.width;

        return new Coordinate(CoordinateType.Viewport, x, y, rtl, width);
    }

    private static _addViewportRelativeByViewportRelative(left: Coordinate, right: Coordinate) {
        var xOffset = right._options.x, yOffset = right._options.y;

        if (left._options.rtl != right._options.rtl) {
            xOffset = -xOffset;
        }

        var x = left._options.x + xOffset,
            y = left._options.y + yOffset,
            rtl = left._options.rtl;

        return new Coordinate(CoordinateType.ViewportRelative, x, y, rtl, NaN);
    }

    private static _minusViewportByViewportRelative(left: Coordinate, right: Coordinate) {
        var xOffset = right._options.x, yOffset = right._options.y;

        if (left._options.rtl != right._options.rtl) {
            xOffset = -xOffset;
        }

        var x = left._options.x - xOffset,
            y = left._options.y - yOffset,
            rtl = left._options.rtl,
            width = left._options.width;

        return new Coordinate(CoordinateType.Viewport, x, y, rtl, width);
    }

    private static _minusViewportRelativeByViewportRelative(left: Coordinate, right: Coordinate) {
        var xOffset = right._options.x, yOffset = right._options.y;

        if (left._options.rtl != right._options.rtl) {
            xOffset = -xOffset;
        }

        var x = left._options.x - xOffset,
            y = left._options.y - yOffset,
            rtl = left._options.rtl;

        return new Coordinate(CoordinateType.ViewportRelative, x, y, rtl, NaN);
    }

    private static _minusViewportByViewport(left: Coordinate, right: Coordinate) {
        if (left._options.rtl != right._options.rtl && left._options.width != right._options.width) {
            throw createError(0, 'Coordinate', 'width does not match');
        }

        var xOffset = right._options.x, yOffset = right._options.y;

        if (left._options.rtl != right._options.rtl) {
            xOffset = right._options.width - xOffset;
        }

        var x = left._options.x - xOffset,
            y = left._options.y - right._options.y,
            rtl = left._options.rtl,
            width = left._options.width;

        return new Coordinate(CoordinateType.ViewportRelative, x, y, rtl, width);
    }

    public rtl(rtl?: boolean) {
        return this._options.$property({
            name: 'rtl',
            args: arguments,
            beforeChange: (sender, args) => {
                if (this._options.type == CoordinateType.Viewport) {
                    if (isNaN(this._options.width)) {
                        throw createError(0, 'Coordinate', 'missing width to toggle rtl');
                    }

                    this._options.x = this._options.width - this._options.x;
                }
            },
        });
    }

    public x(x?) {
        return this._options.$property({
            name: 'x',
            args: arguments,
        });
    }

    public y(y?) {
        return this._options.$property({
            name: 'y',
            args: arguments,
        });
    }

    public front(front?) {
        return this.x.apply(this, arguments);
    }

    public top(top?) {
        return this.y.apply(this, arguments);
    }

    public width(width?) {
        return this._options.$property({
            name: 'width',
            args: arguments,
            beforeChange: (sender, args) => {
                args.newValue = parseFloat(args.newValue);

                if (!isNaN(args.newValue) && args.newValue < 0) {
                    throw createError('0', 'Coordinate', 'width must be greater or equal than zero');
                }
            }
        });
    }

    public add(target: Coordinate) {
        if (this._options.rtl != target._options.rtl) {
            throw createError(0, 'Coordinate', 'cannot mix calculating ltr and rtl');
        }

        var leftType = this._options.type, rightType = target._options.type;
        var func = Coordinate['_add' + Fundamental.CoordinateType[leftType] + 'By' + Fundamental.CoordinateType[rightType]];

        if (!func) {
            throw createError(0, 'Coordinate', 'cannot add ' + Fundamental.Coordinate[rightType] + ' to ' + Fundamental.Coordinate[leftType]);
        }

        return func(this, target);
    }

    public minus(target: Coordinate) {
        if (this._options.rtl != target._options.rtl) {
            throw createError(0, 'Coordinate', 'cannot mix calculating ltr and rtl');
        }

        var leftType = this._options.type, rightType = target._options.type;
        var func = Coordinate['_minus' + Fundamental.CoordinateType[leftType] + 'By' + Fundamental.CoordinateType[rightType]];

        if (!func) {
            throw createError(0, 'Coordinate', 'cannot minus ' + Fundamental.Coordinate[rightType] + ' to ' + Fundamental.Coordinate[leftType]);
        }

        return func(this, target);
    }

    public type(type?: CoordinateType) {
        return this._options.type;
    }
}

export class CoordinateFactory {
    public static fromElement(rtl, element) {
        var offset = element.offset();
        var coordinate;

        if (rtl) {
            coordinate = new Fundamental.Coordinate(Fundamental.CoordinateType.Viewport, offset.left + element.width(), offset.top, false, $(document).width());
            coordinate.rtl(rtl);
        } else {

            coordinate = new Fundamental.Coordinate(Fundamental.CoordinateType.Viewport, offset.left, offset.top);
        }

        return coordinate;
    }

    public static fromEvent(rtl, event) {
        var result = {};

        if (Fundamental.BrowserDetector.isTouchEvent(event.type)) {
            for (var i = 0; i < event.originalEvent.touches.length; i++) {
                var touch = event.originalEvent.touches[i];
                var coordinate;

                if (rtl) {
                    coordinate = new Fundamental.Coordinate(Fundamental.CoordinateType.Viewport, touch.pageX, touch.pageY, false, $(document).width());
                } else {
                    coordinate = new Fundamental.Coordinate(Fundamental.CoordinateType.Viewport, touch.pageX, touch.pageY, false);
                }

                coordinate.rtl(rtl);
                result['touch.' + touch.identifier] = coordinate;
            };
        } else {
            var coordinate;

            if (rtl) {
                coordinate = new Fundamental.Coordinate(Fundamental.CoordinateType.Viewport, event.pageX, event.pageY, false, $(document).width());
            } else {
                coordinate = new Fundamental.Coordinate(Fundamental.CoordinateType.Viewport, event.pageX, event.pageY, false);
            }

            coordinate.rtl(rtl);
            result['mouse'] = coordinate;
        }

        return result;
    }

    public static scrollFromElement(rtl, element) {
        var scrollLeft = element.scrollLeft(),
            scrollFront = scrollLeft,
            scrollOverflowWidth = element[0].scrollWidth - element[0].clientWidth,
            scrollTop = element[0].scrollTop;

        if (rtl) {
            // scrollFront = scrollOverflowWidth - scrollLeft;
            if (Fundamental.TextDirection.zeroEnd() == 'front' && Fundamental.TextDirection.scrollFrontDirection() == 1) {
                scrollFront = scrollLeft;
            } else if (Fundamental.TextDirection.zeroEnd() == 'front' && Fundamental.TextDirection.scrollFrontDirection() == -1) {
                // FireFox
                scrollFront = -scrollLeft;
            } else if (Fundamental.TextDirection.zeroEnd() == 'end' && Fundamental.TextDirection.scrollFrontDirection() == 1) {
                // Chrome
                scrollFront = Math.max(0, scrollOverflowWidth - scrollLeft);
            } else if (Fundamental.TextDirection.zeroEnd() == 'end' && Fundamental.TextDirection.scrollFrontDirection() == -1) {
                // Unknown
                scrollFront = Math.max(0, scrollLeft - scrollOverflowWidth);
            }
        }

        return new Fundamental.Coordinate(Fundamental.CoordinateType.ViewportRelative, scrollFront, scrollTop, rtl, NaN);
    }
}

