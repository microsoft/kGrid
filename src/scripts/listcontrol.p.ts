/// <summary>
/// List control class
/// </summary>
export class ListControl {
    public disposer;
    private _id;
    private _elements;
    private _runtime;
    private _updateUIHandler;
    private _options;
    private _views;
    private _updaters;
    private _dynamicStylesheetUpdater;
    private _lastColumnUniqueId;
    private _lastRowUniqueId;
    private _rowMap;
    private _rows;
    private _rendered;
    private _pendingUpdateUI;

    constructor(parent) {
        this.disposer = new Fundamental.Disposer(() => {
            this._elements.root.remove();
            this._options = null;
            this._runtime = null;
            this._elements = null;
        });
        this._initialize(parent);
    }

    public dispose() {
        this.disposer.dispose();
    }

    public viewType(value?) {
        if (this._rendered) {
            return this._viewType.apply(this, arguments);
        } else {
            return this._defaultViewType.apply(this, arguments);
        }
    }

    public width(value?) {
        return this._property({
            name: 'width',
            args: arguments,
            afterChange: (sender, args) => {
                this._runtime.width = args.newValue;
                this._dynamicStylesheetUpdater.getUpdater().update();
                this._updateSize();
            },
        });
    }

    public height(value?) {
        return this._property({
            name: 'height',
            args: arguments,
            afterChange: (sender, args) => {
                this._runtime.height = args.newValue;
                this._dynamicStylesheetUpdater.getUpdater().update();
                this._updateSize();
            },
        });
    }

    public rowCount(value?) {
        return this._property({
            name: 'rowCount',
            args: arguments,
            afterChange: (sender, args) => {
                var oldValue = args.oldValue, newValue = args.newValue;

                if (newValue < oldValue) {
                    for (var i = newValue; i < oldValue; i++) {
                        var row = this._rows[i];

                        if (row) {
                            var rowUniqueId = row.rowUniqueId;
                            delete this._rowMap[rowUniqueId];
                        }

                        delete this._rows[i];
                        delete this._options.rows[i];
                    }
                }

                this._options.rows.length = this._rows.length = newValue;
                this._runtime.selection.rowCount(newValue);
            },
        });
    }

    public rows(value?) {
        return this._property({
            name: 'rows',
            args: arguments,
            beforeChange: (sender, args) => {
                if (args.newValue == null || typeof(args.newValue) == 'undefined') {
                    args.newValue = [];
                } else if (!$.isArray(args.newValue)) {
                    throw Microsoft.Office.Controls.Fundamental.createError(0, 'ListControl', 'rows must be an array');
                }

                var rows = [];

                this._rows = [];

                for (var i = 0; i < args.newValue.length; i++) {
                    if (typeof(args.newValue) != 'undefined') {
                        var rowUniqueId = this._generateRowUniqueId();

                        this._rows[i] = { rowUniqueId: rowUniqueId };
                        this._rowMap[rowUniqueId] = i;
                    }
                }

                this._options.rowCount = rows.length = args.newValue.length;
                this._runtime.selection.rowCount(this._options.rowCount);
                args.newValue = args.newValue.slice();
            },
        });
    }

    public getRowById(rowUniqueId) {
        var row = this._runtime.getRowByUniqueId(rowUniqueId);

        if (row) {
            return row.raw;
        }
    }

    public getRowByIndex(rowIndex) {
        return this._options.rows[rowIndex];
    }

    public getRowsByIndex(topRowindex, count) {
        var rows = [], bottomRowIndex = topRowindex + count - 1;

        for (var rowIndex = topRowindex; rowIndex <= bottomRowIndex; rowIndex++) {
            rows.push(this._options.rows[rowIndex]);
        }

        return rows;
    }

    public updateRowById(row, rowUniqueId) {
        var row = this._runtime.getRowByUniqueId(rowUniqueId);

        if (row) {
            this.updateRowsByIndex([row], row.rowIndex, 1);
        }
    }

    public updateRowByIndex(row, rowIndex: number) {
        // FIXME: [high][1 day] should we add the row count when the index is exceed the row count?
        this.updateRowsByIndex([row], rowIndex, 1);
    }

