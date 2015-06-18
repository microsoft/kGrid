class StackView implements IListView {
    public static MainCanvasIndex = 1;
    public static DefaultColumnHeight = 16;
    public disposer;
    private _runtime;
    private _options;
    private _properties;
    private _elements;
    private _visibleColumnMap;
    private _rowTopStylesheetUpdater;
    private _selectionStylesheetUpdater;
    private _layoutStylesheetUpdater;
    private _updaters;
    private _isActivate;
    private _renderRange;
    private _renderingScheduler;
    private _renderContext;
    private _renderRangeUpdater;
    private _layoutUpdater;

    constructor(runtime) {
        this.disposer = new Fundamental.Disposer(() => {
            this._isActivate = false;
            this._elements = null;
        });
        this._isActivate = false;
        this._properties = new Fundamental.PropertyBag({
            headerWidth: 100,
            selectionIndicator: false,
        });
        this._visibleColumnMap = [];
        this._runtime = runtime;
        this._options = this._runtime.options;
        this._elements = this._runtime.elements;
        this._updaters = new Support.UpdaterGroup();
        this.disposer.addDisposable(this._updaters);
        this.disposer.addDisposable(this._rowTopStylesheetUpdater = new Support.DynamicStylesheetUpdater(this._runtime.id + '_stack_render_row'));
        this.disposer.addDisposable(this._selectionStylesheetUpdater = new Support.DynamicStylesheetUpdater(this._runtime.id + '_stack_selection'));
        this.disposer.addDisposable(this._layoutStylesheetUpdater = new Support.DynamicStylesheetUpdater(this._runtime.id + '_stack_root'));
        this.disposer.addDisposable(this._renderingScheduler = new Support.RenderingScheduler());
        this._renderContext = {
            renderedRows: [],
        };
        this._renderingScheduler.addWorker((context) => this._renderCellWorker(context), this._renderContext, 1000);
        this._renderingScheduler.addWorker((context) => this._removeCellWorker(context), this._renderContext, 2000);
        this._renderingScheduler.start(false);

        this._selectionStylesheetUpdater.add(() => this._getSelectionStylesheet());
        this._layoutStylesheetUpdater.add(() => this._getLayoutStylesheet());
        this._rowTopStylesheetUpdater.add(() => this._getRowTopStylesheet());

        this._updaters.add(this._layoutUpdater = this._getLayoutUpdater());
        this._updaters.add(this._renderRangeUpdater = this._getRenderRangeUpdater());
        this._updaters.add(this._layoutStylesheetUpdater.getUpdater());
        this._updaters.add(this._rowTopStylesheetUpdater.getUpdater());
        this._updaters.add(this._selectionStylesheetUpdater.getUpdater());
        this._attachEvents();
    }

    public dispose() {
        this.disposer.dispose();
    }

    public name() {
        return 'stack';
    }

    public type() {
        return ViewType.Stack;
    }

    public activate() {
        if (this.disposer.isDisposed) {
            return;
        }

        this._isActivate = true;
        this._elements.headerViewport.css('display', 'none');
        this._elements.canvas.eq(StackView.MainCanvasIndex).addClass('msoc-list-canvas-primary');
        this._elements.headerCanvas.eq(StackView.MainCanvasIndex).addClass('msoc-list-canvas-primary');
        this._renderContext.renderedRows = [];
        this._renderContext.renderedHeaderCells = [];
        this._renderingScheduler.resume();
        this._renderRangeUpdater.update();
        this._runtime.selection.columnCount(1);
    }

    public deactivate() {
        if (this.disposer.isDisposed) {
            return;
        }

        this._elements.viewport.attr('style', '');
        this._elements.canvas.attr('style', '');
        this._elements.canvasContainer.attr('style', '');
        this._elements.headerViewport.attr('style', '');
        this._elements.headerCanvas.attr('style', '');
        this._elements.headerCanvasContainer.attr('style', '');

        this._elements.headerCanvas.eq(StackView.MainCanvasIndex).html('');
        this._elements.canvas.eq(StackView.MainCanvasIndex).html('');
        this._elements.canvas.eq(StackView.MainCanvasIndex).removeClass('msoc-list-canvas-primary');
        this._elements.headerCanvas.eq(StackView.MainCanvasIndex).removeClass('msoc-list-canvas-primary');
        this._updaters.reset();
        this._layoutStylesheetUpdater.reset();
        this._renderingScheduler.suspend(false);
        this._isActivate = false;
    }

    public updateUI() {
        if (!this._isFunctional()) {
            return false;
        }

        return this._updaters.update();
    }

    public controller() {
        return {
            headerWidth: () => this._headerWidth.apply(this, arguments),
            selectionIndicator: () => this._selectionIndicator.apply(this, arguments),
            columns: () => this._columns.apply(this, arguments),
            hideColumnByIndex: () => this._hideColumnByIndex.apply(this, arguments),
            showColumnByIndex: () => this._showColumnByIndex.apply(this, arguments),
            getColumnIdByIndex: () => this.getColumnIdByIndex.apply(this, arguments),
            getColumnIndexById: () => this.getColumnIndexById.apply(this, arguments),
        };
    }

    public invalidate() {
        this._invalidateRange(this._renderRange);
    }

    public invalidateRange(range: Range) {
        this._invalidateRange(range);
    }

    public invalidateHeaderRange(range: Range) {
        if (!range) {
            range = new Range(RangeType.Range, 0, 0, 0, this._visibleColumnMap.length - 1);
        }

        if (!range.isValid()) {
            return;
        }

        for (var columnIndex = range.front(); columnIndex < range.end(); columnIndex++) {
            var columnUniqueId = this._visibleColumnMap[columnIndex];

            this._invalidateHeaderCell(columnUniqueId);
        }
    }

    public getHeaderCellRect(rowIndex, columnUniqueId) {
        var columnIndex = this._visibleColumnMap.indexOf(columnUniqueId);

        if (rowIndex < 0 || isNaN(rowIndex) || rowIndex >= this._options.rowCount || columnIndex < 0 || isNaN(columnIndex) || columnIndex > this._visibleColumnMap.length - 1) {
            return {
                top: NaN,
                height: NaN,
                front: NaN,
                width: NaN,
            };
        }

        var rowHeight = this._getRowHeight(),
            selectionIndicatorWidth = this._options.theme.value('stack.selectionIndicatorWidth'),
            cellHBorder = this._options.theme.value('stack.cellHBorder'),
            column = this._options.columns[columnUniqueId],
            front = this._properties.selectionIndicator ? selectionIndicatorWidth : 0;

        return {
            top: rowIndex * rowHeight + rowIndex * cellHBorder.width + column.stack.top,
            height: this._getColumnHeight(columnUniqueId),
            front: front,
            width: this._properties.headerWidth,
        };
    }

    public getCellRect(rowIndex, columnUniqueId) {
        var columnIndex = this._visibleColumnMap.indexOf(columnUniqueId);

        if (rowIndex < 0 || isNaN(rowIndex) || rowIndex >= this._options.rowCount || columnIndex < 0 || isNaN(columnIndex) || columnIndex > this._visibleColumnMap.length - 1) {
            return {
                top: NaN,
                height: NaN,
                front: NaN,
                width: NaN,
            };
        }

        var rowHeight = this._getRowHeight(),
            selectionIndicatorWidth = this._options.theme.value('stack.selectionIndicatorWidth'),
            headerEndBorder = this._options.theme.value('stack.headerEndBorder'),
            cellHBorder = this._options.theme.value('stack.cellHBorder'),
            column = this._options.columns[columnUniqueId],
            front = this._properties.headerWidth + headerEndBorder.width + (this._properties.selectionIndicator ? selectionIndicatorWidth : 0);

        return {
            top: rowIndex * rowHeight + rowIndex * cellHBorder.width + column.stack.top,
            height: this._getColumnHeight(columnUniqueId),
            front: front,
            width: this._runtime.viewportClientWidth - front,
        };
    }

    public getColumnIndexById(columnUniqueId) {
        var index = this._visibleColumnMap.indexOf(columnUniqueId);

        return index >= 0 ? NaN : index;
    }

    public getColumnIdByIndex(columnIndex) {
        var columnUniqueId = this._visibleColumnMap[columnIndex]

        return columnUniqueId;
    }

    private _headerWidth() {
        return this._properties.$property({
            name: 'headerWidth',
            args: arguments,
            afterChange: () => {
                this._runtime.updateUI(1);
            },
        });
    }

    private _selectionIndicator() {
        return this._properties.$property({
            name: 'selectionIndicator',
            args: arguments,
            afterChange: () => {
                this._runtime.updateUI(1);
            },
        });
    }

    private _isFunctional() {
        return !this.disposer.isDisposed && this._isActivate;
    }

    private _attachEvent(site, name, callback, checkFuntional = true) {
        var actualCallback = callback;

        if (checkFuntional) {
            actualCallback = () => {
                if (!this._isFunctional()) {
                    return;
                }

                return callback.apply(null, arguments);
            };
        }

        this.disposer.addDisposable(new Fundamental.EventAttacher(site, name, actualCallback));
    }

    private _attachEvents() {
        this._attachEvent(this._runtime.events, 'addColumns', (sender, args) => {
            var columns = args.columns,
                lastColumn = this._visibleColumnMap.length > 0 ? this._options.columns[this._visibleColumnMap[this._visibleColumnMap.length - 1]] : null;

            for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                var column = columns[columnIndex];

                column.stack = {};

                if (this._visibleColumnMap.length >= 4) {
                    continue;
                }

                this._visibleColumnMap.push(column.columnUniqueId);

                if (column.raw.stack) {
                    if (isNaN(column.raw.stack.height)) {
                        column.stack.height = NaN;
                    } else if (column.raw.stack.height <= 0) {
                        throw Support.createError(0, 'StackView', 'invalid height: ' + column.raw.stack.height);
                    } else {
                        column.stack.height = column.raw.stack.height;
                    }
                }

                if (lastColumn) {
                    column.stack.top = lastColumn.stack.top + this._getColumnHeight(column.columnUniqueId) + this._options.theme.value('stack.rowBorder').width;
                } else {
                    column.stack.top = 0;
                }

                lastColumn = column;
            }

            this._renderRangeUpdater.update();

            if (this._isFunctional()) {
                this._runtime.selection.columnCount(this._visibleColumnMap.length);
            }
        }, false);

        this._attachEvent(this._runtime.events, 'selectionChange', () => this._selectionStylesheetUpdater.getUpdater().update());
        this._attachEvent(this._runtime.events, 'propertyChange', (sender, args) => this._propertyChange(sender, args));
        this._attachEvent(this._runtime.events, 'updateRows', (sender, args) => this._onUpdateRows(sender, args));
        this._attachEvent(this._runtime.events, 'removeRows', (sender, args) => this._onRemoveInsertRows.apply(this, arguments));
        this._attachEvent(this._runtime.events, 'insertRows', (sender, args) => this._onRemoveInsertRows.apply(this, arguments));
        this._attachEvent(this._runtime.events, 'updateHeaderCell', (sender, args) => this._invalidateHeaderCell(args.columnUniqueId));
        this._attachEvent(this._runtime.events, 'viewportScroll', (sender, args) => this._renderRangeUpdater.update());
        this._attachEvent(this._elements.viewport, 'click', (event) => this._viewportClick(event));
    }

    private _columns(columns?: any[]) {
        if (arguments.length > 0) {
            this._visibleColumnMap = [];

            for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                var columnUniqueId = columns[columnIndex].columnId, height = columns[columnIndex].height, column = this._options.columns[columnUniqueId];

                if (!column) {
                    throw Support.createError(0, 'StackView', 'invalid column id: ' + columnUniqueId);
                }

                if (typeof(height) != 'undefined') {
                    height = parseFloat(height);

                    if (isNaN(height)) {
                        column.stack.height = NaN;
                    } else if (height <= 0) {
                        throw Support.createError(0, 'StackView', 'invalid height: ' + columns[columnIndex].height);
                    } else {
                        column.stack.height = height;
                    }
                }

                this._visibleColumnMap.push(columnUniqueId);
            }

            this._updateColumnPosition();

            if (this._isFunctional()) {
                this._runtime.selection.columnCount(this._visibleColumnMap.length);
            }
        } else {
            var columns = [];
            for (var columnIndex = 0; columnIndex < this._visibleColumnMap.length; columnIndex++) {
                var columnUniqueId = this._visibleColumnMap[columnIndex], column = this._options.columns[columnUniqueId];

                columns.push({
                    columnId: columnUniqueId,
                    columnIndex: columnIndex,
                    height: column.stack.height,
                });
            }

            return columns;
        }
    }

    // FIXME: we should re-calculate the scroll top after show/hide column
    private _hideColumnByIndex(columnIndex) {
        if (columnIndex < 0 || columnIndex >= this._visibleColumnMap.length) {
            throw Support.createError(0, 'StackView', 'Invalidate columnIndex:' + columnIndex + ', validate range is [0, ' + this._visibleColumnMap.length + ']');
        }

        this._visibleColumnMap.splice(columnIndex, 1);
        this._renderRangeUpdater.update();
        this._runtime.updateUI(1);
    }

    private _showColumnByIndex(columnIndex, columnUniqueId) {
        if (columnIndex < 0 || columnIndex > this._visibleColumnMap.length) {
            throw Support.createError(0, 'StackView', 'Invalidate columnIndex:' + columnIndex + ', validate range is [0, ' + this._visibleColumnMap.length + ']');
        }

        var column = this._options.columns[columnUniqueId];

        if (!column) {
            throw Support.createError(0, 'StackView', 'Column with id ' + columnUniqueId + ' does not exist');
        }

        this._visibleColumnMap.splice(columnIndex, 0, columnUniqueId);
        this._renderRangeUpdater.update();
        this._runtime.updateUI(1);
    }

    private _getRowFromEvent(event) {
        var rowElement = $(event.target).closest('.msoc-list-row'),
            rowUniqueId = rowElement.attr('data-rowUniqueId'),
            row = this._runtime.getRowByUniqueId(rowUniqueId);

        if (row) {
            var rowIndex = row.rowIndex;

            return { rowElement: rowElement, rowIndex: rowIndex, rowUniqueId: rowUniqueId };
        }
    }

    private _viewportClick(event) {
        var cell = this._getRowFromEvent(event);

        if (!cell) {
            return;
        }

        var beforeCursorChangeArgs = {
                oldCursorPosition: this._runtime.selection.cursor(),
                newCursorPosition: new Position(cell.rowIndex, 0),
                cancel: false,
            };

        this._runtime.events.emit('stack.beforeCursorChange', this, beforeCursorChangeArgs);

        if (!beforeCursorChangeArgs.cancel) {
            this._runtime.selection.cursor(beforeCursorChangeArgs.newCursorPosition);
        }

        this._runtime.events.emit(
            'stack.rowClick',
            this,
            {
                rowIndex: cell.rowIndex,
                event: event,
            });
    }

    private _getRenderRange() {
        var topRow, bottomRow;

        topRow = Math.floor(this._runtime.viewportScrollCoordinate.top() / (this._getRowHeight() + this._options.theme.value('stack.rowBorder').width));
        topRow = Math.max(0, topRow);
        bottomRow = Math.floor((this._runtime.viewportScrollCoordinate.top() + this._runtime.viewportHeight) / (this._getRowHeight() + this._options.theme.value('stack.rowBorder').width));
        bottomRow = Math.min(this._options.rowCount - 1, bottomRow);

        return new Range(RangeType.Range, topRow, bottomRow, 0, this._visibleColumnMap.length - 1);
    }

    private _updateColumnPosition() {
        var cellHBorderWidth = this._options.theme.value('stack.cellHBorder').width, accumulateTop = 0;

        for (var i = 0; i < this._visibleColumnMap.length; i++) {
            var columnUniqueId = this._visibleColumnMap[i], column = this._options.columns[columnUniqueId];

            column.stack.top = accumulateTop;
            accumulateTop += this._getColumnHeight(columnUniqueId) + cellHBorderWidth;
        }

        this._renderRangeUpdater.update();
        this._runtime.updateUI(1);
    }

    private _getFullRange() {
        if (this._options.rowCount <= 0 || this._visibleColumnMap.length <= 0) {
            return new Range(RangeType.Range, NaN, NaN, NaN, NaN);
        }

        return new Range(RangeType.Range, 0, this._options.rowCount - 1, 0, 0);
    }

    private _getRenderRangeUpdater() {
        var eventSender = new Support.AccumulateTimeoutInvoker(() => {
            if (this._renderRange.isValid()) {
                this._runtime.events.emit(
                    'stack.beforeRender',
                    this,
                    {
                        renderRange: this._renderRange,
                    });
            }
        }, 16.67);

        return new Support.Updater(
            () => {
                var renderRange = this._getRenderRange();
                var rowUniqueIds = [];

                if (renderRange.isValid()) {
                    for (var rowIndex = renderRange.top(); rowIndex <= renderRange.bottom(); rowIndex++) {
                        var row = this._runtime.getRowByIndex(rowIndex);

                        if (row) {
                            rowUniqueIds.push(row.rowUniqueId);
                        }
                    }

                    rowUniqueIds.sort();
                }

                return {
                    renderRange: renderRange,
                    rowUniqueIds: rowUniqueIds,
                }
            },
            (newValue) => {
                var renderRange = newValue.renderRange;

                this._renderRange = renderRange;

                eventSender.invoke();
            });
    }

    private _propertyChange(sender, args) {
        switch (args.name) {
            case 'height':
            case 'width':
            case 'rowCount':
                this._renderRangeUpdater.update();
                break;

            case 'theme':
                this._invalidateRange(this._renderRange);
                this._updateColumnPosition();
                break;

            case 'rtl':
                this._invalidateRange(this._renderRange);
                break;
        }
    }

    private _onRemoveInsertRows(sender, args) {
        this._renderRangeUpdater.update();
        this._layoutUpdater.update();
        this._rowTopStylesheetUpdater.getUpdater().update();

        if (args.range.top() <= this._renderRange.bottom()) {
            this._adjustOddEvenRow();
        }
    }

    private _onUpdateRows(sender, args) {
        this._rowTopStylesheetUpdater.getUpdater().update();
        this._invalidateRows(args.range);
    }

    private _getColumnHeight(columnUniqueId) {
        var column = this._options.columns[columnUniqueId];

        return isNaN(column.stack.height) ? this._options.theme.value('stack.cellHeight') : column.stack.height;
    }

    private _getRowHeight() {
        var height = 0,
            rowPadding = this._options.theme.value('stack.rowPadding');

        for (var i = 0; i < this._visibleColumnMap.length; i++) {
            height += this._getColumnHeight(this._visibleColumnMap[i]);
        }

        height += rowPadding.top + rowPadding.bottom;

        return height;
    }

    private _getSelectionStylesheet() {
        if (!this._properties.selectionIndicator) {
            return;
        }

        var cssText = new Support.CssTextBuilder(),
            selectionBackgroundColor = this._options.theme.value('selectionBackgroundColor'),
            selectionIndicatorWidth = this._options.theme.value('stack.selectionIndicatorWidth'),
            selectionIndicatorPadding = this._options.theme.value('stack.selectionIndicatorPadding');

        if (this._runtime.selection.selectionMode() == SelectionMode.SingleRow
            || this._runtime.selection.selectionMode() == SelectionMode.MultipleRows)
        {
            var selectedRanges = this._runtime.selection.ranges();

            for (var selectedRangeIndex = 0; selectedRangeIndex < selectedRanges.length; selectedRangeIndex++) {
                var intersectionRange = Range.intersection(this._renderRange, selectedRanges[selectedRangeIndex]);

                if (intersectionRange) {
                    for (var rowIndex = intersectionRange.top(); rowIndex <= intersectionRange.bottom(); rowIndex++) {
                        var row = this._runtime.getRowByIndex(rowIndex);

                        if (!row) {
                            continue;
                        }

                        this._runtime.buildCssRootSelector(cssText);
                        cssText.push('.msoc-list-stack-row-');
                        cssText.push(row.rowUniqueId);
                        cssText.push('>.msoc-list-stack-row-selection');
                        cssText.property(this._runtime.direction.front(), selectionIndicatorPadding.front, 'px');
                        cssText.property('width', selectionIndicatorWidth - selectionIndicatorPadding.front - selectionIndicatorPadding.end, 'px');
                        cssText.property('top', selectionIndicatorPadding.top, 'px');
                        cssText.property('bottom', selectionIndicatorPadding.bottom, 'px');
                        cssText.property('background-color', selectionBackgroundColor);
                    }
                }
            }
        }

        return cssText.toString();
    }

    private _getLayoutStylesheet() {
        var cssText = new Support.CssTextBuilder(),
            headerCellPadding = this._options.theme.value('stack.headerCellPadding'),
            headerEndBorder = this._options.theme.value('stack.headerEndBorder'),
            cellPadding = this._options.theme.value('stack.cellPadding'),
            rowPadding = this._options.theme.value('stack.rowPadding'),
            rowBorder = this._options.theme.value('stack.rowBorder'),
            oddRowBackgroundColor = this._options.theme.value('table.oddRowBackgroundColor'),
            evenRowBackgroundColor = this._options.theme.value('table.evenRowBackgroundColor'),
            headerEndBorder = this._options.theme.value('stack.headerEndBorder'),
            rowHeight = this._getRowHeight(),
            selectionIndicatorWidth = this._options.theme.value('stack.selectionIndicatorWidth'),
            accumulateTop = rowPadding.top;

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row');
        cssText.property('height', rowHeight, 'px');

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-stack-header-cell');
        cssText.property(this._runtime.direction.front(), this._properties.selectionIndicator ? selectionIndicatorWidth : 0, 'px');
        cssText.property('width', this._properties.headerWidth - (this._properties.selectionIndicator ? selectionIndicatorWidth : 0), 'px');
        cssText.property('cursor', this._options.theme.value('stack.headerCursor'));

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-stack-header-cell-content');
        cssText.property('font-family', this._options.theme.value('stack.headerCellFontFamily'));
        cssText.property('font-size', this._options.theme.value('stack.headerCellFontSize'));
        cssText.property('top', 0, 'px');
        cssText.property(this._runtime.direction.front(), 0, 'px');
        cssText.property(this._runtime.direction.end(), 0, 'px');
        cssText.property('padding', this._runtime.direction.rtl() ? headerCellPadding.raw.rtl : headerCellPadding.raw.ltr);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-stack-cell');
        cssText.property(this._runtime.direction.front(), this._properties.headerWidth + this._options.theme.value('stack.headerHBorder').width, 'px');
        cssText.property(this._runtime.direction.end(), 0, 'px');
        cssText.property('cursor', this._options.theme.value('stack.cellCursor'));

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-stack-cell-content');
        cssText.property('font-family', this._options.theme.value('stack.cellFontFamily'));
        cssText.property('font-size', this._options.theme.value('stack.cellFontSize'));
        cssText.property('top', 0, 'px');
        cssText.property(this._runtime.direction.front(), 0, 'px');
        cssText.property(this._runtime.direction.end(), 0, 'px');
        cssText.property('padding', this._runtime.direction.rtl() ? cellPadding.raw.rtl : cellPadding.raw.ltr);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-stack-header-end-border');
        cssText.property(this._runtime.direction.front(), this._properties.headerWidth, 'px');
        cssText.property('width', headerEndBorder.width, 'px');
        cssText.property('border-' + this._runtime.direction.end(), headerEndBorder.raw);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-stack-row-border');
        cssText.property('top', rowHeight, 'px');
        cssText.property('width', '100%');
        cssText.property('border-bottom', rowBorder.raw);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row.msoc-list-odd');
        cssText.property('background-color', oddRowBackgroundColor);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row.msoc-list-even');
        cssText.property('background-color', evenRowBackgroundColor);

        for (var columnIndex = 0; columnIndex < this._visibleColumnMap.length; columnIndex++) {
            var columnUniqueId = this._visibleColumnMap[columnIndex],
                height = this._getColumnHeight(columnUniqueId);

            this._runtime.buildCssRootSelector(cssText);
            cssText.push('.msoc-list-stack-header-cell-');
            cssText.push(columnUniqueId);
            cssText.property('top', accumulateTop, 'px');
            cssText.property('height', height, 'px');

            this._runtime.buildCssRootSelector(cssText);
            cssText.push('.msoc-list-stack-header-cell-content-');
            cssText.push(columnUniqueId);
            cssText.property('height', height, 'px');
            cssText.property('line-height', height, 'px');

            this._runtime.buildCssRootSelector(cssText);
            cssText.push('.msoc-list-stack-cell-');
            cssText.push(columnUniqueId);
            cssText.property('top', accumulateTop, 'px');
            cssText.property('height', height, 'px');

            this._runtime.buildCssRootSelector(cssText);
            cssText.push('.msoc-list-stack-cell-content-');
            cssText.push(columnUniqueId);
            cssText.property('height', height, 'px');
            cssText.property('line-height', height, 'px');

            accumulateTop += height;
        };

        return cssText.toString();
    }

    private _getLayoutUpdater() {
        return new Support.Updater(
            () => {
                var viewportWidth = this._runtime.viewportWidth,
                    rowBorder = this._options.theme.value('stack.rowBorder'),
                    canvasHeight = this._options.rowCount * this._getRowHeight() + (this._options.rowCount - 1) * rowBorder.width;

                return {
                    width: this._runtime.width,
                    height: this._runtime.height,
                    viewportWidth: viewportWidth,
                    canvasHeight: canvasHeight,
                    rtl: this._runtime.direction.rtl(),
                };
            },
            (newValue, oldValue) => {
                var width = newValue.width,
                    height = newValue.height,
                    canvasHeight = newValue.canvasHeight;

                this._elements.viewport.css('overflow', 'auto');
                this._elements.viewport.css('position', 'absolute');
                this._elements.viewport.css('top', 0);
                this._elements.viewport.css('height', height + 'px');
                this._elements.viewport.css('width', '100%');
                this._elements.canvasContainer.css('height', canvasHeight);
                this._elements.canvasContainer.css('width', this._elements.viewport[0].clientWidth + 'px');

                if (newValue == oldValue && this._runtime.canvasHeight) {
                    var newScrollTop = Support.Calculator.calculateScrollTopAfterSwitchView(this._runtime.canvasHeight, newValue.canvasHeight, this._runtime.viewportClientHeight, this._elements.viewport[0].clientHeight, this._runtime.viewportScrollCoordinate.top());

                    this._elements.viewport.scrollTop(newScrollTop);
                    this._runtime.viewportScrollCoordinate.top(this._elements.viewport.scrollTop());
                }

                this._runtime.updateSize();
            });
    }

    private _getRowTopStylesheet() {
        var renderRange = this._renderRange,
            cssText = new Support.CssTextBuilder(),
            headerRowWidth = this._properties.headerWidth,
            rowBorder = this._options.theme.value('stack.rowBorder');

        for (var rowIndex = renderRange.top(); rowIndex <= renderRange.bottom(); rowIndex++) {
            var row = this._runtime.getRowByIndex(rowIndex);

            if (!row) {
                continue;
            }

            cssText.push('.msoc-list-stack-row-');
            cssText.push(row.rowUniqueId);
            cssText.property('top', rowIndex * this._getRowHeight() + rowIndex * rowBorder.width, 'px');
            cssText.property('height', this._getRowHeight(), 'px');
            cssText.property('width', '100', '%');
        }

        return cssText.toString();
    }

    private _invalidateHeader() {
        for (var i in this._renderContext.renderedHeaderCells) {
            var renderedHeaderCell = this._renderContext.renderedHeaderCells[i];

            if (renderedHeaderCell && renderedHeaderCell.state == RenderState.Painted) {
                renderedHeaderCell.state = RenderState.OutDated;
            }
        }
    }

    private _invalidateHeaderCell(columnUniqueId) {
        for (var i in this._renderContext.renderedRows) {
            var renderedRow = this._renderContext.renderedRows[i];

            if (renderedRow.RenderState == RenderState.Initial) {
                continue
            }

            var renderedHeaderCell = renderedRow.renderedHeaderCells[columnUniqueId];

            if (renderedHeaderCell.state == RenderState.Painted) {
                renderedHeaderCell.state = RenderState.OutDated;
            }
        }
    }

    private _invalidateColumn(columnUniqueId) {
        for (var i in this._renderContext.renderedRows) {
            var renderedRow = this._renderContext.renderedRows[i];

            if (renderedRow.RenderState == RenderState.Initial) {
                continue
            }

            var renderedCell = renderedRow.renderedCells[columnUniqueId];

            if (renderedCell && renderedCell.state == RenderState.Painted) {
                renderedCell.state = RenderState.OutDated;
            }
        }
    }

    private _invalidateRange(range) {
        if (!this._renderRange) {
            return;
        }

        var range = <any>Range.intersection(range, this._renderRange);

        if (!range) {
            return;
        }

        for (var rowIndex = range.top(); rowIndex <= range.bottom(); rowIndex++) {
            var row = this._runtime.getRowByIndex(rowIndex);

            if (!row) {
                return;
            }

            for (var columnIndex = range.front(); columnIndex <= range.end(); columnIndex++) {
                var columnUniqueId = this._visibleColumnMap[columnIndex];

                this._invalidateCell(row.rowUniqueId, columnUniqueId);
            }
        }
    }

    private _invalidateRows(range) {
        if (!this._renderRange) {
            return;
        }

        var range = <any>Range.intersection(range, this._renderRange);

        if (!range) {
            return;
        }

        for (var rowIndex = range.top(); rowIndex <= range.bottom(); rowIndex++) {
            var row = this._runtime.getRowByIndex(rowIndex);

            if (!row) {
                return;
            }

            this._invalidateRow(row.rowUniqueId);
        }
    }

    private _invalidateRow(rowUniqueId) {
        var renderedRow = this._renderContext.renderedRows[rowUniqueId];

        if (!renderedRow) {
            return;
        }

        for (var i in renderedRow.renderedCells) {
            var renderedCell = renderedRow.renderedCells[i];

            if (renderedCell.state == RenderState.Painted) {
                renderedCell.state = RenderState.OutDated;
            }
        }
    }

    private _invalidateCell(rowUniqueId, columnUniqueId) {
        var renderedCell = this._renderContext.renderedRows[rowUniqueId] ? this._renderContext.renderedRows[rowUniqueId].renderedCells[columnUniqueId] : null;

        if (renderedCell && renderedCell.state == RenderState.Painted) {
            renderedCell.state = RenderState.OutDated;
        }
    }

    private _adjustOddEvenRow() {
        for (var rowUniqueId in this._renderContext.renderedRows) {
            if (this._renderContext.renderedRows[rowUniqueId].state == RenderState.Painted) {
                var rowElement = this._renderContext.renderedRows[rowUniqueId].rowElement,
                    row = this._runtime.getRowByUniqueId(rowUniqueId);

                if (row) {
                    rowElement.removeClass('msoc-list-odd msoc-list-even');

                    if (row.rowIndex % 2 == 1) {
                        rowElement.addClass('msoc-list-odd');
                    } else {
                        rowElement.addClass('msoc-list-even');
                    }
                }
            }
        }
    }

    private _renderCellWorker(context) {
        var html = new Support.StringBuilder(),
            renderRange = this._renderRange;

        if (!renderRange || !renderRange.isValid()) {
            return;
        }

        for (var rowIndex = renderRange.top(); rowIndex <= renderRange.bottom(); rowIndex++) {
            var row = this._runtime.getRowByIndex(rowIndex);
            var painted = false;

            if (!row) {
                continue;
            }

            var rowUniqueId = row.rowUniqueId;

            if (!context.renderedRows[rowUniqueId]) {
                context.renderedRows[rowUniqueId] = {
                    state: RenderState.Initial,
                    rowElement: null,
                    renderedCells: {},
                    renderedHeaderCells: {},
                };
            }

            if (context.renderedRows[rowUniqueId].state == RenderState.Initial) {
                html.append('<div class="msoc-list-row msoc-list-stack-row-');
                html.append(row.rowUniqueId);

                if (row.rowIndex % 2 == 1) {
                    html.append(' msoc-list-odd');
                } else {
                    html.append(' msoc-list-even');
                }

                html.append('" data-rowUniqueId="');
                html.append(row.rowUniqueId);
                html.append('">');

                html.append('<div class="msoc-list-stack-row-border"></div>');
                html.append('<div class="msoc-list-stack-row-selection"></div>');
                html.append('<div class="msoc-list-stack-header-end-border"></div>');

                html.append('</div>');

                var mainCanvasDiv = this._elements.canvas[StackView.MainCanvasIndex];

                mainCanvasDiv.insertAdjacentHTML('beforeend', html.toString());
                context.renderedRows[rowUniqueId].rowElement = $(mainCanvasDiv.lastChild);
                context.renderedRows[rowUniqueId].state = RenderState.Painted;
                painted = true;
            }

            var rowElement = context.renderedRows[rowUniqueId].rowElement;
            var renderedCells = context.renderedRows[rowUniqueId].renderedCells;
            var renderedHeaderCells = context.renderedRows[rowUniqueId].renderedHeaderCells;
            var front = renderRange.front();
            var end = renderRange.end();

            html = new Support.StringBuilder();
            var addedColumnUniqueIds = [];

            for (var columnIndex = front; columnIndex <= end; columnIndex++) {
                var columnUniqueId = this._visibleColumnMap[columnIndex];

                if (!renderedCells[columnUniqueId]) {
                    renderedCells[columnUniqueId] = {
                        state: RenderState.Initial,
                        cellContentElement: null,
                    };

                    renderedHeaderCells[columnUniqueId] = {
                        state: RenderState.Initial,
                        cellContentElement: null,
                    };
                    html.append('<div class="msoc-list-stack-header-cell msoc-list-stack-header-cell-');
                    html.append(columnUniqueId);
                    html.append('">');
                    html.append('<div class="msoc-list-stack-header-cell-content msoc-list-stack-header-cell-content-');
                    html.append(columnUniqueId);
                    html.append('">');
                    html.append('</div>');
                    html.append('</div>');

                    html.append('<div class="msoc-list-stack-cell msoc-list-stack-cell-');
                    html.append(columnUniqueId);
                    html.append('">');
                    html.append('<div class="msoc-list-stack-cell-content msoc-list-stack-cell-content-');
                    html.append(columnUniqueId);
                    html.append('">');
                    html.append('</div>');
                    html.append('</div>');

                    addedColumnUniqueIds.push(columnUniqueId);
                }
            }

            var cellHtml = html.toString();

            if (cellHtml.length > 0) {
                rowElement[0].insertAdjacentHTML('beforeend', html.toString());

                var headerCellContentElements = rowElement.find('> .msoc-list-stack-header-cell > div');
                var cellContentElements = rowElement.find('> .msoc-list-stack-cell > div');

                for (var i = 0; i < addedColumnUniqueIds.length; i++) {
                    var columnUniqueId = addedColumnUniqueIds[i];

                    renderedCells[columnUniqueId].cellContentElement = cellContentElements[cellContentElements.length - addedColumnUniqueIds.length + i];
                    renderedHeaderCells[columnUniqueId].headerCellContentElement = headerCellContentElements[cellContentElements.length - addedColumnUniqueIds.length + i];
                }

                painted = true;
            }

            for (var i = <number>renderRange.front(); i<= renderRange.end(); i++) {
                var columnUniqueId = this._visibleColumnMap[i],
                    column = this._options.columns[columnUniqueId];

                if (renderedCells[columnUniqueId].state != RenderState.Painted) {
                    this._runtime.renderCellContent({
                        element: renderedCells[columnUniqueId].cellContentElement,
                        row: row,
                        rowIndex: rowIndex,
                        columnUniqueId: columnUniqueId,
                        columnIndex: this._visibleColumnMap.indexOf(columnUniqueId),
                        rect: this.getCellRect(row.rowUniqueId, columnUniqueId),
                    });

                    renderedCells[columnUniqueId].state = RenderState.Painted;
                    painted = true;
                }

                if (renderedHeaderCells[columnUniqueId].state != RenderState.Painted) {
                    this._runtime.renderHeaderCellContent({
                        element: renderedHeaderCells[columnUniqueId].headerCellContentElement,
                        rowUniqueId: row.rowUniqueId,
                        columnUniqueId: columnUniqueId,
                        rect: this.getHeaderCellRect(row.rowUniqueId, columnUniqueId),
                    });

                    renderedHeaderCells[columnUniqueId].state = RenderState.Painted;
                    painted = true;
                }
            }

            if (painted) {
                return true;
            }
        }
    }

    private _removeCellWorker(context) {
        for (var rowUniqueId in context.renderedRows) {
            rowUniqueId = rowUniqueId;
            var row = this._runtime.getRowByUniqueId(rowUniqueId);

            if (!row) {
                // In the case a row has been deleted from stack
                var rowElement = context.renderedRows[rowUniqueId].rowElement;

                if (rowElement) {
                    rowElement.remove();
                }

                delete context.renderedRows[rowUniqueId];
                return true;
            } else if (row.rowIndex < this._renderRange.top() || row.rowIndex > this._renderRange.bottom()) {
                // The row is not showed in the render area
                var rowElement = context.renderedRows[rowUniqueId].rowElement;

                if (rowElement) {
                    rowElement.remove();
                }

                delete context.renderedRows[rowUniqueId];
                return true;
            } else {
                var renderedCells = context.renderedRows[rowUniqueId].renderedCells;
                var renderedHeaderCells = context.renderedRows[rowUniqueId].renderedHeaderCells;
                var removed = false;

                for (var columnUniqueId in renderedCells) {
                    columnUniqueId = columnUniqueId;
                    var columnIndex = this._visibleColumnMap.indexOf(columnUniqueId);

                    if (columnIndex < this._renderRange.front() || columnIndex > this._renderRange.end()) {
                        var cellContentElement = renderedCells[columnUniqueId].cellContentElement;

                        if (cellContentElement) {
                            $(cellContentElement).parent().remove();
                        }

                        delete renderedCells[columnUniqueId];

                        var headerCellContentElement = renderedHeaderCells[columnUniqueId].headerCellContentElement;

                        if (headerCellContentElement) {
                            $(headerCellContentElement).parent().remove();
                        }

                        delete renderedHeaderCells[columnUniqueId];
                        removed = true;
                    }
                }

                if (removed) {
                    return true;
                }
            }
        }
    }
}

