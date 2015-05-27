export module Support {
    export function createError(number, name, message) {
        return new Error(number + ': [' + name + '] ' + message);
    }

    export class TextDirection {
        public static RTL = 1;
        public static LTR = 0;
        private static _staticInitialized = false;
        private static _zeroEnd;
        private static _scrollFrontDirection;
        private options;

        constructor(rtl) {
            this.options = new Support.PropertyBag();
            this.rtl(rtl);
        }

        private static _staticInitialize() {
            if (TextDirection._staticInitialized) {
                return;
            }

            var div = $('<div style="direction: rtl; posistion:absolute; left: 0px; right: 0px; width: 50px; height: 50px; overflow: auto"><div style="posistion:absolute; left: 0px; right: 0px; width: 51px; height: 50px"></div></div>');

            $(document.body).append(div);

            TextDirection._zeroEnd = div.scrollLeft() == 0 ? 'front' : 'end';

            div.scrollLeft(1);

            if (div.scrollLeft() == 1) {
                TextDirection._scrollFrontDirection = 1;
            } else {
                TextDirection._scrollFrontDirection = -1;
            }

            div.remove();

            TextDirection._staticInitialized = true;
        }

        public static zeroEnd() {
            TextDirection._staticInitialize();
            return TextDirection._zeroEnd;
        }

        public static scrollFrontDirection() {
            TextDirection._staticInitialize();
            return TextDirection._scrollFrontDirection;
        }

        public rtl(value = undefined) {
            return this.options.$property({
                name: 'rtl',
                args: arguments,
                afterChange: (sender, args) => {
                    if (args.newValue) {
                        this.front('right');
                        this.end('left');
                    } else {
                        this.front('left');
                        this.end('right');
                    }
                },
            });
        }

        public front(value = undefined) {
            return this.options.$property({
                name: 'front',
                args: arguments,
            });
        }

        public end(value = undefined) {
            return this.options.$property({
                name: 'end',
                args: arguments,
            });
        }

        public clone() {
            var clonedObject = new Support.TextDirection(this.rtl());

            clonedObject.options = $.extend(true, new Support.PropertyBag(), this.options);
            return clonedObject;
        }
    }

    export class CssTextBuilder {
        // Per http://jsperf.com/array-join-vs-string-connect
        // use string is faster than array join
        private static _selectorState = 0;
        private static _propertyState = 1;
        private _state;
        private _buffer;

        constructor() {
            this._buffer = '';
            this._state = CssTextBuilder._selectorState;
        }

        public append(text) {
            this.pushSelector(text);
        }

        public push(text) {
            this.pushSelector(text);
        }
        public pushSelector(selector) {
            if (this._state == CssTextBuilder._propertyState) {
                this._buffer += '}';
                this._state = CssTextBuilder._selectorState;
            }

            this._buffer += selector;
        }

        public property(name, value, unit?) {
            if (arguments.length > 2 && isNaN(value)) {
                throw(0, 'CssTextBuilder', 'cannot use unit when the second argument are NaN');
            }

            if (this._state == CssTextBuilder._selectorState) {
                this._buffer += '{';
                this._state = CssTextBuilder._propertyState;
            }

            this._buffer += name;
            this._buffer += ':';
            this._buffer += value;

            if (unit) {
                this._buffer += unit;
            }

            this._buffer += ';';
        }

        public propertyBegin() {
            switch (this._state) {
                case CssTextBuilder._selectorState:
                    this._buffer += '{';
                    this._state = CssTextBuilder._propertyState;
                    break;

                case CssTextBuilder._propertyState:
                    throw createError(0, 'CssTextBuilder', 'cannot use propertyBegin in propertyState');
            }
        }

        public propertyEnd() {
            switch (this._state) {
                case CssTextBuilder._selectorState:
                    throw createError(0, 'CssTextBuilder', 'cannot use propertyEnd in selectorState');
                    break;

                case CssTextBuilder._propertyState:
                    this._buffer += '}';
                    this._state = CssTextBuilder._selectorState;
                    break;
            }
        }

        public toString() {
            if (this._state == CssTextBuilder._propertyState) {
                this._buffer += '}';
            }

            return this._buffer;
        }
    }

    export class StringBuilder {
        // Per http://jsperf.com/array-join-vs-string-connect
        // use string is faster than array join
        private _buffer;

        constructor() {
            this._buffer = '';
        }

        public append(text) {
            this._buffer += text;
        }

        public toString() {
            return this._buffer;
        }
    }

    export class Updater {
        private _checker;
        private _updater;
        private _isFirstTime;
        private _lastValue;

        constructor(checker, updater) {
            this._checker = checker;
            this._updater = updater;
            this._isFirstTime = true;
        }

        public update() {
            var value = typeof(this._checker) == "function" ? this._checker() : this._checker;

            if (this._isFirstTime) {
                this._isFirstTime = false;
                this._lastValue = JSON.stringify(value);
                this._updater(value, value);
                return true;
            } else if (JSON.stringify(value) !== this._lastValue) {
                var lastValue = JSON.parse(this._lastValue)

                this._lastValue = JSON.stringify(value);
                this._updater(value, lastValue);
                return true;
            }

            return false;
        }

        public reset() {
            this._isFirstTime = true;
            this._lastValue = undefined;
        }

        public ignore() {
            var value = typeof(this._checker) == "function" ? this._checker() : this._checker;

            if (this._isFirstTime) {
                this._isFirstTime = false;
                this._lastValue = value;
            } else if (JSON.stringify(value) !== this._lastValue) {
                this._lastValue = JSON.stringify(value);
            }
        }
    }

    export class UpdaterGroup {
        public disposer;
        private _updaters: Updater[];

        constructor() {
            this._updaters = [];
            this.disposer = new Fundamental.Disposer(() => {
                this._updaters = null;
            });
        }

        public add(updaters) {
            if (this.disposer.isDisposed) {
                return;
            }

            if ($.isArray(updaters)) {
                for (var i = 0; i < updaters.length; i++) {
                    this._updaters.push(updaters[i]);
                }
            } else {
                this._updaters.push(updaters);
            }
        }

        public update() {
            if (this.disposer.isDisposed) {
                return;
            }

            var result = false;

            for (var i = 0; i < this._updaters.length; i++) {
                result = this._updaters[i].update() ? true : result;
            }

            return result;
        }

        public reset() {
            if (this.disposer.isDisposed) {
                return;
            }

            for (var i = 0; i < this._updaters.length; i++) {
                this._updaters[i].reset();
            }
        }

        public ignore() {
            if (this.disposer.isDisposed) {
                return;
            }

            var result = false;

            for (var i = 0; i < this._updaters.length; i++) {
                result = this._updaters[i].ignore() ? true : result;
            }
            return result;
        }
    }

    export class DynamicStylesheetUpdater {
        public disposer;
        private _stylesheet: DynamicStylesheet;
        private _updater: Updater;
        private _generators = [];

        constructor(id) {
            this._stylesheet = new DynamicStylesheet(id);
            this._generators = [];
            this._updater = new Updater(
                () => {
                    if (this.disposer.isDisposed) {
                        return;
                    }

                    return $.map(this._generators, (generator) => generator()).join('');
                },
                (newValue) => {
                    if (this.disposer.isDisposed) {
                        return;
                    }

                    this._stylesheet.content(newValue)
                });
            this.disposer = new Fundamental.Disposer(() => {
                this._generators = null;
                this._updater = null;
            });
        }

        public add(generator) {
            if (this.disposer.isDisposed) {
                return;
            }

            this._generators.push(generator);
        }

        public reset() {
            if (this.disposer.isDisposed) {
                return;
            }

            this._updater.reset();
            this._stylesheet.content('');
        }

        public getUpdater() {
            if (this.disposer.isDisposed) {
                return;
            }

            return this._updater;
        }
    }

    export class EventSite {
        public disposer;
        private _sites;

        constructor() {
            this._sites = {};
            this.disposer = new Fundamental.Disposer(() => this._sites = null);
        }

        public on(event, callback) {
            if (this.disposer.isDisposed) {
                return;
            }

            var site = this._sites[event];

            if (!site) {
                this._sites[event] = site = [];
            }

            site.push(callback);
        }

        public off(event, callback) {
            if (this.disposer.isDisposed) {
                return;
            }

            if (!this._sites[event]) {
                return;
            }

            this._sites[event] = $.grep(this._sites[event], (c) => c != callback);
        }

        public emit(event, sender, args) {
            if (this.disposer.isDisposed) {
                return;
            }

            var site = this._sites[event];

            if (!site) {
                return;
            }

            for (var i = 0; i < site.length; i++) {
                site[i](sender, args);
            }
        }
    }

    export class Calculator {
        public static calculateScrollTopAfterSwitchView(oldCanvasHeight, newCanvasHeight, oldViewportHeight, newViewportHeight, oldViewportScrollTop) {
            var oldCanvasViewportHeight = oldCanvasHeight - oldViewportHeight;
            var newCanvasViewportHeight = newCanvasHeight - newViewportHeight;

            if (newCanvasViewportHeight < 0) {
                return 0;
            } else {
                return Math.floor(oldViewportScrollTop / oldCanvasViewportHeight * newCanvasViewportHeight);
            }
        }

        public static changeInLimitedRange(value, offset, min, max) {
            value += offset;

            if (value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }

            return value;
        }

        public static compareValueArray(values0, values1) {
            for (var i = 0; i < values0.length; i++) {
                if (values0[i] < values1[i]) {
                    return -1;
                } else if (values0[i] > values1[i]) {
                    return 1;
                }
            }

            return 0;
        }

        public static intersection(firstLower, firstUpper, secondLower, secondUpper) {
            if (isNaN(firstLower + firstUpper + secondLower + secondUpper) ||
                firstLower > secondUpper ||
                secondLower > firstUpper) {
                return null;
            } else {
                return {
                    lower: Math.max(firstLower, secondLower),
                    upper: Math.min(firstUpper, secondUpper),
                };
            }
        }

        public static union(firstLower, firstUpper, secondLower, secondUpper) {
            if (isNaN(firstLower + firstUpper + secondLower + secondUpper) ||
                firstLower > secondUpper ||
                secondLower > firstUpper) {
                return null;
            } else {
                return {
                    lower: Math.min(firstLower, secondLower),
                    upper: Math.max(firstUpper, secondUpper),
                };
            }
        }
    }

    export class EventAttacher {
        public disposer;

        constructor(element, events, callback) {
            events = events.split(' ');
            this.disposer = new Fundamental.Disposer(() => {
                for (var i = 0; i < events.length; i++) {
                    element.off(events[i], callback);
                }
            });

            for (var i = 0; i < events.length; i++) {
                element.on(events[i], callback);
            }
        }
    }

    export class DynamicStylesheet {
        public disposer;
        private _element;
        private _stylesheetText;

        constructor(id) {
            this._element = $('<style type="text/css"></style>');

            if (id) {
                this._element.attr('id', id);
            }

            $(document.head).append(this._element);
            this._stylesheetText = '';
            this.disposer = new Fundamental.Disposer(() => {
                this._element.remove();
                this._element = null;
                this._stylesheetText = null;
            });
        }

        public content(stylesheetText) {
            if (this.disposer.isDisposed) {
                return;
            }

            if (arguments.length == 0) {
                return this._stylesheetText;
            } else {
                if (!stylesheetText) {
                    stylesheetText = '';
                }

                if (this._stylesheetText != stylesheetText) {
                    this._stylesheetText = stylesheetText;

                    if (this._element[0].styleSheet && !this._element[0].sheet) {
                        this._element[0].styleSheet.cssText = this._stylesheetText;
                    } else {
                        this._element.html(this._stylesheetText);
                    }
                }
            }
        }
    }

    export class PropertyBag {
        constructor(base0 = {}, base1 = {}) {
            $.extend(true, this, base0, base1);
        }

        public $property(options) {
            options.target = this;

            return PropertyBag.property(options);
        }

        public static property(options) {
            var target = options.target,
                name = options.name,
                args = options.args,
                afterRead = options.afterRead,
                beforeChange = options.beforeChange,
                afterChange = options.afterChange;

            if (args.length > 0) {
                var oldValue = target[name], newValue = args[0];

                if (oldValue == newValue || (typeof(oldValue) == 'number' && isNaN(oldValue) && isNaN(newValue))) {
                    return newValue;
                }

                if (beforeChange) {
                    var beforeChangeArgs = { name: name, newValue: newValue, oldValue: oldValue, cancel: false };

                    beforeChange(target, beforeChangeArgs);

                    if (beforeChangeArgs.cancel) {
                        return;
                    }

                    newValue = beforeChangeArgs.newValue;
                    oldValue = beforeChangeArgs.oldValue;
                }

                target[name] = newValue;

                if (afterChange) {
                    var afterChangeArgs = { name: name, newValue: newValue, oldValue: oldValue };

                    afterChange(target, afterChangeArgs);
                    return afterChange.newValue;
                }

                return target[name];
            } else {
                var afterReadArgs = { name: name, newValue: target[name] };

                if (afterRead) {
                    afterRead(target, afterReadArgs);
                }

                return afterReadArgs.newValue;
            }
        }
    }

    export class BrowserDetector {
        public static requestAnimationFrame;
        public static now;

        public static staticInitialize() {
            if (window.requestAnimationFrame) {
                BrowserDetector.requestAnimationFrame = (handler) => {
                    return window.requestAnimationFrame(handler);
                };
            } else {
                BrowserDetector.requestAnimationFrame = (handler) => {
                    return window.setTimeout(handler, 16.67); // 16.67 = 1000 / 60
                };
            }

            if (window.performance && window.performance.now) {
                BrowserDetector.now = () => {
                    return window.performance.now();
                };
            } else {
                BrowserDetector.now = () => {
                    return (new Date()).valueOf();
                };
            }
        }

        public static isTouchEvent(type) {
            switch (type) {
                case 'touchstart':
                case 'touchmove':
                case 'touchend':
                case 'touchcancel':
                    return true;

                default:
                    return false;
            }
        }

        public static getChangedPointerIdentifier(event) {
            var isTouch = Support.BrowserDetector.isTouchEvent(event.type);

            if (isTouch) {
                var result = [];

                for (var i = 0; i < event.originalEvent.changedTouches.length; i++) {
                    result.push('touch.' + event.originalEvent.changedTouches[0].identifier);
                }

                return result;
            } else {
                return ['mouse'];
            }
        }
    }

    BrowserDetector.staticInitialize();

    // FIXME: [low][1 day] change to promise
    export class AccumulateTimeoutInvoker {
        public disposer;
        private _timeout;
        private _callback;
        private _handler;

        constructor(callback, timeout) {
            this._timeout = timeout;
            this._callback = callback;
            this.disposer = new Fundamental.Disposer(() => {
                if (this._handler) {
                    window.clearTimeout(this._handler);
                    this._handler = null;
                }
            });
        }

        public invoke(args = null) {
            if (this._handler) {
                window.clearTimeout(this._handler);
                this._handler = null;
            }

            this._handler = window.setTimeout(() => {
                this._handler = null;
                this._callback(args);
            }, this._timeout);
        }

        public dispose() {
            this.disposer.dispose();
        }
    }

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

            if (Support.CoordinateType[type] == undefined) {
                throw createError(0, 'Coordinate', 'type must be a value of CoordinateType');
            }

            if (!isNaN(width) && width < 0) {
                throw createError('0', 'Coordinate', 'width must be greater or equal than zero');
            }

            this._options = new Support.PropertyBag({
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
            var func = Coordinate['_add' + Support.CoordinateType[leftType] + 'By' + Support.CoordinateType[rightType]];

            if (!func) {
                throw createError(0, 'Coordinate', 'cannot add ' + Support.Coordinate[rightType] + ' to ' + Support.Coordinate[leftType]);
            }

            return func(this, target);
        }

        public minus(target: Coordinate) {
            if (this._options.rtl != target._options.rtl) {
                throw createError(0, 'Coordinate', 'cannot mix calculating ltr and rtl');
            }

            var leftType = this._options.type, rightType = target._options.type;
            var func = Coordinate['_minus' + Support.CoordinateType[leftType] + 'By' + Support.CoordinateType[rightType]];

            if (!func) {
                throw createError(0, 'Coordinate', 'cannot minus ' + Support.Coordinate[rightType] + ' to ' + Support.Coordinate[leftType]);
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
                coordinate = new Support.Coordinate(Support.CoordinateType.Viewport, offset.left + element.width(), offset.top, false, $(document).width());
                coordinate.rtl(rtl);
            } else {

                coordinate = new Support.Coordinate(Support.CoordinateType.Viewport, offset.left, offset.top);
            }

            return coordinate;
        }

        public static fromEvent(rtl, event) {
            var result = {};

            if (Support.BrowserDetector.isTouchEvent(event.type)) {
                for (var i = 0; i < event.originalEvent.touches.length; i++) {
                    var touch = event.originalEvent.touches[i];
                    var coordinate;

                    if (rtl) {
                        coordinate = new Support.Coordinate(Support.CoordinateType.Viewport, touch.pageX, touch.pageY, false, $(document).width());
                    } else {
                        coordinate = new Support.Coordinate(Support.CoordinateType.Viewport, touch.pageX, touch.pageY, false);
                    }

                    coordinate.rtl(rtl);
                    result['touch.' + touch.identifier] = coordinate;
                };
            } else {
                var coordinate;

                if (rtl) {
                    coordinate = new Support.Coordinate(Support.CoordinateType.Viewport, event.pageX, event.pageY, false, $(document).width());
                } else {
                    coordinate = new Support.Coordinate(Support.CoordinateType.Viewport, event.pageX, event.pageY, false);
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

            return new Support.Coordinate(Support.CoordinateType.ViewportRelative, scrollFront, scrollTop, rtl, NaN);
        }
    }

    enum RenderingSchedulerState {
        Ready,
        Active,
        Suspending,
        Suspended,
        Stopped,
    }

    export class RenderingScheduler {
        private static InitialWorkerThreshold = 400;
        private static CalculatePeriod = 500;
        private static FPSUpperBound = 30;
        private static FPSLowerBound = 10;
        private static ThresholdUpperBound = 400;
        private static ThresholdLowerBound = 5;
        private static StartTimePeriod = 3000;
        private static Factor = 0.5;

        public disposer;
        private _workers;
        private _state: RenderingSchedulerState;
        private _handlerSet;
        private _workerThreshold;
        private _creationTime;
        private _recentInvokeTime;

        constructor() {
            this._workers = [];
            this._state = RenderingSchedulerState.Ready;
            this._handlerSet = 0;
            this._workerThreshold = RenderingScheduler.InitialWorkerThreshold;
            this._recentInvokeTime = []
            this._creationTime = Support.BrowserDetector.now();
            this.disposer = new Fundamental.Disposer(() => {
                this._state = RenderingSchedulerState.Stopped;
                this._workers = null;
            });
        }

        public dispose() {
            this.disposer.dispose();
        }

        public addWorker(worker, context = null, priority = 1000) {
            this._workers.push({ priority: priority, worker: worker, context: context, });
            this._workers.sort((left, right) => left.priority == right.priority ? 0 : left.priority < right.priority ? -1 : 1);
        }

        public suspend(tillNoAction: boolean) {
            if (this._state == RenderingSchedulerState.Ready || this._state == RenderingSchedulerState.Stopped) {
                throw Support.createError(0, 'RenderingScheduler', 'cannot suspend since it is not started or stopped already');
            }

            if (tillNoAction) {
                this._state = RenderingSchedulerState.Suspending;
            } else {
                this._state = RenderingSchedulerState.Suspended;
            }
        }

        public resume() {
            if (this._state == RenderingSchedulerState.Ready || this._state == RenderingSchedulerState.Stopped) {
                throw Support.createError(0, 'RenderingScheduler', 'cannot resume since it is not started or stopped already');
            }

            this._state = RenderingSchedulerState.Active;
            this._schedule();
        }

        public start(run: boolean) {
            if (this._state != RenderingSchedulerState.Ready) {
                throw Support.createError(0, 'RenderingScheduler', 'cannot start from non-ready state');
            }

            if (run) {
                this._state = RenderingSchedulerState.Active;
                this._schedule();
            } else {
                this._state = RenderingSchedulerState.Suspended;
            }
        }

        private _doWork() {
            if (this._state == RenderingSchedulerState.Suspended
                || this._state == RenderingSchedulerState.Suspending
                || this._state == RenderingSchedulerState.Stopped) {
                return;
            }

            var startTime = Support.BrowserDetector.now(), endTime;

            this._recentInvokeTime.push(startTime);

            while (this._recentInvokeTime[0] < startTime - RenderingScheduler.CalculatePeriod) {
                this._recentInvokeTime.splice(0, 1);
            }

            var fps = this._recentInvokeTime.length + 1000 / RenderingScheduler.CalculatePeriod;

            if (fps < RenderingScheduler.FPSLowerBound) {
                this._workerThreshold *= RenderingScheduler.Factor;
            } else {
                this._workerThreshold /= RenderingScheduler.Factor;
            }

            if (this._workerThreshold > RenderingScheduler.ThresholdUpperBound) {
                this._workerThreshold = RenderingScheduler.ThresholdUpperBound;
            } else if (this._workerThreshold < RenderingScheduler.ThresholdLowerBound) {
                this._workerThreshold = RenderingScheduler.ThresholdLowerBound;
            }

            if (this._creationTime > startTime - RenderingScheduler.StartTimePeriod) {
                this._workerThreshold = RenderingScheduler.ThresholdUpperBound;
            }

            var count = 0;
            var workerIndex = 0;

            while (workerIndex < this._workers.length) {
                var result = this._workers[workerIndex].worker(this._workers[workerIndex].context);

                if (typeof(result) == 'undefined' || !result) {
                    workerIndex++;
                }

                count++;

                if (this._state == RenderingSchedulerState.Suspended || this._state == RenderingSchedulerState.Stopped) {
                    return;
                }

                endTime = Support.BrowserDetector.now();

                if (endTime - startTime > this._workerThreshold) {
                    break;
                }
            }

            // console.log('fps: ' + fps + ', threshold: ' + this._workerThreshold + 'ms, start: ' + startTime + '; end: ' + endTime + '; count: ' + count);

            if (this._state == RenderingSchedulerState.Suspending) {
                this._state = RenderingSchedulerState.Suspended;
                this._recentInvokeTime = [];
                this._workerThreshold = RenderingScheduler.InitialWorkerThreshold;
                return;
            }

            this._schedule();
        }

        private _schedule() {
            if (this._handlerSet == 0) {
                Support.BrowserDetector.requestAnimationFrame(() => {
                    this._handlerSet--;
                    this._doWork();
                });

                this._handlerSet++;
            }
        }
    }
}