    public updateRowsByIndex(rows, startRowIndex: number, count?: number) {
        if (typeof(count) == 'undefined') {
            count = rows.length;
        }

        for (var rowIndex = startRowIndex; rowIndex < startRowIndex + count; rowIndex++) {
            var newValue = rows[rowIndex - startRowIndex], rowUniqueId: any;
            this._options.rows[rowIndex] = newValue;

            if (typeof(newValue) != 'undefined') {
                if (!this._rows[rowIndex]) {
                    rowUniqueId = this._generateRowUniqueId();

                    this._rows[rowIndex] = { rowUniqueId: rowUniqueId };
                    this._rowMap[rowUniqueId] = rowIndex;
                }
            } else {
                var row = this._rows[rowIndex];

                if (row) {
                    rowUniqueId = this._rows[rowIndex].rowUniqueId;

                    delete this._rows[rowIndex];
                    delete this._rowMap[rowUniqueId];
                }
            }
        }

        this._runtime.events.emit('updateRows', this, { range: new Range(RangeType.Row, startRowIndex, startRowIndex + rows.length - 1, NaN, NaN), });
        this.updateUI(1);
    }

    public removeRowById(rowUniqueId: number) {
        var row = this._runtime.getRowByUniqueId(rowUniqueId);

        if (row) {
            this.removeRowsByIndex(row.rowIndex, 1);
        }
    }

    public removeRowByIndex(rowIndex: number) {
        this.removeRowsByIndex(rowIndex, 1);
    }

    public removeRowsByIndex(startRowIndex: number, count: number) {
        // FIXME: [high][1 day] add check here
        var removedRows = this._rows.splice(startRowIndex, count);
        this._options.rows.splice(startRowIndex, count);

        for (var rowIndex = 0; rowIndex < removedRows.length; rowIndex++) {
            var row = removedRows[rowIndex];

            if (row) {
                delete this._rowMap[row.rowUniqueId];
            }
        }


        for (var rowIndex = startRowIndex; rowIndex < this._rows.length; rowIndex++) {
            var row = this._rows[rowIndex];

            if (row) {
                this._rowMap[row.rowUniqueId] = rowIndex;
            }
        }

        this._options.rowCount -= count;
        this._runtime.selection.remove(new Range(RangeType.Row, startRowIndex, startRowIndex + count - 1, NaN, NaN));

        this._runtime.events.emit('removeRows', this, { range: new Range(RangeType.Row, startRowIndex, startRowIndex + count - 1, NaN, NaN), });
        this.updateUI(1);
    }

    public insertRowById(rowUniqueId: number) {
        var row = this._runtime.getRowByUniqueId(rowUniqueId);

        if (row) {
            this.insertRowsByIndex(row.rowIndex, 1);
        }
    }

    public insertRowByIndex(rowIndex: number) {
        this.insertRowsByIndex(rowIndex, 1);
    }

    public insertRowsByIndex(rows, startRowIndex: number, count?: number) {
        if (typeof(count) == 'undefined') {
            count = rows.length;
        }

        var spliceParameters = [startRowIndex, 0];

        for (var rowIndex = startRowIndex; rowIndex < this._options.rowCount; rowIndex++) {
            var row = this._rows[rowIndex];

            if (typeof(row) != 'undefined') {
                var rowUniqueId = row.rowUniqueId;

                this._rowMap[rowUniqueId] = rowIndex + count;
            }
        }

        for (var rowIndex = 0; rowIndex < count; rowIndex++) {
            spliceParameters.push(undefined);
        }

        this._rows.splice.apply(this._rows, spliceParameters);
        this._options.rows.splice.apply(this._options.rows, spliceParameters);

        for (var rowIndex = startRowIndex; rowIndex < startRowIndex + count; rowIndex++) {
            var newValue = rows[rowIndex - startRowIndex], rowUniqueId: any;
            this._options.rows[rowIndex] = newValue;

            if (typeof(newValue) != 'undefined') {
                if (!this._rows[rowIndex]) {
                    rowUniqueId = this._generateRowUniqueId();

                    this._rows[rowIndex] = { rowUniqueId: rowUniqueId };
                    this._rowMap[rowUniqueId] = rowIndex;
                }
            } else {
                var row = this._rows[rowIndex];

                if (row) {
                    rowUniqueId = this._rows[rowIndex].rowUniqueId;

                    delete this._rows[rowIndex];
                    delete this._rowMap[rowUniqueId];
                }
            }
        }

        this._options.rowCount += count;
        this._runtime.selection.insert(new Range(RangeType.Row, startRowIndex, startRowIndex + count - 1, NaN, NaN));
        this._runtime.events.emit('insertRows', this, { range: new Range(RangeType.Row, startRowIndex, startRowIndex + rows.length - 1, NaN, NaN), });
        this.updateUI(1);
    }

