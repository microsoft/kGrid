// Viewport: the coordinate is the offset between the point and the front top conner of document, rtl is taken into account
// ViewportRelative: the coordinate is the offset between two points, rtl is taken into account
export enum CoordinateType {
    Viewport,
    ViewportRelative,
}

export class Coordinate {
    private _options;

    public constructor(x, y, width: any = 0, rtl: boolean = false) {
        x = parseFloat(x);
        y = parseFloat(y);
        width = isNaN(width) ? NaN : parseFloat(<string>width);
        rtl = !!rtl;

        if (!isNaN(width) && width < 0) {
            throw createError('0', 'Coordinate', 'width must be greater or equal than zero');
        }

        this._options = new PropertyBag({
            type: isNaN(width) ? CoordinateType.ViewportRelative : CoordinateType.Viewport,
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

        return new Coordinate(x, y, width, rtl);
    }

    private static _addViewportRelativeByViewportRelative(left: Coordinate, right: Coordinate) {
        var xOffset = right._options.x, yOffset = right._options.y;

        if (left._options.rtl != right._options.rtl) {
            xOffset = -xOffset;
        }

        var x = left._options.x + xOffset,
            y = left._options.y + yOffset,
            rtl = left._options.rtl;

        return new Coordinate(x, y, NaN, rtl);
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

        return new Coordinate(x, y, width, rtl);
    }

    private static _minusViewportRelativeByViewportRelative(left: Coordinate, right: Coordinate) {
        var xOffset = right._options.x, yOffset = right._options.y;

        if (left._options.rtl != right._options.rtl) {
            xOffset = -xOffset;
        }

        var x = left._options.x - xOffset,
            y = left._options.y - yOffset,
            rtl = left._options.rtl;

        return new Coordinate(x, y, NaN, rtl);
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

        return new Coordinate(x, y, NaN, rtl);
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
                args.newValue = isNaN(args.newValue) ? NaN : parseFloat(args.newValue);

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
        console.log('leftType: ' + leftType);
        var func = Coordinate['_add' + CoordinateType['' + leftType] + 'By' + CoordinateType['' + rightType]];

        if (!func) {
            throw createError(0, 'Coordinate', 'cannot add ' + CoordinateType[rightType] + ' to ' + CoordinateType[leftType]);
        }

        return func(this, target);
    }

    public minus(target: Coordinate) {
        if (this._options.rtl != target._options.rtl) {
            throw createError(0, 'Coordinate', 'cannot mix calculating ltr and rtl');
        }

        var leftType = this._options.type, rightType = target._options.type;
        var func = Coordinate['_minus' + CoordinateType[leftType] + 'By' + CoordinateType[rightType]];

        if (!func) {
            throw createError(0, 'Coordinate', 'cannot minus ' + CoordinateType['' + rightType] + ' to ' + CoordinateType['' + leftType]);
        }

        return func(this, target);
    }
}

export class CoordinateFactory {
    public static fromElement(rtl, element) {
        element = $(element);

        var offset = element.offset(),
            coordinate;

        if (rtl) {
            coordinate = new Coordinate(offset.left + element.width(), offset.top, $(document).width(), false);
            coordinate.rtl(rtl);
        } else {
            coordinate = new Coordinate(offset.left, offset.top);
        }

        return coordinate;
    }

    public static fromEvent(rtl, event) {
        var result = {};

        if (BrowserDetector.isTouchEvent(event.type)) {
            for (var i = 0; i < event.originalEvent.touches.length; i++) {
                var touch = event.originalEvent.touches[i];
                var coordinate;

                if (rtl) {
                    coordinate = new Coordinate(touch.pageX, touch.pageY, $(document).width(), true);
                } else {
                    coordinate = new Coordinate(touch.pageX, touch.pageY);
                }

                coordinate.rtl(rtl);
                result['touch.' + touch.identifier] = coordinate;
            };
        } else {
            var coordinate;

            if (rtl) {
                coordinate = new Coordinate(event.pageX, event.pageY, $(document).width(), true);
            } else {
                coordinate = new Coordinate(event.pageX, event.pageY, 0);
            }

            coordinate.rtl(rtl);
            result['mouse'] = coordinate;
        }

        return result;
    }

    public static scrollFromElement(rtl, element) {
        element = $(element);

        var scrollLeft = element.scrollLeft(),
            scrollFront = scrollLeft,
            scrollOverflowWidth = element[0].scrollWidth - element[0].clientWidth,
            scrollTop = element[0].scrollTop;

        if (rtl) {
            // scrollFront = scrollOverflowWidth - scrollLeft;
            if (TextDirection.zeroEnd() == 'front' && TextDirection.scrollFrontDirection() == 1) {
                scrollFront = scrollLeft;
            } else if (TextDirection.zeroEnd() == 'front' && TextDirection.scrollFrontDirection() == -1) {
                // FireFox
                scrollFront = -scrollLeft;
            } else if (TextDirection.zeroEnd() == 'end' && TextDirection.scrollFrontDirection() == 1) {
                // Chrome
                scrollFront = Math.max(0, scrollOverflowWidth - scrollLeft);
            } else if (TextDirection.zeroEnd() == 'end' && TextDirection.scrollFrontDirection() == -1) {
                // Unknown
                scrollFront = Math.max(0, scrollLeft - scrollOverflowWidth);
            }
        }

        return new Coordinate(scrollFront, scrollTop, NaN, rtl);
    }
}

