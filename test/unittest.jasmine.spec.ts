declare var Microsoft;

var $: JQueryStatic;
var MSOC;

beforeEach(function(done) {
    if ($) {
        done();
        return;
    }

    var fs = require('fs')
    var jsdom = require('jsdom');

    jsdom.env({

        html: '<html><body></body></html>',
        src: [
            fs.readFileSync('install/lib/jquery/jquery.js', 'utf-8'),
            fs.readFileSync('install/js/listcontrol.js', 'utf-8')
        ],
        done: function (err, window) {
            $ = window.jQuery;
            MSOC = window.Microsoft.Office.Controls;
            done();
        }
    });
});

describe('Basic Functionality', function () {
    describe('Coordinate', function () {
        function formatCoordinate(coordinate) {
            return JSON.stringify({
                x: coordinate.x(),
                y: coordinate.y(),
                front: coordinate.front(),
                top: coordinate.top(),
                width: coordinate.width(),
                type: coordinate.type(),
                rtl: coordinate.rtl(),
            });
        }

        it('Existance', function () {
            expect(typeof(MSOC.Support.CoordinateType)).toBe('object');
            expect(typeof(MSOC.Support.Coordinate)).toBe('function');
        });

        it('Create', function () {
            expect(typeof(new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 0, 0))).toBe('object');
            expect(typeof(new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 0, 0, false))).toBe('object');
            expect(typeof(new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 0, 0, false, 0))).toBe('object');
            expect(() => new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 0, 0, false, -1)).toThrow();
            expect(() => new MSOC.Support.Coordinate(256, 0, 0, true, -1)).toThrow();
            expect(() => new MSOC.Support.Coordinate('Viewport', 0, 0, true, 0)).toThrow();
        });

        it('Set Property', function () {
            var coordinate;

            coordinate = new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 0, 0);
            coordinate.x(1);
            coordinate.y(2);
            expect(() => coordinate.rtl(true)).toThrow();
            coordinate.width(3);
            expect(coordinate.x()).toBe(1);
            expect(coordinate.front()).toBe(1);
            expect(coordinate.top()).toBe(2);
            expect(coordinate.y()).toBe(2);
            expect(coordinate.rtl()).toBe(false);
            expect(coordinate.width()).toBe(3);

            coordinate.front(2);
            expect(coordinate.x()).toBe(2);
            expect(coordinate.front()).toBe(2);

            coordinate.top(3);
            expect(coordinate.y()).toBe(3);
            expect(coordinate.top()).toBe(3);

            expect(() => coordinate.width(-1)).toThrow();
        });

        it('Rtl', function () {
            var coordinate

            coordinate = new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 5, 10, false, 100);
            coordinate.rtl(true);
            expect(coordinate.rtl()).toBeTruthy();
            expect(coordinate.x()).toBe(95);

            coordinate = new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 5, 10, true, 100);
            coordinate.rtl(false);
            expect(coordinate.rtl()).toBeFalsy();
            expect(coordinate.x()).toBe(95);

            coordinate = new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 5, 10, false, 100);
            coordinate.rtl(true);
            expect(coordinate.rtl()).toBeTruthy();
            expect(coordinate.x()).toBe(5);

            coordinate = new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 5, 10, true, 100);
            coordinate.rtl(false);
            expect(coordinate.rtl()).toBeFalsy();
            expect(coordinate.x()).toBe(5);
        });

        it('Add', function () {
            var cases, caseIndex;

            cases = [
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, false), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 13, 10, false, 100)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, true), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 13, 10, true, 100)],

                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, false), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 13, 10, false, NaN)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, true), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 13, 10, true, NaN)],
            ];

            caseIndex = 0;
            expect(formatCoordinate(cases[caseIndex][0].add(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));
            expect(formatCoordinate(cases[caseIndex][0].add(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));
            expect(formatCoordinate(cases[caseIndex][0].add(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));
            expect(formatCoordinate(cases[caseIndex][0].add(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));

            cases = [
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, false)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, true)],

                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, false)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, true)],
            ];

            expect(() => cases[caseIndex][0].add(cases[caseIndex][1])).toThrow();
            expect(() => cases[caseIndex][0].add(cases[caseIndex][1])).toThrow();
            expect(() => cases[caseIndex][0].add(cases[caseIndex][1])).toThrow();
            expect(() => cases[caseIndex][0].add(cases[caseIndex][1])).toThrow();

        });

        it('Minus', function () {
            var cases, caseIndex;

            cases = [
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, false), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 7, -4, false, 100)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, true), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 7, -4, true, 100)],

                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, false), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 7, -4, false, NaN)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, true), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 7, -4, true, NaN)],

                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 3, 7, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 7, -4, false, 100)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 3, 7, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 7, -4, true, 100)],
            ];

            caseIndex = 0;
            expect(formatCoordinate(cases[caseIndex][0].minus(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));
            expect(formatCoordinate(cases[caseIndex][0].minus(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));
            expect(formatCoordinate(cases[caseIndex][0].minus(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));
            expect(formatCoordinate(cases[caseIndex][0].minus(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));
            expect(formatCoordinate(cases[caseIndex][0].minus(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));
            expect(formatCoordinate(cases[caseIndex][0].minus(cases[caseIndex][1]))).toBe(formatCoordinate(cases[caseIndex++][2]));

            cases = [
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, false)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, true)],

                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, false)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.ViewportRelative, 3, 7, true)],

                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, true, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 3, 7, false, 100)],
                [new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 10, 3, false, 100), new MSOC.Support.Coordinate(MSOC.Support.CoordinateType.Viewport, 3, 7, true, 100)],
            ];

            caseIndex = 0;
            expect(() => cases[caseIndex][0].minus(cases[caseIndex][1])).toThrow();
            expect(() => cases[caseIndex][0].minus(cases[caseIndex][1])).toThrow();
            expect(() => cases[caseIndex][0].minus(cases[caseIndex][1])).toThrow();
            expect(() => cases[caseIndex][0].minus(cases[caseIndex][1])).toThrow();
            expect(() => cases[caseIndex][0].minus(cases[caseIndex][1])).toThrow();
            expect(() => cases[caseIndex][0].minus(cases[caseIndex][1])).toThrow();
        });
    });

    describe('PropertyBag', function () {
        it('Existance', function () {
            expect(typeof(MSOC.Support.PropertyBag)).toBe('function');
        });

        it('Create', function () {
            expect(typeof(new MSOC.Support.PropertyBag())).toBe('object');
        });

        it('Change Value', function () {
            var propertyBag = new MSOC.Support.PropertyBag();

            expect(propertyBag.$property({ name:'test', args: [0] })).toBe(0);
            expect(propertyBag['test']).toBe(0);
            expect(propertyBag.$property({ name:'test', args: [] })).toBe(0);
            expect(propertyBag.$property({ name:'test', args: [1] })).toBe(1);
            expect(propertyBag['test']).toBe(1);
            expect(propertyBag.$property({ name:'test', args: [] })).toBe(1);
        });

        it('Event', function () {
            var propertyBag, beforeChange, afterChange;

            propertyBag = new MSOC.Support.PropertyBag();
            beforeChange = jasmine.createSpy('beforeChange');
            afterChange = jasmine.createSpy('beforeChange');

            propertyBag.$property({
                name: 'test',
                args: [0],
            });

            propertyBag.$property({
                name: 'test',
                args: [0],
                beforeChange: beforeChange,
                afterChange: afterChange,
            });

            expect(beforeChange).not.toHaveBeenCalled();
            expect(beforeChange.callCount).toBe(0);

            expect(afterChange).not.toHaveBeenCalled();
            expect(afterChange.callCount).toBe(0);

            beforeChange.reset();
            afterChange.reset();

            propertyBag = new MSOC.Support.PropertyBag();

            propertyBag.$property({
                name: 'test',
                args: ['abc'],
            });

            propertyBag.$property({
                name: 'test',
                args: ['def'],
                beforeChange: beforeChange,
                afterChange: afterChange,
            });

            expect(beforeChange).toHaveBeenCalled();
            expect(beforeChange.callCount).toBe(1);
            expect(beforeChange.mostRecentCall.args.length).toBe(2);
            expect(beforeChange.mostRecentCall.args[0]).toBe(propertyBag);
            expect(beforeChange.mostRecentCall.args[1].name).toBe('test');
            expect(beforeChange.mostRecentCall.args[1].oldValue).toBe('abc');
            expect(beforeChange.mostRecentCall.args[1].newValue).toBe('def');

            expect(afterChange).toHaveBeenCalled();
            expect(afterChange.callCount).toBe(1);
            expect(afterChange.mostRecentCall.args.length).toBe(2);
            expect(afterChange.mostRecentCall.args[0]).toBe(propertyBag);
            expect(afterChange.mostRecentCall.args[1].name).toBe('test');
            expect(afterChange.mostRecentCall.args[1].oldValue).toBe('abc');
            expect(afterChange.mostRecentCall.args[1].newValue).toBe('def');

            beforeChange.reset();
            afterChange.reset();

            propertyBag = new MSOC.Support.PropertyBag();

            propertyBag.$property({
                name: 'test',
                args: [0],
            });

            propertyBag.$property({
                name: 'test',
                args: [1],
                beforeChange: (sender, args) => {
                    args.newValue = 2;
                },
                afterChange: afterChange,
            });

            expect(afterChange).toHaveBeenCalled();
            expect(afterChange.callCount).toBe(1);
            expect(afterChange.mostRecentCall.args.length).toBe(2);
            expect(afterChange.mostRecentCall.args[0]).toBe(propertyBag);
            expect(afterChange.mostRecentCall.args[1].name).toBe('test');
            expect(afterChange.mostRecentCall.args[1].oldValue).toBe(0);
            expect(afterChange.mostRecentCall.args[1].newValue).toBe(2);
            expect(propertyBag.test).toBe(2);

            beforeChange.reset();
            afterChange.reset();

            propertyBag = new MSOC.Support.PropertyBag();

            propertyBag.$property({
                name: 'test',
                args: [0],
            });

            propertyBag.$property({
                name: 'test',
                args: [1],
                beforeChange: (sender, args) => {
                    args.cancel = true;
                },
                afterChange: afterChange,
            });

            expect(afterChange).not.toHaveBeenCalled();
            expect(afterChange.callCount).toBe(0);
        });
    });

    describe('Calculator', function () {
        it('Intersection', function () {
            expect(MSOC.Support.Calculator.intersection(0, 5, 6, 10)).toBeNull();
            expect(MSOC.Support.Calculator.intersection(0, 5, 6, 10)).toBeNull();

            expect(MSOC.Support.Calculator.intersection(0, 5, 4, 10).lower).toBe(4);
            expect(MSOC.Support.Calculator.intersection(0, 5, 4, 10).upper).toBe(5);

            expect(MSOC.Support.Calculator.intersection(4, 10, 0, 5).lower).toBe(4);
            expect(MSOC.Support.Calculator.intersection(4, 10, 0, 5).upper).toBe(5);

            expect(MSOC.Support.Calculator.intersection(4, 10, 0, 4).lower).toBe(4);
            expect(MSOC.Support.Calculator.intersection(4, 10, 0, 4).upper).toBe(4);

            expect(MSOC.Support.Calculator.intersection(4, 10, NaN, 4)).toBeNull();
            expect(MSOC.Support.Calculator.intersection(4, 10, NaN, 4)).toBeNull();
        });

        it('Union', function () {
            expect(MSOC.Support.Calculator.union(0, 5, 6, 10)).toBeNull();
            expect(MSOC.Support.Calculator.union(0, 5, 6, 10)).toBeNull();

            expect(MSOC.Support.Calculator.union(0, 5, 4, 10).lower).toBe(0);
            expect(MSOC.Support.Calculator.union(0, 5, 4, 10).upper).toBe(10);

            expect(MSOC.Support.Calculator.union(4, 10, 0, 5).lower).toBe(0);
            expect(MSOC.Support.Calculator.union(4, 10, 0, 5).upper).toBe(10);

            expect(MSOC.Support.Calculator.union(4, 10, 0, 4).lower).toBe(0);
            expect(MSOC.Support.Calculator.union(4, 10, 0, 4).upper).toBe(10);

            expect(MSOC.Support.Calculator.union(4, 10, NaN, 4)).toBeNull();
            expect(MSOC.Support.Calculator.union(4, 10, NaN, 4)).toBeNull();
        });
    });

    describe('Range', function () {
        it('Existance', function () {
            expect(typeof(MSOC.Range)).toBe('function');
            expect(typeof(MSOC.RangeType)).toBe('object');
        });

        it('Cannot set', function () {
            var range;

            range = new MSOC.Range(MSOC.RangeType.Row, 1, 2, 3, 5);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBe(1);
            expect(range.bottom()).toBe(2);
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.rowCount()).toBe(2);
            expect(range.columnCount()).toBeNaN();
            expect(range.isValid()).toBeTruthy();
            expect(range.type()).toBe(MSOC.RangeType.Row);

            range.top(-1);
            range.bottom(-1);
            range.front(-1);
            range.end(-1);
            range.type(MSOC.RangeType.Column);

            expect(range.top()).toBe(1);
            expect(range.bottom()).toBe(2);
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.isValid()).toBeTruthy();
            expect(range.type()).toBe(MSOC.RangeType.Row);
        });

        it('Create row range', function () {
            var range;
            range = new MSOC.Range(MSOC.RangeType.Row, 1, 2, 3, 5);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBe(1);
            expect(range.bottom()).toBe(2);
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.rowCount()).toBe(2);
            expect(range.columnCount()).toBeNaN();
            expect(range.isValid()).toBeTruthy();
            expect(range.type()).toBe(MSOC.RangeType.Row);

            range = new MSOC.Range(MSOC.RangeType.Row, 2, 1, 3, 5);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBe(1);
            expect(range.bottom()).toBe(2);
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.rowCount()).toBe(2);
            expect(range.columnCount()).toBeNaN();
            expect(range.isValid()).toBeTruthy();
            expect(range.type()).toBe(MSOC.RangeType.Row);

            range = new MSOC.Range(MSOC.RangeType.Row, 1, NaN, 3, -5);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.rowCount()).toBeNaN();
            expect(range.columnCount()).toBeNaN();
            expect(range.isValid()).toBeFalsy();
            expect(range.type()).toBe(MSOC.RangeType.Row);

            range = new MSOC.Range(MSOC.RangeType.Row, NaN, 2, -3, 5);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.rowCount()).toBeNaN();
            expect(range.columnCount()).toBeNaN();
            expect(range.isValid()).toBeFalsy();
            expect(range.type()).toBe(MSOC.RangeType.Row);

            range = new MSOC.Range(MSOC.RangeType.Row, -1, 2, -3, 5);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.rowCount()).toBeNaN();
            expect(range.columnCount()).toBeNaN();
            expect(range.isValid()).toBeFalsy();
            expect(range.type()).toBe(MSOC.RangeType.Row);

            range = new MSOC.Range(MSOC.RangeType.Row, 1, -2, -3, 5);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.rowCount()).toBeNaN();
            expect(range.columnCount()).toBeNaN();
            expect(range.isValid()).toBeFalsy();
            expect(range.type()).toBe(MSOC.RangeType.Row);
        });

        it('Create column range', function () {
            var range;
            range = new MSOC.Range(MSOC.RangeType.Column, 1, 2, 3, 5);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.front()).toBe(3);
            expect(range.end()).toBe(5);
            expect(range.rowCount()).toBeNaN();
            expect(range.columnCount()).toBe(3);
            expect(range.isValid()).toBeTruthy();
            expect(range.type()).toBe(MSOC.RangeType.Column);

            range = new MSOC.Range(MSOC.RangeType.Column, 1, 2, 5, 3);
            expect(typeof(range)).toBe('object');
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.front()).toBe(3);
            expect(range.end()).toBe(5);
            expect(range.rowCount()).toBeNaN();
            expect(range.columnCount()).toBe(3);
            expect(range.isValid()).toBeTruthy();
            expect(range.type()).toBe(MSOC.RangeType.Column);

            range = new MSOC.Range(MSOC.RangeType.Column, 1, 2, NaN, 5);
            expect(typeof(range)).toBe('object');
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.columnCount()).toBeNaN();
            expect(range.rowCount()).toBeNaN();
            expect(range.isValid()).toBeFalsy();
            expect(range.type()).toBe(MSOC.RangeType.Column);

            range = new MSOC.Range(MSOC.RangeType.Column, 1, 2, 3, NaN);
            expect(typeof(range)).toBe('object');
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.columnCount()).toBeNaN();
            expect(range.rowCount()).toBeNaN();
            expect(range.isValid()).toBeFalsy();
            expect(range.type()).toBe(MSOC.RangeType.Column);

            range = new MSOC.Range(MSOC.RangeType.Column, 1, 2, -1, 5);
            expect(typeof(range)).toBe('object');
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.columnCount()).toBeNaN();
            expect(range.rowCount()).toBeNaN();
            expect(range.isValid()).toBeFalsy();
            expect(range.type()).toBe(MSOC.RangeType.Column);

            range = new MSOC.Range(MSOC.RangeType.Column, 1, 2, 3, -1);
            expect(typeof(range)).toBe('object');
            expect(range.front()).toBeNaN();
            expect(range.end()).toBeNaN();
            expect(range.top()).toBeNaN();
            expect(range.bottom()).toBeNaN();
            expect(range.columnCount()).toBeNaN();
            expect(range.rowCount()).toBeNaN();
            expect(range.isValid()).toBeFalsy();
            expect(range.type()).toBe(MSOC.RangeType.Column);
        });

        it('Compare', function () {
            var ranges = [
                new MSOC.Range(MSOC.RangeType.Row, 0, 9, NaN, NaN),
                new MSOC.Range(MSOC.RangeType.Row, 0, 10, 1, 1),
                new MSOC.Range(MSOC.RangeType.Row, 0, 11, 0, 0),
                new MSOC.Range(MSOC.RangeType.Row, 1, 8, NaN, NaN),
                new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 0, 9),
                new MSOC.Range(MSOC.RangeType.Column, 1, 1, 0, 10),
                new MSOC.Range(MSOC.RangeType.Column, 0, 0, 0, 11),
                new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 1, 8),
            ];

            var i = 0;
            expect(MSOC.Range.compare(ranges[i], ranges[i++])).toBe(0);
            expect(MSOC.Range.compare(ranges[i], ranges[i++])).toBe(0);
            expect(MSOC.Range.compare(ranges[i], ranges[i++])).toBe(0);
            expect(MSOC.Range.compare(ranges[i], ranges[i++])).toBe(0);
            expect(MSOC.Range.compare(ranges[i], ranges[i++])).toBe(0);
            expect(MSOC.Range.compare(ranges[i], ranges[i++])).toBe(0);
            expect(MSOC.Range.compare(ranges[i], ranges[i++])).toBe(0);
            expect(MSOC.Range.compare(ranges[i], ranges[i++])).toBe(0);

            var i = 0
            expect(MSOC.Range.compare(ranges[i++], ranges[i])).toBe(-1);
            expect(MSOC.Range.compare(ranges[i++], ranges[i])).toBe(-1);
            expect(MSOC.Range.compare(ranges[i++], ranges[i])).toBe(-1);
            expect(MSOC.Range.compare(ranges[i++], ranges[i])).toBe(-1);
            expect(MSOC.Range.compare(ranges[i++], ranges[i])).toBe(-1);
            expect(MSOC.Range.compare(ranges[i++], ranges[i])).toBe(-1);
            expect(MSOC.Range.compare(ranges[i++], ranges[i])).toBe(-1);

            var i = ranges.length - 1;

            expect(MSOC.Range.compare(ranges[i--], ranges[i])).toBe(1);
            expect(MSOC.Range.compare(ranges[i--], ranges[i])).toBe(1);
            expect(MSOC.Range.compare(ranges[i--], ranges[i])).toBe(1);
            expect(MSOC.Range.compare(ranges[i--], ranges[i])).toBe(1);
            expect(MSOC.Range.compare(ranges[i--], ranges[i])).toBe(1);
            expect(MSOC.Range.compare(ranges[i--], ranges[i])).toBe(1);
            expect(MSOC.Range.compare(ranges[i--], ranges[i])).toBe(1);
        });

        function formatRange(range) {
            if (range) {
                return JSON.stringify({
                    type: range.type(),
                    top: range.top(),
                    bottom: range.bottom(),
                    front: range.front(),
                    end: range.end(),
                });
            } else {
                return '';
            }
        }

        it('intersection', function () {
            var row0 = new MSOC.Range(MSOC.RangeType.Row, 0, 4, NaN, NaN),
                row1 = new MSOC.Range(MSOC.RangeType.Row, 2, 6, NaN, NaN),
                row2 = new MSOC.Range(MSOC.RangeType.Row, 5, 9, NaN, NaN),
                column0 = new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 0, 4),
                column1 = new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 2, 6),
                column2 = new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 5, 9),
                rangeRow0 = new MSOC.Range(MSOC.RangeType.Range, 0, 4, 3, 7),
                rangeRow1 = new MSOC.Range(MSOC.RangeType.Range, 2, 6, 3, 7),
                rangeRow2 = new MSOC.Range(MSOC.RangeType.Range, 5, 9, 3, 7),
                rangeColumn0 = new MSOC.Range(MSOC.RangeType.Range, 3, 7, 0, 4),
                rangeColumn1 = new MSOC.Range(MSOC.RangeType.Range, 3, 7, 2, 6),
                rangeColumn2 = new MSOC.Range(MSOC.RangeType.Range, 3, 7, 5, 9);

            var cases = [
                [row0, row1, new MSOC.Range(MSOC.RangeType.Row, 2, 4, NaN, NaN)],
                [row0, row2, null],
                [row1, row2, new MSOC.Range(MSOC.RangeType.Row, 5, 6, NaN, NaN)],
                [column0, column1, new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 2, 4)],
                [column0, column2, null],
                [column1, column2, new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 5, 6)],
                [row0, rangeRow1, new MSOC.Range(MSOC.RangeType.Range, 2, 4, 3, 7)],
                [row0, rangeRow2, null],
                [row1, rangeRow2, new MSOC.Range(MSOC.RangeType.Range, 5, 6, 3, 7)],
                [column0, rangeColumn1, new MSOC.Range(MSOC.RangeType.Range, 3, 7, 2, 4)],
                [column0, rangeColumn2, null],
                [column1, rangeColumn2, new MSOC.Range(MSOC.RangeType.Range, 3, 7, 5, 6)],
                [rangeRow0, rangeColumn1, new MSOC.Range(MSOC.RangeType.Range, 3, 4, 3, 4)],
                [rangeRow0, rangeColumn2, null],
                [rangeRow1, rangeColumn2, new MSOC.Range(MSOC.RangeType.Range, 3, 6, 3, 6)],
            ];

            var i = 0;
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.intersection(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
        });

        it('union', function () {
            var row0 = new MSOC.Range(MSOC.RangeType.Row, 0, 4, NaN, NaN),
                row1 = new MSOC.Range(MSOC.RangeType.Row, 2, 6, NaN, NaN),
                row2 = new MSOC.Range(MSOC.RangeType.Row, 6, 9, NaN, NaN),
                row3 = new MSOC.Range(MSOC.RangeType.Row, 5, 9, NaN, NaN),
                column0 = new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 0, 4),
                column1 = new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 2, 6),
                column2 = new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 6, 9),
                column3 = new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 5, 9),
                rangeRow0 = new MSOC.Range(MSOC.RangeType.Range, 0, 4, 3, 7),
                rangeRow1 = new MSOC.Range(MSOC.RangeType.Range, 2, 6, 3, 7),
                rangeRow2 = new MSOC.Range(MSOC.RangeType.Range, 6, 9, 3, 7),
                rangeColumn0 = new MSOC.Range(MSOC.RangeType.Range, 3, 7, 0, 4),
                rangeColumn1 = new MSOC.Range(MSOC.RangeType.Range, 3, 7, 2, 6),
                rangeColumn2 = new MSOC.Range(MSOC.RangeType.Range, 3, 7, 6, 9);

            var cases = [
                [row0, row1, new MSOC.Range(MSOC.RangeType.Row, 0, 6, NaN, NaN)],
                [row0, row2, null],
                [row0, row3, new MSOC.Range(MSOC.RangeType.Row, 0, 9, NaN, NaN)],
                [row1, row2, new MSOC.Range(MSOC.RangeType.Row, 2, 9, NaN, NaN)],
                [column0, column1, new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 0, 6)],
                [column0, column2, null],
                [column0, column3, new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 0, 9)],
                [column1, column2, new MSOC.Range(MSOC.RangeType.Column, NaN, NaN, 2, 9)],
                [row0, rangeRow0, null],
                [column0, rangeColumn0, null],
                [rangeRow0, rangeColumn0, null],
            ];

            var i = 0;
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
            expect(formatRange(MSOC.Range.union(cases[i][0], cases[i][1]))).toBe(formatRange(cases[i++][2]));
        });
    });

    describe('Selection', function () {
        it('Existance', function () {
            var selection;

            expect(typeof(MSOC.Selection)).toBe('function');
            selection = new MSOC.Selection(MSOC.SelectionMode.SingleRow);

            expect(typeof(selection)).toBe('object');
        });

        it('selectionMode', function () {
            var selection = new MSOC.Selection(MSOC.SelectionMode.SingleRow);

            expect(selection.selectionMode()).toBe(MSOC.SelectionMode.SingleRow);
            selection.selectionMode(MSOC.SelectionMode.MultipleRows);
            expect(selection.selectionMode()).toBe(MSOC.SelectionMode.MultipleRows);
            expect(selection.ranges().length).toBe(0);
        });

        it('select MultipleRows', function () {
            var selection = new MSOC.Selection(MSOC.SelectionMode.MultipleRows);
            selection.rowCount(20);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, 0, 0));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 1, 1, -1, -1));
            expect(() => selection.select(new MSOC.Range(MSOC.RangeType.Range, 2, 2, -1, -1))).toThrow();
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 5, 10, -1, -1));
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(true);
            expect(selection.rowSelected(2)).toBe(false);
            expect(selection.rowSelected(3)).toBe(false);
            expect(selection.rowSelected(4)).toBe(false);
            expect(selection.rowSelected(5)).toBe(true);
            expect(selection.rowSelected(7)).toBe(true);
            expect(selection.rowSelected(10)).toBe(true);
            expect(selection.rowSelected(11)).toBe(false);
        });

        it('select SingleRow', function () {
            var selection = new MSOC.Selection();
            selection.rowCount(20);
            selection.columnCount(20);
            expect(selection.rowSelected(0)).toBe(true);
            expect(() => selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, 0, 0))).toThrow();
            expect(() => selection.select(new MSOC.Range(MSOC.RangeType.Range, 2, 2, -1, -1))).toThrow();
            expect(() => selection.select(new MSOC.Range(MSOC.RangeType.Row, 5, 10, -1, -1))).toThrow();
            selection.cursor(new MSOC.Position(1, 0));
            expect(selection.rowSelected(0)).toBe(false);
            expect(selection.rowSelected(1)).toBe(true);
            expect(selection.rowSelected(2)).toBe(false);
        });

        it('deselect range', function () {
            var selection = new MSOC.Selection();
            selection = new MSOC.Selection(MSOC.SelectionMode.Range);
            selection.rowCount(20);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Range, 0, 0, 1, 2));
            expect(selection.ranges().length).toBe(1);
            selection.deselect(new MSOC.Range(MSOC.RangeType.Range, 0, 0, 1, 1));
            expect(selection.ranges().length).toBe(1);
            selection.deselect(new MSOC.Range(MSOC.RangeType.Range, 0, 0, 1, 2));
            expect(selection.ranges().length).toBe(0);
        });

        it('deselect row', function () {
            var selection = new MSOC.Selection();
            selection = new MSOC.Selection(MSOC.SelectionMode.Range);
            selection.rowCount(20);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 2, 2, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 4, 4, NaN, NaN));
            selection.deselect(new MSOC.Range(MSOC.RangeType.Row, 1, 3, NaN, NaN));
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(false);
            expect(selection.rowSelected(2)).toBe(false);
            expect(selection.rowSelected(3)).toBe(false);
            expect(selection.rowSelected(4)).toBe(true);

            selection.clear();
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 2, 4, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 5, 8, NaN, NaN));
            selection.deselect(new MSOC.Range(MSOC.RangeType.Row, 3, 7, NaN, NaN));
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(false);
            expect(selection.rowSelected(2)).toBe(true);
            expect(selection.rowSelected(3)).toBe(false);
            expect(selection.rowSelected(4)).toBe(false);
            expect(selection.rowSelected(5)).toBe(false);
            expect(selection.rowSelected(6)).toBe(false);
            expect(selection.rowSelected(7)).toBe(false);
            expect(selection.rowSelected(8)).toBe(true);

            selection.clear();
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 2, 6, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 8, 8, NaN, NaN));
            selection.deselect(new MSOC.Range(MSOC.RangeType.Row, 3, 5, NaN, NaN));
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(false);
            expect(selection.rowSelected(2)).toBe(true);
            expect(selection.rowSelected(3)).toBe(false);
            expect(selection.rowSelected(4)).toBe(false);
            expect(selection.rowSelected(5)).toBe(false);
            expect(selection.rowSelected(6)).toBe(true);
            expect(selection.rowSelected(7)).toBe(false);
            expect(selection.rowSelected(8)).toBe(true);
        });

        it('remove rows', function () {
            var selection = new MSOC.Selection();
            selection = new MSOC.Selection(MSOC.SelectionMode.Range);
            selection.rowCount(20);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 2, 2, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 4, 4, NaN, NaN));
            selection.remove(new MSOC.Range(MSOC.RangeType.Row, 1, 3, NaN, NaN));
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(true);
            expect(selection.rowSelected(2)).toBe(false);
            expect(selection.rowCount()).toBe(17);

            selection.clear();
            selection.rowCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 2, 4, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 5, 8, NaN, NaN));
            selection.remove(new MSOC.Range(MSOC.RangeType.Row, 3, 7, NaN, NaN));
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(false);
            expect(selection.rowSelected(2)).toBe(true);
            expect(selection.rowSelected(3)).toBe(true);
            expect(selection.rowSelected(4)).toBe(false);
            expect(selection.rowCount()).toBe(15);

            selection.clear();
            selection.rowCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 2, 6, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 8, 8, NaN, NaN));
            selection.remove(new MSOC.Range(MSOC.RangeType.Row, 3, 5, NaN, NaN));
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(false);
            expect(selection.rowSelected(2)).toBe(true);
            expect(selection.rowSelected(3)).toBe(true);
            expect(selection.rowSelected(4)).toBe(false);
            expect(selection.rowSelected(5)).toBe(true);
            expect(selection.rowSelected(6)).toBe(false);
            expect(selection.rowCount()).toBe(17);

            selection = new MSOC.Selection(MSOC.SelectionMode.SingleRow);
            selection.clear();
            selection.rowCount(20);
            selection.columnCount(20);
            selection.cursor(new MSOC.Position(2, 2));
            selection.remove(new MSOC.Range(MSOC.RangeType.Row, 1, 3, NaN, NaN));
            expect(selection.rowSelected(0)).toBe(false);
            expect(selection.rowSelected(1)).toBe(true);
            expect(selection.rowSelected(2)).toBe(false);
            expect(selection.rowCount()).toBe(17);

            selection = new MSOC.Selection(MSOC.SelectionMode.SingleRow);
            selection.clear();
            selection.rowCount(20);
            selection.columnCount(20);
            selection.cursor(new MSOC.Position(18, 18));
            selection.remove(new MSOC.Range(MSOC.RangeType.Row, 17, 19, NaN, NaN));
            expect(selection.rowSelected(16)).toBe(true);
            expect(selection.rowCount()).toBe(17);
        });

        it('insert rows', function () {
            var selection = new MSOC.Selection();
            selection = new MSOC.Selection(MSOC.SelectionMode.Range);
            selection.rowCount(20);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 2, 4, NaN, NaN));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 6, 6, NaN, NaN));
            selection.insert(new MSOC.Range(MSOC.RangeType.Row, 3, 6, NaN, NaN));
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(false);
            expect(selection.rowSelected(2)).toBe(true);
            expect(selection.rowSelected(3)).toBe(true);
            expect(selection.rowSelected(4)).toBe(true);
            expect(selection.rowSelected(5)).toBe(true);
            expect(selection.rowSelected(6)).toBe(true);
            expect(selection.rowSelected(7)).toBe(true);
            expect(selection.rowSelected(8)).toBe(true);
            expect(selection.rowSelected(9)).toBe(false);
            expect(selection.rowSelected(10)).toBe(true);
            expect(selection.rowSelected(11)).toBe(false);
            expect(selection.rowCount()).toBe(24);
        });

        it('clone', function () {
            var selection = new MSOC.Selection(MSOC.SelectionMode.MultipleRows);
            selection.rowCount(20);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, 0, 0));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 1, 1, -1, -1));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 5, 10, -1, -1));
            selection = selection.clone();

            expect(selection.rowCount()).toBe(20);
            expect(selection.columnCount()).toBe(20);
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(true);
            expect(selection.rowSelected(2)).toBe(false);
            expect(selection.rowSelected(3)).toBe(false);
            expect(selection.rowSelected(4)).toBe(false);
            expect(selection.rowSelected(5)).toBe(true);
            expect(selection.rowSelected(7)).toBe(true);
            expect(selection.rowSelected(10)).toBe(true);
            expect(selection.rowSelected(11)).toBe(false);
        });

        it('rowCount', function () {
            var selection = new MSOC.Selection(MSOC.SelectionMode.MultipleRows);
            selection.rowCount(7);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, 0, 0));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 1, 1, -1, -1));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 5, 10, -1, -1));
            selection.rowCount(5);

            expect(selection.rowCount()).toBe(5);
            expect(selection.rowSelected(0)).toBe(true);
            expect(selection.rowSelected(1)).toBe(true);
            expect(selection.rowSelected(2)).toBe(false);
            expect(selection.rowSelected(3)).toBe(false);
            expect(selection.rowSelected(4)).toBe(false);
            expect(selection.rowSelected(5)).toBe(false);
            expect(selection.rowSelected(7)).toBe(false);
            expect(selection.rowSelected(10)).toBe(false);
            expect(selection.rowSelected(11)).toBe(false);
        });

        it('columnCount', function () {
            var selection = new MSOC.Selection(MSOC.SelectionMode.Range);
            selection.rowCount(20);
            selection.columnCount(7);
            selection.select(new MSOC.Range(MSOC.RangeType.Range, 5, 10, 5, 10));
            expect(selection.ranges()[0].end()).toBe(6);

            selection.columnCount(6);
            expect(selection.ranges()[0].end()).toBe(5);
        });

        it('ranges', function () {
            var selection = new MSOC.Selection(MSOC.SelectionMode.MultipleRows);
            selection.rowCount(20);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, 0, 0));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 1, 1, -1, -1));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 11, 11, -1, -1));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 5, 10, -1, -1));

            expect(selection.ranges().length).toBe(2);
        });

        it('clear', function () {
            var selection = new MSOC.Selection(MSOC.SelectionMode.MultipleRows);
            selection.rowCount(20);
            selection.columnCount(20);
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 0, 0, 0, 0));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 1, 1, -1, -1));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 11, 11, -1, -1));
            selection.select(new MSOC.Range(MSOC.RangeType.Row, 5, 10, -1, -1));
            selection.clear();

            expect(selection.ranges().length).toBe(0);
        });
    });

    it('Disposer', function () {
        var disposer;
        var called = false;

        expect(typeof(MSOC.Support.Disposer)).toBe('function');
        disposer = new MSOC.Support.Disposer(() => called = true);

        expect(typeof(disposer)).toBe('object');
        expect(disposer.isDisposed).toBe(false);
        expect(called).toBe(false);

        disposer.dispose();

        expect(disposer.isDisposed).toBe(true);
        expect(called).toBe(true);

        called = false;

        disposer.dispose();

        expect(disposer.isDisposed).toBe(true);
        expect(called).toBe(false);
    });

    it('ResourceGroup', function () {
        var resourceGroup;
        var disposed;
        var disposer;

        expect(typeof(MSOC.Support.ResourceGroup)).toBe('function');
        resourceGroup = new MSOC.Support.ResourceGroup();

        expect(typeof(resourceGroup)).toBe('object');

        disposed = false;
        disposer = new MSOC.Support.Disposer(() => disposed = true);

        resourceGroup.add(disposer);
        expect(disposed).toBe(false);

        resourceGroup.dispose();
        expect(disposed).toBe(true);

        resourceGroup = new MSOC.Support.ResourceGroup();

        disposed = false;
        var disposeCalled = false;
        disposer = new MSOC.Support.Disposer(() => disposed = true);

        resourceGroup.add({
            dispose: () => 1,
            disposer: disposer,
        });
        expect(disposeCalled).toBe(false);
        expect(disposed).toBe(false);

        resourceGroup.dispose();
        expect(disposeCalled).toBe(false);
        expect(disposed).toBe(true);
    });
});