    public theme(value?) {
        return this._property({
            name: 'theme',
            args: arguments
        });
    }

    public selectedRanges() {
        return this._runtime.selection.ranges().slice();
    }

    public selectionMode(value?) {
        return this._property({
            name: 'selectionMode',
            args: arguments,
            afterChange: (sender, args) => {
                this._runtime.selection.selectionMode(args.newValue);
            }
        });
    }

    public cursor(position?) {
        return this._runtime.selection.cursor.apply(this._runtime.selection, arguments);
    }

    public select(range: Range, keepSelectedRanges = false) {
        return this._runtime.selection.select(range, keepSelectedRanges);
    }

    public deselect(range: Range) {
        this._runtime.selection.deselect(range);
    }

    public selectedRangeOfPosition(position) {
        return this._runtime.selection.rangeOfPosition(position);
    }

    public selectedRangeOfCursor() {
        return this._runtime.selection.rangeOfCursor();
    }

    public rtl(value?) {
        return this._property({
            name: 'rtl',
            args: arguments,
            afterChange: (sender, args) => {
                this._runtime.direction.rtl(args.newValue);
                this._runtime.elements.root.addClass(args.newValue ? 'msoc-rtl' : 'msoc-ltr');
                this._runtime.elements.root.removeClass(args.newValue ? 'msoc-ltr' : 'msoc-rtl');
            }
        });
    }

    public addColumns(columnDefinitions) {
        var uniqueIds = [], columns = [];

        for (var i = 0; i < columnDefinitions.length; i++) {
            var columnDefinition = columnDefinitions[i];
            var columnIndex = this._options.columns.length;
            var columnUniqueId = this._generateColumnUniqueId();

            this._options.columns[columnUniqueId] = {
                columnUniqueId: columnUniqueId,
                cellRender: !!columnDefinition.cellRender ? columnDefinition.cellRender : new SimpleTextCellRender(),
                headerRender: !!columnDefinition.headerRender ? columnDefinition.headerRender : new SimpleTextHeaderRender(),
                cellEditor: columnDefinition.cellEditor,
                raw: columnDefinition,
            };

            uniqueIds.push(columnUniqueId);
            columns.push(this._options.columns[columnUniqueId]);
        }

        this._runtime.events.emit('addColumns', this, { columns: columns });
        return uniqueIds;
    }

    public updateUI(timeout = 0) {
        if (timeout) {
            if (!this._updateUIHandler) {
                this._updateUIHandler = window.setTimeout(() => {
                    this._updateUIHandler = null;
                    this._updateUIInternal();
                }, timeout);
            }
        } else {
            if (this._updateUIHandler) {
                window.clearTimeout(this._updateUIHandler);
                this._updateUIHandler = null;
            }

            this._updateUIInternal();
        }
    }

    public viewProperty(type: ViewType, name: string, value?: any) {
        return this._views[type].property.apply(this._views[type], Array.prototype.slice.call(arguments, 1));
    }

    public on(eventName, handler) {
        this._options.events.on(eventName, handler);
    }

    public off(eventName, handler) {
        this._options.events.off(eventName, handler);
    }

    public invalidateRow(rowIndex) {
        if (this._rendered) {
            this._views[this._runtime.viewType].invalidateRange(new Range(RangeType.Row, rowIndex, rowIndex, NaN, NaN));
        }
    }

    public invalidateHeaderRange(range: Range) {
        if (this._rendered) {
            this._views[this._runtime.viewType].invalidateHeaderRange(range);
        }
    }

    public invalidateHeaderCell(columnIndex) {
        if (this._rendered) {
            this._views[this._runtime.viewType].invalidateHeaderRange(new Range(RangeType.Range, 0, 0, columnIndex, columnIndex));
        }
    }

    public invalidate() {
        if (this._rendered) {
            this._views[this._runtime.viewType].invalidate();
        }
    }

    public invalidateRange(range) {
        if (this._rendered) {
            this._views[this._runtime.viewType].invalidateRange(range);
        }
    }

    public getColumnById(columnUniqueId) {
        return this._options.columns[columnUniqueId].raw;
    }

    public getColumnIdByIndex(columnIndex) {
        if (this._views[this._runtime.viewType]) {
            return this._views[this._runtime.viewType].getColumnIdByIndex(columnIndex);
        }
    }

    public getColumnIndexById(columnUniqueId) {
        if (this._views[this._runtime.viewType]) {
            return this._views[this._runtime.viewType].getColumnIndexById(columnUniqueId);
        }
    }

    public scrollTo(top, front) {
        this._scrollTo(top, front);
    }

    public getOperationName() {
        return this._runtime.operator.name();
    }

    public stopOperation() {
        return this._runtime.operator.stop();
    }

    private _initialize(parent) {
        this._lastColumnUniqueId = 0;
        this._lastRowUniqueId = 0;
        this._rowMap = {};
        this._rows = [];
        this._id = (new Date()).valueOf();
        this._options = new Fundamental.PropertyBag({
            columns: [],
            rows: [],
            rowCount: 0,
            theme: Theme.Default,
            selectionMode: SelectionMode.SingleRow,
            events: null,
            viewType: NaN,
            defaultViewType: ViewType.Table,
            rtl: false,
        });
        this._elements = {};
        this._runtime = {
            id: 'msocList_' + this._id,
            rootClass: 'msoc-list-' + this._id,
            options: this._options,
            elements: this._elements,
            owner: this,
            width: 0,
            height: 0,
            viewportScrollLeft: 0,
            viewportScrollCoordinate: new Microsoft.Office.Controls.Fundamental.Coordinate(Microsoft.Office.Controls.Fundamental.CoordinateType.ViewportRelative, 0, 0),
            events: null,
            viewType: NaN,
            operator: null,
            updateUI: () => this.updateUI.apply(this, arguments),
            direction: new Fundamental.TextDirection(Fundamental.TextDirection.LTR),
            updateSize: () => this._updateSize.apply(this, arguments),
            selection: new Selection(),
            scroll: () => this._scroll.apply(this, arguments),
            scrollIntoView: () => this._scrollIntoView.apply(this, arguments),
            scrollTo: () => this._scrollTo.apply(this, arguments),
            readerText: (text) => {
                this._elements.root.attr('aria-label', text);
                this._elements.screenReader.text(text);
            },
            buildCssRootSelector: (builder: Microsoft.Office.Controls.Fundamental.CssTextBuilder, additinalSelector: string) => {
                builder.push('.');
                builder.push(this._runtime.rootClass);
                builder.push('.msoc-list-view-');
                builder.push(ViewType[this._runtime.viewType].toLowerCase());

                if (additinalSelector) {
                    builder.push(additinalSelector);
                }

                builder.push(' ');
            },
            getRowByIndex: (rowIndex) => {
                if (typeof(this._options.rows[rowIndex]) != 'undefined') {
                    return {
                        rowIndex: rowIndex,
                        rowUniqueId: this._rows[rowIndex].rowUniqueId,
                        raw: this._options.rows[rowIndex],
                        core: this._rows[rowIndex],
                    };
                }
            },
            getRowByUniqueId: (rowUniqueId) => {
                if (typeof(this._rowMap[rowUniqueId]) != 'undefined') {
                    var rowIndex = this._rowMap[rowUniqueId];

                    return {
                        rowIndex: rowIndex,
                        rowUniqueId: rowUniqueId,
                        raw: this._options.rows[rowIndex],
                        core: this._rows[rowIndex],
                    };
                }
            },
            renderHeaderCellContent: (options) => this._renderHeaderCellContent(options),
            renderCellContent: (options) => this._renderCellContent(options),
        };

        this._elements.root = $(
            '<div class="msoc-list ' + this._runtime.rootClass + '" tabindex="0" aria-labelledby="msocListScreenReader_' + this._id + '">' +
                '<div id="msocListScreenReader_' + this._id + '" class="msoc-list-screen-reader" aria-live="assertive"></div>' +
                '<div class="msoc-list-content">' +
                    '<div class="msoc-list-header-viewport">' +
                        '<div class="msoc-list-header-canvas-container">' +
                            '<div class="msoc-list-header-canvas"></div>' +
                            '<div class="msoc-list-header-canvas"></div>' +
                            '<div class="msoc-list-header-canvas"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div name="msoc-list-viewport-' + this._id + '" class="msoc-list-viewport">' +
                        '<div class="msoc-list-canvas-container">' +
                            '<div class="msoc-list-canvas"></div>' +
                            '<div class="msoc-list-canvas"></div>' +
                            '<div class="msoc-list-canvas"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>');
        $(parent).append(this._elements.root);
        this._elements.headerViewport = this._elements.root.find('.msoc-list-header-viewport');
        this._elements.headerCanvasContainer = this._elements.root.find('.msoc-list-header-canvas-container');
        this._elements.headerCanvas = this._elements.root.find('.msoc-list-header-canvas');
        this._elements.viewport = this._elements.root.find('.msoc-list-viewport');
        this._elements.canvasContainer = this._elements.root.find('.msoc-list-canvas-container');
        this._elements.canvas = this._elements.root.find('.msoc-list-canvas');
        this._elements.screenReader = this._elements.root.find('> .msoc-list-screen-reader');

        this.disposer.addDisposable(this._updaters = new Microsoft.Office.Controls.Fundamental.UpdaterGroup());
        this.disposer.addDisposable(this._runtime.operator = new Operator());
        this.disposer.addDisposable(this._runtime.events = new Fundamental.EventSite());
        this.disposer.addDisposable(this._options.events = new Fundamental.EventSite());
        this.disposer.addDisposable(this._dynamicStylesheetUpdater = new Microsoft.Office.Controls.Fundamental.DynamicStylesheetUpdater(this._runtime.id));
        this._dynamicStylesheetUpdater.add(() => this._getStylesheet());

        this._updaters.add(this._dynamicStylesheetUpdater.getUpdater());

        this._views = {};
        this.disposer.addDisposable(this._views[ViewType.Table] = new TableView(this._runtime));
        this.disposer.addDisposable(this._views[ViewType.Stack] = new StackView(this._runtime));

        for (var viewType in this._views) {
            var view = this._views[viewType];

            this[view.name()] = view.controller();
        }

        this._attachEvents();
        this._rendered = false;
        this._pendingUpdateUI = false;

        window.setTimeout(() => {
            this._rendered = true;
            this._viewType(this._defaultViewType());

            // FIXME: [low][1 day] Add a firefox checker
            // Workaround FireFox bug https://bugzilla.mozilla.org/show_bug.cgi?id=706792
            this._elements.canvasContainer.css('width', '1000000px');
            this._elements.canvasContainer.css('height', '1000000px');
            this._elements.viewport.scrollLeft(0);
            this._elements.viewport.scrollTop(0);
            this._elements.canvasContainer.css('width', '');
            this._elements.canvasContainer.css('height', '');
            this._elements.headerCanvasContainer.css('width', '1000000px');
            this._elements.headerCanvasContainer.css('height', '1000000px');
            this._elements.headerViewport.scrollLeft(0);
            this._elements.headerViewport.scrollTop(0);
            this._elements.headerCanvasContainer.css('width', '');
            this._elements.headerCanvasContainer.css('height', '');

            if (this._pendingUpdateUI) {
                this.updateUI();
            } else {
                this.updateUI(1);
            }
        });
    }

    private _generateRowUniqueId() {
        return 'l' + this._id + '-r' + (this._lastRowUniqueId++);
    }

    private _generateColumnUniqueId() {
        return 'l' + this._id + '-c' + (this._lastColumnUniqueId++);
    }

    private _viewType(value?) {
        return this._property({
            name: 'viewType',
            args: arguments,
            afterChange: (sender, args) => {
                var oldValue = args.oldValue, newValue = args.newValue;

                if (!isNaN(oldValue)) {
                    this._elements.root.removeClass('msoc-list-view-' + this._views[oldValue].name());
                    this._runtime.operator.stop();
                    this._views[oldValue].deactivate();
                }

                if (this._views[newValue]) {
                    this._runtime.viewType = newValue;
                    this._elements.root.addClass('msoc-list-view-' + this._views[newValue].name());
                    this._views[newValue].activate();
                    this.updateUI(1);
                }
            },
        });
    }

    private _defaultViewType(value?) {
        return this._property({
            name: 'defaultViewType',
            args: arguments,
        });
    }

    private _invalidateRange(range: Range) {
        this._views[this._runtime.viewType].invalidateRange(range);
    }

    private _scrollIntoView(top, front, height, width) {
        var scrollWidth = this._runtime.canvasWidth;
        var scrollHeight = this._runtime.canvasHeight;
        var scrollFront = this._runtime.viewportScrollCoordinate.front();
        var scrollTop = this._runtime.viewportScrollCoordinate.top();
        var clientWidth = this._runtime.viewportClientWidth;
        var clientHeight = this._runtime.viewportClientHeight;
        var bottom = top + height;
        var end = front + width;

        top = top < 0 ? 0 : top;
        front = front < 0 ? 0 : front;
        bottom = bottom > scrollHeight ? scrollHeight : bottom;
        end = end > scrollWidth ? scrollWidth : end;

        var targetFront, targetTop;

        if (end > scrollFront + clientWidth) {
            targetFront = end - clientWidth;
        } else {
            targetFront = scrollFront;
        }

        if (front < targetFront) {
            targetFront = front;
        }

        if (bottom > scrollTop + clientHeight) {
            targetTop = bottom - clientHeight;
        } else {
            targetTop = scrollTop;
        }

        if (top < targetTop) {
            targetTop = top;
        }

        this._scrollTo(targetTop, targetFront);
    }

    private _scrollTo(top, front) {
        top = parseFloat(top);
        front = parseFloat(front);

        if (!isNaN(front)) {
            var scrollWidth = this._runtime.canvasWidth,
                clientWidth = this._runtime.viewportClientWidth;

            front = Math.max(0, Math.min(front, scrollWidth));

            if (this._runtime.direction.rtl()) {
                if (Fundamental.TextDirection.zeroEnd() == 'front' && Fundamental.TextDirection.scrollFrontDirection() == -1) {
                    // FireFox
                    this._elements.viewport.scrollLeft(-front);
                } else if (Fundamental.TextDirection.zeroEnd() == 'end' && Fundamental.TextDirection.scrollFrontDirection() == 1) {
                    // Chrome
                    this._elements.viewport.scrollLeft(scrollWidth - clientWidth - front);
                } else if (Fundamental.TextDirection.zeroEnd() == 'front' && Fundamental.TextDirection.scrollFrontDirection() == 1) {
                    // IE
                    this._elements.viewport.scrollLeft(front);
                } else {
                    // Unknown??
                    this._elements.viewport.scrollLeft(front - scrollWidth + clientWidth);
                }
            } else {
                this._elements.viewport.scrollLeft(front);
            }
        }

        if (!isNaN(top)) {
            this._elements.viewport.scrollTop(Math.max(0, Math.min(top, this._runtime.canvasHeight)));
        }
    }

    private _scroll(topOffset, frontOffset) {
        if (!!frontOffset) {
            if (this._runtime.direction.rtl()) {
                // FireFox & Chrome
                if (Fundamental.TextDirection.zeroEnd() == 'front' && Fundamental.TextDirection.scrollFrontDirection() == -1 ||
                    Fundamental.TextDirection.zeroEnd() == 'end' && Fundamental.TextDirection.scrollFrontDirection() == 1) {
                    frontOffset = -frontOffset;
                }
            }

            this._elements.viewport.scrollLeft(this._elements.viewport.scrollLeft() + frontOffset);
        }

        if (!!topOffset) {
            this._elements.viewport.scrollTop(this._elements.viewport.scrollTop() + topOffset);
        }
    }

    private _getStylesheet() {
        var cssText = new Microsoft.Office.Controls.Fundamental.CssTextBuilder();

        cssText.push('.');
        cssText.push(this._runtime.rootClass);
        cssText.property('width', this._runtime.width, 'px');
        cssText.property('height', this._runtime.height, 'px');
        cssText.property('background-color', this._options.theme.value('backgroundColor'));

        return cssText.toString();
    }

    private _updateSize() {
        this._runtime.viewportWidth = this._elements.viewport.width();
        this._runtime.viewportHeight = this._elements.viewport.height();
        this._runtime.viewportClientWidth = this._elements.viewport[0].clientWidth;
        this._runtime.viewportClientHeight = this._elements.viewport[0].clientHeight;
        this._runtime.canvasHeight = this._elements.canvasContainer.height();
        this._runtime.canvasWidth = this._elements.canvasContainer.width();
    }

    private _attachProxyEvent(sourceName, targetName, argsTransformer?) {
        this.disposer.addDisposable(
            new Fundamental.EventAttacher(
                this._runtime.events,
                sourceName,
                () => {
                    arguments[0] = this;

                    Array.prototype.unshift.call(arguments, targetName);

                    var newArgs = {}, oldArgs = arguments[2];

                    if (argsTransformer) {
                        argsTransformer(oldArgs, newArgs, true);
                        arguments[2] = newArgs;
                    }

                    var result = this._options.events.emit.apply(this._options.events, arguments);

                    if (argsTransformer) {
                        argsTransformer(oldArgs, newArgs, false);
                    }

                    return result;
                }));
    }

    private _attachEvents() {
        var scrollHandler = new Microsoft.Office.Controls.Fundamental.AccumulateTimeoutInvoker(() => {
            this.updateUI();
        }, 50); // 50 = 16.67 * 3, 20 fps

        this.disposer.addDisposable(new Fundamental.EventAttacher(this._elements.viewport, 'scroll',  (event) => {
            this._runtime.viewportScrollLeft = this._elements.viewport[0].scrollLeft;
            this._runtime.viewportScrollCoordinate = Microsoft.Office.Controls.Fundamental.CoordinateFactory.scrollFromElement(this._runtime.direction.rtl(), this._elements.viewport);
            this._runtime.events.emit('viewportScroll', this, null);
            scrollHandler.invoke();
        }));

        this.disposer.addDisposable(new Fundamental.EventAttacher(this._elements.root, 'keydown', (event) => {
            if (event.keyCode == 27) {
                this._runtime.operator.stop();
            }
        }));

        // We listen to mousedown event to fix the different behavior across the different browser.
        // Basicly, when user mouse down in the list control, the root element should get the focus.
        // It makes something, such as key event and screen reader, simple.
        // There is an exceptional case, we'll handle the focus in differnt way in edit mode, so we emit
        // an event to make sure we can cancel it in edit mode
        // FIXME: We should handle the case when user use keyboard to focus list control
        this.disposer.addDisposable(new Fundamental.EventAttacher(this._elements.root, 'mousedown',  (event) => {
            // Focus fix for IE, IE can focus on the cell element even if the tabindex of it is empty
            if (document.activeElement != this._runtime.elements.root[0] || event.target != this._runtime.elements.root[0]) {
                var args = {
                    event: event,
                    element: this._runtime.elements.root,
                    cancel: false,
                };
                this._runtime.events.emit('beforeMouseDownFocus', this, args);

                if (!args.cancel) {
                    args.element.focus();

                    // FIXME: [low][1 day] this is a firefox only event to fix the focus issue in firefox, add browser check
                    // In firefox, after we focused to a div, firefox will focus to document.body later.
                    // It is an behavior we don't want to do
                    event.preventDefault();
                }
            }
        }));
        this.disposer.addDisposable(new Fundamental.EventAttacher(this._runtime.selection, 'cursorChange', (sender, args) => {
            this._runtime.events.emit('cursorChange', this, args);
        }));
        this.disposer.addDisposable(new Fundamental.EventAttacher(this._runtime.selection, 'selectionChange', (sender, args) => {
            this._runtime.events.emit('selectionChange', this, args);
        }));
        this._attachProxyEvent('table.beforeRender stack.beforeRender', 'beforeRender');
        this._attachProxyEvent('table.rowClick stack.rowClick', 'rowClick');
        this._attachProxyEvent('table.headerRowClick', 'headerRowClick');
        this._attachProxyEvent('table.headerRowContextMenu', 'headerRowContextMenu');
        this._attachProxyEvent('table.beforeColumnReorder', 'beforeColumnReorder', (oldArgs, newArgs, from) => {
            if (from) {
                newArgs.fromColumnIndex = oldArgs.fromColumnIndex;
                newArgs.toColumnIndex = oldArgs.toColumnIndex;
                newArgs.cancel = oldArgs.cancel;
            } else {
                oldArgs.cancel = newArgs.cancel;
            }
        });
        this._attachProxyEvent('table.beforeCursorChange stack.beforeCursorChange', 'beforeCursorChange', (oldArgs, newArgs, from) => {
            if (from) {
                newArgs.rowIndex = oldArgs.newCursorPosition.rowIndex;
                newArgs.columnIndex = oldArgs.newCursorPosition.columnIndex;
                newArgs.cancel = oldArgs.cancel;
            } else {
                oldArgs.cancel = newArgs.cancel;
            }
        });
        this._attachProxyEvent('table.beforeDeselect', 'beforeDeselect', (oldArgs, newArgs, from) => {
            if (from) {
                newArgs.range = oldArgs.range;
                newArgs.cancel = oldArgs.cancel;
            } else {
                oldArgs.cancel = newArgs.cancel;
            }
        });
        this._attachProxyEvent('table.beforeSelect', 'beforeSelect', (oldArgs, newArgs, from) => {
            if (from) {
                newArgs.range = oldArgs.range;
                newArgs.reason = oldArgs.reason;
                newArgs.cancel = oldArgs.cancel;
            } else {
                oldArgs.cancel = newArgs.cancel;
            }
        });
        this._attachProxyEvent('cursorChange', 'cursorChange', (oldArgs, newArgs, from) => {
            if (from) {
                newArgs.rowIndex = oldArgs.newValue.rowIndex;
                newArgs.columnIndex = oldArgs.newValue.columnIndex;
            }
        });
        this._attachProxyEvent('selectionChange', 'selectionChange', (oldArgs, newArgs, from) => {
            if (from) {
                newArgs.selectedRanges = oldArgs.newValue.slice();
            }
        });
    }

    private _updateUIInternal() {
        if (this.disposer.isDisposed) {
            return;
        }

        if (this._rendered) {
            this._updaters.update();
            this._views[this._runtime.viewType].updateUI();
        } else {
            this._pendingUpdateUI = true;
        }
    }

    private _property(options) {
        if (this.disposer.isDisposed) {
            return;
        }

        var name = options.name,
            args = options.args,
            impactUI = typeof(options.impactUI) == 'undefined' ? true : options.impactUI,
            beforeChange = options.beforeChange,
            afterRead = options.afterRead,
            afterChange = options.afterChange;

        return this._options.$property({
            name: name,
            args: args,
            afterRead: (sender, args) => {
                if (afterRead) {
                    afterRead(sender, args);
                }

                return this._runtime.events.emit('propertyRead', this, args);
            },
            beforeChange: (sender, args) => {
                if (beforeChange) {
                    beforeChange(sender, args);
                }

                return this._runtime.events.emit('beforePropertyChange', this, args);
            },
            afterChange: (sender, args) => {
                if (afterChange) {
                    afterChange(sender, args);
                }

                if (impactUI) {
                    this.updateUI(1);
                }

                return this._runtime.events.emit('propertyChange', this, args);
            },
        });
    }

    private _renderCellContent(options) {
        var element = options.element,
            row = options.row,
            rowIndex = options.rowIndex,
            columnUniqueId = options.columnUniqueId,
            columnIndex = options.columnIndex,
            rowUniqueId = row.rowUniqueId,
            column = this._options.columns[columnUniqueId],
            render = column.cellRender,
            viewType = this._runtime.viewType,
            rect = options.rect;

        var promise = render.render({
            cellData: row.raw[column.raw.field],
            rowId: rowUniqueId,
            rowIndex: rowIndex,
            columnId: columnUniqueId,
            columnIndex: columnIndex,
            element: element,
            height: rect.height,
            rowData: row.raw,
            rtl: this._runtime.direction.rtl(),
            theme: this._options.theme,
            view: viewType,
            width: rect.width,
        });

        if (promise) {
            var rendered;

            promise.always(() => {
                if (rendered === false) {
                    var row = this._runtime.getRowByUniqueId(rowUniqueId),
                        columnIndex = this._views[viewType].getColumnIndexById(columnUniqueId);

                    if (row && !isNaN(columnIndex)) {
                        // In the case the _renderCellContent is finished and then we get a promise call
                        // We should invalidate the cell since the cell render it in async way
                        this._views[viewType].invalidateRange(new Range(RangeType.Range, row.rowIndex, row.rowIndex, columnIndex, columnIndex));
                    }
                }
            });

            rendered = false;
        }
    }

    private _renderHeaderCellContent(options) {
        var element = options.element,
            rowUniqueId = options.rowUniqueId,
            columnUniqueId = options.columnUniqueId,
            column = this._options.columns[columnUniqueId],
            render = column.headerRender,
            viewType = this._runtime.viewType,
            rect = options.rect;

        return render.render({
            columnUniqueId: columnUniqueId,
            data: column.raw.data,
            element: element,
            height: rect.height,
            rowUniqueId: rowUniqueId,
            rtl: this._runtime.direction.rtl(),
            theme: this._options.theme,
            view: viewType,
            width: rect.width,
        });
    }

    // FIXME: [high][3 days] select check box
    // FIXME: [midium][5 days] plug-ins mode
    // FIXME: [low][1 day] accessibility plug-ins
    // FIXME: [midium][15 days] freeze columns
    // FIXME: [high][2 days] UI Blocker
    // FIXME: [high][1 days] Coverage div for resizing operation
    // FIXME: [low][3 days] Implments data source
}

