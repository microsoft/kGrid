class TableView implements IListView {
    public static MainCanvasIndex = 1;
    public static CursorCanvasIndex = 2;
    public disposer;
    private _runtime;
    private _properties;
    private _options;
    private _elements;
    private _visibleColumnMap;
    private _dynamicStylesheetUpdater;
    private _rowTopStylesheetUpdater;
    private _selectionStylesheet;
    private _updaters;
    private _isActivate;
    private _renderRange;
    private _renderContext;
    private _cursorUpdater;
    private _selectionUpdater;
    private _renderRangeUpdater;
    private _renderingScheduler;
    private _layoutUpdater;

    constructor(runtime) {
        this._runtime = runtime;
        this._options = this._runtime.options;
        this._elements = this._runtime.elements;

        this.disposer = new Fundamental.Disposer(() => {
            this._isActivate = false;
            this._elements = null;
        });

        this._isActivate = false;
        this._properties = new Fundamental.PropertyBag();
        this._visibleColumnMap = [];
        this._renderRange = new Range(RangeType.Range, NaN, NaN, NaN, NaN);

        this.disposer.addDisposable(this._dynamicStylesheetUpdater = new Support.DynamicStylesheetUpdater(this._runtime.id + '_table_root'));
        this.disposer.addDisposable(this._rowTopStylesheetUpdater = new Support.DynamicStylesheetUpdater(this._runtime.id + '_table_render_row'));
        this.disposer.addDisposable(this._selectionStylesheet = new Support.DynamicStylesheet(this._runtime.id + '_table_selection'));
        this.disposer.addDisposable(this._updaters = new Support.UpdaterGroup());
        this.disposer.addDisposable(this._renderingScheduler = new Support.RenderingScheduler());

        this._renderContext = {
            renderedRows: [],
            renderedHeaderCells: [],
        };

        this._renderingScheduler.addWorker((context) => this._renderHeaderCellWorker(context), this._renderContext, 800);
        this._renderingScheduler.addWorker((context) => this._renderCellWorker(context), this._renderContext, 1000);
        this._renderingScheduler.addWorker((context) => this._removeCellWorker(context), this._renderContext, 2000);
        this._renderingScheduler.start(false);

        this._dynamicStylesheetUpdater.add(() => this._getLayoutStylesheet());
        this._dynamicStylesheetUpdater.add(() => this._getHoverStylesheet());
        this._rowTopStylesheetUpdater.add(() => this._getRowTopStylesheet());

        this._updaters.add(this._layoutUpdater = this._getLayoutUpdater());
        this._updaters.add(this._renderRangeUpdater = this._getRenderRangeUpdater());
        this._updaters.add(this._cursorUpdater = this._getCursorUpdater());
        this._updaters.add(this._selectionUpdater = this._getSelectionUpdater());
        this._updaters.add(this._rowTopStylesheetUpdater.getUpdater());
        this._updaters.add(this._dynamicStylesheetUpdater.getUpdater());

        this._attachEvents();
    }

    public dispose() {
        this.disposer.dispose();
    }

    public name() {
        return 'table';
    }

    public type() {
        return ViewType.Table;
    }

    public activate() {
        if (this.disposer.isDisposed) {
            return;
        }

        this._isActivate = true;
        this._elements.canvas.eq(TableView.MainCanvasIndex).addClass('msoc-list-canvas-primary');
        this._elements.headerCanvas.eq(TableView.MainCanvasIndex).addClass('msoc-list-canvas-primary');
        this._renderContext.renderedRows = [];
        this._renderContext.renderedHeaderCells = [];
        this._renderingScheduler.resume();
        this._renderRangeUpdater.update();
        this._runtime.selection.columnCount(this._visibleColumnMap.length);
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
        this._elements.headerCanvas.eq(TableView.MainCanvasIndex).html('');
        this._elements.canvas.eq(TableView.MainCanvasIndex).html('');
        this._elements.canvas.eq(TableView.CursorCanvasIndex).html('');
        this._elements.canvas.eq(TableView.MainCanvasIndex).removeClass('msoc-list-canvas-primary');
        this._elements.headerCanvas.eq(TableView.MainCanvasIndex).removeClass('msoc-list-canvas-primary');
        this._updaters.reset();
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
            columns: () => this._columns.apply(this, arguments),
            edit: () => this._edit.apply(this, arguments),
            hideColumnByIndex: () => this._hideColumnByIndex.apply(this, arguments),
            showColumnByIndex: () => this._showColumnByIndex.apply(this, arguments),
            getColumnIdByIndex: () => this.getColumnIdByIndex.apply(this, arguments),
            getColumnIndexById: () => this.getColumnIndexById.apply(this, arguments),
        };
    }

    public visibleColumnMap() {
        return this._visibleColumnMap;
    }

    public getHeaderCellElement(columnUniqueId) {
        var renderedHeaderCell = this._renderContext.renderedHeaderCells[columnUniqueId];

        if (!renderedHeaderCell) {
            return;
        }

        if (!renderedHeaderCell.cellElement) {
            renderedHeaderCell.cellElement = $(renderedHeaderCell.headerCellContentElement).parent();
        }

        return renderedHeaderCell.cellElement;
    }

    public getHeaderCellRect(columnUniqueId) {
        var headerRowHeight = this.getHeaderRowHeight(),
            column = this._options.columns[columnUniqueId];

        return {
            top: 0,
            height: headerRowHeight,
            front: column.table.front,
            width: this.getColumnWidth(columnUniqueId),
        };
    }

    public getHeaderRowHeight() {
        return this._options.theme.value('table.headerRowHeight');
    }

    public getColumnWidth(columnUniqueId) {
        var column = this._options.columns[columnUniqueId];

        return isNaN(column.table.width) ? this._options.theme.value('table.cellWidth') : column.table.width;
    }

    public getRowHeight() {
        return this._options.theme.value('table.rowHeight');
    }

    public getCellRect(rowIndex, columnIndex) {
        var rowHeight = this.getRowHeight(),
            cellHBorder = this._options.theme.value('table.cellHBorder');

        if (rowIndex < 0 || isNaN(rowIndex) || rowIndex >= this._options.rowCount || columnIndex < 0 || isNaN(columnIndex) || columnIndex > this._visibleColumnMap.length - 1) {
            return {
                top: NaN,
                height: NaN,
                front: NaN,
                width: NaN,
            };
        }

        var columnUniqueId = this._visibleColumnMap[columnIndex],
            column = this._options.columns[columnUniqueId];

        return {
            top: rowIndex * rowHeight + rowIndex * cellHBorder.width,
            height: rowHeight,
            front: column.table.front,
            width: this.getColumnWidth(columnUniqueId),
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

        for (var columnIndex = range.front(); columnIndex <= range.end(); columnIndex++) {
            var columnUniqueId = this._visibleColumnMap[columnIndex];

            this._invalidateHeaderCell(columnUniqueId);
        }
    }

    public getColumnIndexById(columnUniqueId) {
        var index = this._visibleColumnMap.indexOf(columnUniqueId);

        return index < 0 ? NaN : index;
    }

    public getColumnIdByIndex(columnIndex) {
        var columnUniqueId = this._visibleColumnMap[columnIndex]

        return columnUniqueId;
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
                this._visibleColumnMap.push(column.columnUniqueId);

                column.table = {};

                if (column.raw.table) {
                    if (isNaN(column.raw.table.width)) {
                        column.table.height = NaN;
                    } else if (column.raw.table.width <= 0) {
                        throw Support.createError(0, 'TableView', 'invalid width: ' + column.raw.table.width);
                    } else {
                        column.table.width = column.raw.table.width;
                    }
                }

                if (lastColumn) {
                    column.table.front = lastColumn.table.front + this.getColumnWidth(column.columnUniqueId) + this._options.theme.value('table.cellVBorder').width;
                } else {
                    column.table.front = 0;
                }

                lastColumn = column;
            }

            this._updateColumnPosition();
            this._renderRangeUpdater.update();

            if (this._isFunctional()) {
                this._runtime.selection.columnCount(this._visibleColumnMap.length);
            }
        }, false);

        this._attachEvent(this._runtime.events, 'selectionChange', () => this._selectionUpdater.update());
        this._attachEvent(this._runtime.events, 'selectionModeChange', () => this._selectionUpdater.update());
        this._attachEvent(this._runtime.events, 'viewportScroll', (sender, args) => this._syncHeaderHScroll(sender, args));
        this._attachEvent(this._runtime.events, 'propertyChange', (sender, args) => this._propertyChange(sender, args));
        this._attachEvent(this._runtime.events, 'updateRows', (sender, args) => this._onUpdateRows(sender, args));
        this._attachEvent(this._runtime.events, 'removeRows', (sender, args) => this._onRemoveInsertRows.apply(this, arguments));
        this._attachEvent(this._runtime.events, 'insertRows', (sender, args) => this._onRemoveInsertRows.apply(this, arguments));
        this._attachEvent(this._runtime.events, 'updateHeaderCell', (sender, args) => this._invalidateHeaderCell(args.columnUniqueId));
        this._attachEvent(this._runtime.events, 'cursorChange', (sender, args) => this._onCursorChange(args.newValue));
        this._attachEvent(this._elements.viewport, 'mousedown', (event) => this._viewportMouseDown(event));
        this._attachEvent(this._elements.viewport, 'click', (event) => this._viewportClick(event));
        this._attachEvent(this._elements.viewport, 'dblclick', (event) => this._viewportDblClick(event));
        this._attachEvent(this._elements.headerViewport, 'click', (event) => this._headerViewportClick(event));
        this._attachEvent(this._elements.headerViewport, 'contextmenu', (event) => this._headerViewportContextMenu(event));
        this._attachEvent(this._elements.headerViewport, 'mousedown', (event) => this._headerPointerDown(event));
        this._attachEvent(this._elements.headerViewport, 'touchstart', (event) => this._headerPointerDown(event));
        this._attachEvent(this._elements.root, 'keydown', (event) => this._rootKeyDown(event));
    }

    private _columns(columns?: any[]) {
        if (arguments.length > 0) {
            this._visibleColumnMap = [];

            for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                var columnUniqueId = columns[columnIndex].columnId, width = columns[columnIndex].width, column = this._options.columns[columnUniqueId];

                if (!column) {
                    throw Support.createError(0, 'TableView', 'invalid column id: ' + columnUniqueId);
                }

                if (typeof(width) != 'undefined') {
                    width = parseFloat(width);

                    if (isNaN(width)) {
                        column.table.width = NaN;
                    } else if (width <= 0) {
                        throw Support.createError(0, 'TableView', 'invalid width: ' + columns[columnIndex].width);
                    } else {
                        column.table.width = width;
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
                    width: column.table.width,
                });
            }

            return columns;
        }
    }

    private _edit(rowIndex, columnIndex) {
        this._startEditing('table.edit', rowIndex, columnIndex);
    }

    private _hideColumnByIndex(columnIndex) {
        if (columnIndex < 0 || columnIndex >= this._visibleColumnMap.length) {
            throw Support.createError(0, 'TableView', 'Invalidate columnIndex:' + columnIndex + ', validate range is [0, ' + this._visibleColumnMap.length + ']');
        }

        this._visibleColumnMap.splice(columnIndex, 1);
        this._runtime.selection.remove(new Range(RangeType.Column, NaN, NaN, columnIndex, columnIndex));
        this._updateColumnPosition();
        this._invalidateHeader();
        this._runtime.updateUI(1);
    }

    private _showColumnByIndex(columnIndex, columnUniqueId) {
        if (columnIndex < 0 || columnIndex > this._visibleColumnMap.length) {
            throw Support.createError(0, 'TableView', 'Invalidate columnIndex:' + columnIndex + ', validate range is [0, ' + this._visibleColumnMap.length + ']');
        }

        var column = this._options.columns[columnUniqueId];

        if (!column) {
            throw Support.createError(0, 'TableView', 'Column with id ' + columnUniqueId + ' does not exist');
        }

        this._visibleColumnMap.splice(columnIndex, 0, columnUniqueId);
        this._runtime.selection.insert(new Range(RangeType.Column, NaN, NaN, columnIndex, columnIndex));
        this._updateColumnPosition();
        this._invalidateHeader();
        this._runtime.updateUI(1);
    }

    private _onRemoveInsertRows(sender, args) {
        this._renderRangeUpdater.update();
        this._rowTopStylesheetUpdater.getUpdater().update();
        this._layoutUpdater.update();

        if (args.range.top() <= this._renderRange.bottom()) {
            this._adjustOddEvenRow();
        }
    }

    private _onUpdateRows(sender, args) {
        this._rowTopStylesheetUpdater.getUpdater().update();
        this._invalidateRows(args.range);
    }

    private _onCursorChange(cursor) {
        this._cursorUpdater.update();

        if (!cursor.isValid()) {
            return;
        }

        var rowIndex = cursor.rowIndex, columnIndex = cursor.columnIndex;

        var columnUniqueId = this._visibleColumnMap[columnIndex],
            column = this._options.columns[columnUniqueId],
            render = column.cellRender,
            row = this._options.rows[rowIndex];

        if (typeof(row) == 'undefined') {
            return;
        }

        this._runtime.readerText(render.title({
            view: this.type(),
            rowData: row,
            cellData: row[column.raw.field],
        }));
    }

    private _isFunctional() {
        return !this.disposer.isDisposed && this._isActivate;
    }

    private _rootKeyDown(event) {
        var shiftKey = event.shiftKey,
            currentCursor = this._runtime.selection.cursor(),
            newCursor,
            args;

        if (!shiftKey) {
            switch (event.which) {
                case 38:
                    // up
                    newCursor = this._runtime.selection.moveCursor(CursorMovement.Up);
                    break;

                case 40:
                    // down
                    newCursor = this._runtime.selection.moveCursor(CursorMovement.Down);
                    break;

                case 37:
                    // left
                    newCursor = this._runtime.selection.moveCursor(CursorMovement.Backward);
                    break;

                case 39:
                    // right
                    newCursor = this._runtime.selection.moveCursor(CursorMovement.Forward);
                    break;
            }

            if (newCursor) {
                args = { oldCursorPosition: currentCursor, newCursorPosition: newCursor, cancel: false };
                this._runtime.events.emit('table.beforeCursorChange', this, args);

                if (!args.cancel) {
                    var cellPosition = this.getCellRect(args.newCursorPosition.rowIndex, args.newCursorPosition.columnIndex);
                    this._runtime.selection.cursor(args.newCursorPosition);
                    this._runtime.scrollIntoView(cellPosition.top, cellPosition.front, cellPosition.height, cellPosition.width);
                }
            }
        }

        this._startKeySelect('table.keySelect', event);
    }

    private _getHeaderCellFromEvent(event) {
        var headerCellElement = $(event.target).closest('.msoc-list-table-header-cell');
        var columnUniqueId = headerCellElement.attr('data-columnUniqueId');

        if (!columnUniqueId) {
            return null;
        } else {
            return { headerCellElement: headerCellElement, columnUniqueId: columnUniqueId, columnIndex: this._visibleColumnMap.indexOf(columnUniqueId) };
        }
    }

    private _headerViewportClick(event) {
        var headerCell = this._getHeaderCellFromEvent(event);

        if (!headerCell) {
            return;
        }

        var columnUniqueId = headerCell.columnUniqueId,
            column = this._options.columns[columnUniqueId];

        this._runtime.events.emit(
            'table.headerRowClick',
            this,
            {
                columnId: headerCell.columnUniqueId,
                columnIndex: headerCell.columnIndex,
                column: column.raw,
                event: event,
            });
    }

    private _headerViewportContextMenu(event) {
        var headerCell = this._getHeaderCellFromEvent(event);

        if (!headerCell) {
            return;
        }

        var columnUniqueId = headerCell.columnUniqueId,
            column = this._options.columns[columnUniqueId];

        this._runtime.events.emit(
            'table.headerRowContextMenu',
            this,
            {
                columnUniqueId: columnUniqueId,
                column: column.raw,
                event: event,
            });
    }

    private _getCellFromEvent(event) {
        var cellElement = $(event.target).closest('.msoc-list-table-cell'),
            rowUniqueId = cellElement.attr('data-rowUniqueId'),
            columnUniqueId = cellElement.attr('data-columnUniqueId');

        if (!columnUniqueId || !rowUniqueId) {
            return null;
        } else {
            var rowIndex = this._runtime.getRowByUniqueId(rowUniqueId).rowIndex,
                columnIndex = this._visibleColumnMap.indexOf(columnUniqueId);

            return { cellElement: cellElement, rowIndex: rowIndex, rowUniqueId: rowUniqueId, columnUniqueId: columnUniqueId, columnIndex: columnIndex };
        }
    }

    private _viewportClick(event) {
        var cell = this._getCellFromEvent(event);

        if (!cell) {
            return;
        }

        var columnUniqueId = cell.columnUniqueId,
            column = this._options.columns[columnUniqueId],
            beforeCursorChangeArgs = {
                oldCursorPosition: this._runtime.selection.cursor(),
                newCursorPosition: new Position(cell.rowIndex, cell.columnIndex),
                cancel: false,
            };

        this._runtime.events.emit('table.beforeCursorChange', this, beforeCursorChangeArgs);

        if (!beforeCursorChangeArgs.cancel) {
            this._runtime.selection.cursor(beforeCursorChangeArgs.newCursorPosition);
        }

        this._runtime.events.emit(
            'table.rowClick',
            this,
            {
                rowIndex: cell.rowIndex,
                columnUniqueId: columnUniqueId,
                columnIndex: cell.columnIndex,
                column: column.raw,
                event: event,
            });
    }

    private _viewportDblClick(event) {
        // Left button
        if (event.which == 1) {
            var cell = this._getCellFromEvent(event);

            if (!cell) {
                return;
            }

            this._startEditing('table.edit', cell.rowIndex, cell.columnIndex);
        }
    }

    private _viewportMouseDown(event) {
        if (!this._isFunctional()) {
            return;
        }

        // Left button
        if (event.which == 1) {
            this._startMouseSelect('table.mouseSelect', event);
        }
    }

    // FIXME: [medium][5 days] Select by touch
    // FIXME: [high][3 days] Select by keyboard

    private _startKeySelect(name, event) {
        return this._runtime.operator.start(name, new TableViewKeySelectOperation(), this, this._runtime, event)
            .done((result) => {
                var args = {
                        range: result.range,
                        reason: 'keyboard',
                        cancel: false,
                    };

                this._runtime.events.emit(result.action == 'select' ? 'table.beforeSelect' : 'table.beforeDeselect', this, args);

                if (!args.cancel) {
                    if (result.action == 'select') {
                        this._runtime.selection.select(args.range, true);
                    } else {
                        this._runtime.selection.deselect(args.range);
                    }

                    this._selectionUpdater.update();
                }
            });
    }

    private _startMouseSelect(name, event) {
        return this._runtime.operator.start(name, new TableViewMouseSelectOperation(), this, this._runtime, event, this._selectionUpdater)
            .done((result) => {
                var args = {
                        range: result.range,
                        reason: 'mouse',
                        cancel: false,
                    };

                this._runtime.events.emit(result.action == 'select' ? 'table.beforeSelect' : 'table.beforeDeselect', this, args);

                if (!args.cancel) {
                    if (result.action == 'select') {
                        this._runtime.selection.select(args.range, false);
                    } else {
                        this._runtime.selection.deselect(args.range);
                    }

                    this._selectionUpdater.update();
                }
            });
    }

    private _headerPointerDown(event) {
        if (!this._isFunctional()) {
            return;
        }

        if (!Support.BrowserDetector.isTouchEvent(event.type) && event.which != 1) {
            // Not mouse left button down or touch down
            return;
        }

        var headerCellElement = $(event.target).closest('.msoc-list-table-header-cell');
        var headerCellSplitterElement = $(event.target).closest('.msoc-list-table-header-cell-splitter');

        if (headerCellElement.length > 0) {
            if (headerCellSplitterElement.length > 0) {
                var columnUniqueId = headerCellElement.attr('data-columnUniqueId');

                if (headerCellSplitterElement.hasClass('msoc-list-table-header-cell-splitter-front')) {
                    var columnIndex = this._visibleColumnMap.indexOf(columnUniqueId);

                    columnUniqueId = this._visibleColumnMap[columnIndex - 1];
                }
                this._startResizeColumn('table.resizeColumn', columnUniqueId, event);
            } else {
                this._startReorderColumn('table.reorderColumn', headerCellElement, event);
            }
        }
    }

    private _startEditing(name, rowIndex, columnIndex) {
        return this._runtime.operator.start(name, new TableViewEditOperation(), this, this._runtime, rowIndex, columnIndex)
        .done((newValue) => {
            var row = this._options.rows[rowIndex],
                columnUniqueId = this._visibleColumnMap[columnIndex],
                column = this._options.columns[columnUniqueId],
                rowUniqueId = this._runtime.getRowByIndex(rowIndex).rowUniqueId;

            row[column.raw.field] = newValue;

            this._invalidateCell(rowUniqueId, columnUniqueId);
        });
    }

    private _startResizeColumn(name, columnUniqueId, event) {
        var isTouch = Support.BrowserDetector.isTouchEvent(event.type);
        var pointerId = Support.BrowserDetector.getChangedPointerIdentifier(event);
        var pointers = Support.CoordinateFactory.fromEvent(this._runtime.direction.rtl(), event);
        var column = this._options.columns[columnUniqueId];

        return this._runtime.operator.start(name, new TableViewResizeColumnOperation(), this, this._runtime, columnUniqueId, isTouch, pointerId, pointers, column.table.front, this.getColumnWidth(columnUniqueId), this._selectionStylesheet)
        .done((columnUniqueId, width) => {
            column.table.width = width;
            this._updateColumnPosition();
            this._invalidateColumn(columnUniqueId);
            this._runtime.updateUI(1);
        });
    }

    private _startReorderColumn(name, headerCellElement, event) {
        var isTouch = Support.BrowserDetector.isTouchEvent(event.type);
        var pointerId = Support.BrowserDetector.getChangedPointerIdentifier(event)[0];
        var coordinate = Support.CoordinateFactory.fromEvent(this._runtime.direction.rtl(), event)[pointerId];

        return this._runtime.operator.start(name, new TableViewReorderColumnOperation(), this, this._runtime, headerCellElement, isTouch, pointerId, coordinate, this._selectionStylesheet)
        .done((oldColumnIndex, newColumnIndex) => {
            if (oldColumnIndex == 0 || newColumnIndex == 0) {
                var headerCellElement = this.getHeaderCellElement(this._visibleColumnMap[0]);

                if (headerCellElement) {
                    headerCellElement.removeClass('msoc-list-table-header-cell-first');
                }
            }

            var columnUniqueId = this._visibleColumnMap.splice(oldColumnIndex, 1)[0];

            this._visibleColumnMap.splice(newColumnIndex - (oldColumnIndex < newColumnIndex ? 1 : 0), 0, columnUniqueId);

            if (oldColumnIndex == 0 || newColumnIndex == 0) {
                var headerCellElement = this.getHeaderCellElement(this._visibleColumnMap[0]);

                if (headerCellElement) {
                    headerCellElement.addClass('msoc-list-table-header-cell-first');
                }
            }

            this._updateColumnPosition();
            this._runtime.updateUI(1);
        });
    }

    private _getRenderRange() {
        var topRow, bottomRow, frontColumn, endColumn;
        var viewportScrollCoordinateFront = this._runtime.viewportScrollCoordinate.front();

        topRow = Math.floor(this._runtime.viewportScrollCoordinate.top() / (this.getRowHeight() + this._options.theme.value('table.cellHBorder').width));
        topRow = Math.max(0, topRow);
        bottomRow = Math.floor((this._runtime.viewportScrollCoordinate.top() + this._runtime.viewportHeight) / (this.getRowHeight() + this._options.theme.value('table.cellHBorder').width));
        bottomRow = Math.min(this._options.rowCount - 1, bottomRow);
        frontColumn = 0;
        endColumn = this._visibleColumnMap.length - 1;

        for (var columnIndex = 0; columnIndex < this._visibleColumnMap.length; columnIndex++) {
            var column = this._options.columns[this._visibleColumnMap[columnIndex]],
                front = column.table.front;

            if (front <= viewportScrollCoordinateFront) {
                frontColumn = columnIndex;
            }

            if (front < viewportScrollCoordinateFront + this._runtime.viewportClientWidth) {
                endColumn = columnIndex;
            } else {
                break;
            }
        }

        return new Range(RangeType.Range, topRow, bottomRow, frontColumn, endColumn);
    }

    private _updateColumnPosition() {
        var cellVBorderWidth = this._options.theme.value('table.cellVBorder').width, accumulateFront = 0;

        for (var i = 0; i < this._visibleColumnMap.length; i++) {
            var columnUniqueId = this._visibleColumnMap[i], column = this._options.columns[columnUniqueId];

            column.table.front = accumulateFront;
            accumulateFront += this.getColumnWidth(columnUniqueId) + cellVBorderWidth;
        }

        this._renderRangeUpdater.update();
    }

    private _getFullRange() {
        if (this._options.rowCount <= 0 || this._visibleColumnMap.length <= 0) {
            return new Range(RangeType.Range, NaN, NaN, NaN, NaN);
        }

        return new Range(RangeType.Range, 0, this._options.rowCount - 1, 0, this._visibleColumnMap.length - 1);
    }

    private _getRenderRangeUpdater() {
        var eventSender = new Support.AccumulateTimeoutInvoker(() => {
            if (this._renderRange.isValid()) {
                this._runtime.events.emit(
                    'table.beforeRender',
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

    private _syncHeaderHScroll(sender, args) {
        this._elements.headerViewport.scrollLeft(this._runtime.viewportScrollLeft);
        this._renderRangeUpdater.update();
    }

    private _propertyChange(sender, args) {
        switch (args.name) {
            case 'width':
            case 'height':
            case 'rowCount':
                this._renderRangeUpdater.update();
                break;

            case 'theme':
                this._invalidateHeader();
                this._invalidateRange(this._renderRange);
                this._updateColumnPosition();
                break;

            case 'rtl':
                this._invalidateHeader();
                this._invalidateRange(this._renderRange);
                break;
        }
    }

    private _getSelectionUpdater() {
        return new Support.Updater(
            () => {
                var rowUniqueIdMap = {},
                    rowUniqueIds = [],
                    columnUniqueIdMap = {},
                    columnUniqueIds = [],
                    ranges = this._runtime.selection.ranges();

                for (var rangeIndex = 0; rangeIndex < ranges.length; rangeIndex++) {
                    var range = ranges[rangeIndex];

                    if (range.type() == RangeType.Row || range.type() == RangeType.Range) {
                        for (var rowIndex = range.top(); rowIndex <= range.bottom(); rowIndex++) {
                            var row = this._runtime.getRowByIndex(rowIndex);

                            if (row) {
                                rowUniqueIdMap[row.rowUniqueId] = 1;
                            }
                        }
                    }

                    if (range.type() == RangeType.Column || range.type() == RangeType.Range) {
                        for (var columnIndex = range.front(); columnIndex <= range.end(); columnIndex++) {
                            columnUniqueIdMap[this._visibleColumnMap[columnIndex]] = 1;
                        }
                    }
                }

                for (var rowUniqueId in rowUniqueIdMap) {
                    rowUniqueIds.push(rowUniqueId);
                }

                rowUniqueIds.sort();

                for (var columnUniqueId in columnUniqueIdMap) {
                    columnUniqueIds.push(columnUniqueId);
                }

                columnUniqueIds.sort();

                return {
                    ranges: this._runtime.selection.ranges(),
                    rowUniqueIds: rowUniqueIds,
                    columnUniqueIds: columnUniqueIds,
                    rtl: this._runtime.direction.rtl(),
                    color: this._options.theme.value('selectionBackgroundColor'),
                }
            },
            (newValue) => {
                var selectedRanges = newValue.ranges
                var cssText = new Support.CssTextBuilder();
                var color = newValue.color;

                for (var i = 0; i < selectedRanges.length; i++) {
                    var range = selectedRanges[i];

                    switch (range.type()) {
                        case RangeType.Row:
                            for (var rowIndex = range.top(); rowIndex <= range.bottom(); rowIndex++) {
                                var row = this._runtime.getRowByIndex(rowIndex);

                                if (!row) {
                                    continue;
                                }

                                this._runtime.buildCssRootSelector(cssText);
                                cssText.push('.msoc-list-row.msoc-list-table-row-');
                                cssText.push(row.rowUniqueId);
                                cssText.push(',');
                                this._runtime.buildCssRootSelector(cssText);
                                cssText.push('.msoc-list-row.msoc-list-table-row-');
                                cssText.push(row.rowUniqueId);
                                cssText.push('>.msoc-list-table-cell,');
                                this._runtime.buildCssRootSelector(cssText);
                                cssText.push('.msoc-list-row.msoc-list-table-row-');
                                cssText.push(row.rowUniqueId);
                                cssText.push(':hover>.msoc-list-table-cell');
                                cssText.property('background-color', color);
                            }

                            break;

                        case RangeType.Column:
                            for (var columnIndex = range.front(); columnIndex <= range.front(); columnIndex++) {
                                var columnUniqueId = this._visibleColumnMap[columnIndex];


                                this._runtime.buildCssRootSelector(cssText);
                                cssText.push('.msoc-list-header-canvas>.msoc-list-table-header-cell-');
                                cssText.push(columnUniqueId);
                                cssText.push(',');
                                this._runtime.buildCssRootSelector(cssText);
                                cssText.push('.msoc-list-row>.msoc-list-table-cell-');
                                cssText.push(columnUniqueId);
                                cssText.push(',');
                                this._runtime.buildCssRootSelector(cssText);
                                cssText.push('.msoc-list-row>.msoc-list-table-cell-');
                                cssText.push(columnUniqueId);
                                cssText.push(':hover');
                                cssText.property('background-color', color);
                            }

                            break;

                        case RangeType.Range:
                            for (var rowIndex = range.top(); rowIndex <= range.bottom(); rowIndex++) {
                                for (var columnIndex = range.front(); columnIndex <= range.end(); columnIndex++) {
                                    var columnUniqueId = this._visibleColumnMap[columnIndex];
                                    var row = this._runtime.getRowByIndex(rowIndex);

                                    if (!row) {
                                        continue;
                                    }

                                    this._runtime.buildCssRootSelector(cssText);
                                    cssText.push('.msoc-list-row.msoc-list-table-row-');
                                    cssText.push(row.rowUniqueId);
                                    cssText.push('>.msoc-list-table-cell-');
                                    cssText.push(columnUniqueId);
                                    cssText.push(',');
                                    this._runtime.buildCssRootSelector(cssText);
                                    cssText.push('.msoc-list-row.msoc-list-table-row-');
                                    cssText.push(row.rowUniqueId);
                                    cssText.push(':hover>.msoc-list-table-cell-');
                                    cssText.push(columnUniqueId);
                                    cssText.property('background-color', color);
                                }
                            }
                            break;
                    }
                }

                this._selectionStylesheet.content(cssText.toString());
            });
    }

    private _getLayoutUpdater() {
        return new Support.Updater(
            () => {
                var lastColumnIndex = this._visibleColumnMap.length - 1,
                    rowHeight = this.getRowHeight(),
                    rowCount = this._options.rowCount,
                    cellHBorder = this._options.theme.value('table.cellHBorder'),
                    canvasEndMargin = this._options.theme.value('table.canvasEndMargin'),
                    canvasBottomMargin = this._options.theme.value('table.canvasBottomMargin'),
                    lastColumn = this._options.columns[this._visibleColumnMap[this._visibleColumnMap.length - 1]];

                return {
                    headerRowHeight: this.getHeaderRowHeight(),
                    headerBottomBorderHeight: this._options.theme.value('table.headerBottomBorder').width,
                    height: this._options.height,
                    width: this._options.width,
                    canvasWidth: lastColumnIndex < 0 ? 0 : lastColumn.table.front + this.getColumnWidth(lastColumn.columnUniqueId) + canvasEndMargin,
                    canvasHeight: rowCount == 0 ? 0 : rowCount * rowHeight + (rowCount - 1) * cellHBorder.width + canvasBottomMargin,
                    rtl: this._runtime.direction.rtl(),
                };
            },
            (newValue, oldValue) => {
                var headerRowHeight = newValue.headerRowHeight;
                var headerBottomBorderHeight = newValue.headerBottomBorderHeight;
                var width = newValue.width;
                var height = newValue.height;
                var canvasHeight = newValue.canvasHeight;
                var canvasWidth = newValue.canvasWidth;

                this._elements.viewport.css('overflow', 'auto');
                this._elements.viewport.css('position', 'absolute');
                this._elements.viewport.css('top', (headerRowHeight + headerBottomBorderHeight) + 'px');
                this._elements.viewport.css('height', (height - headerRowHeight - headerBottomBorderHeight) + 'px');
                this._elements.viewport.css(this._runtime.direction.front(), '0px');
                this._elements.viewport.css('width', '100%');
                this._elements.canvasContainer.css('height', canvasHeight + 'px');

                var viewportClientWidth = this._elements.viewport[0].clientWidth;

                if (viewportClientWidth > canvasWidth) {
                    this._elements.canvasContainer.css('width', viewportClientWidth + 'px');
                } else {
                    this._elements.canvasContainer.css('width', canvasWidth + 'px');
                }

                if (newValue == oldValue && this._runtime.canvasHeight) {
                    var newScrollTop = Support.Calculator.calculateScrollTopAfterSwitchView(this._runtime.canvasHeight, newValue.canvasHeight, this._runtime.viewportClientHeight, this._elements.viewport[0].clientHeight, this._runtime.viewportScrollCoordinate.top());

                    this._elements.viewport.scrollTop(newScrollTop);
                    this._runtime.viewportScrollCoordinate.top(this._elements.viewport.scrollTop());
                }

                this._elements.headerViewport.css('overflow', 'hidden');
                this._elements.headerViewport.css('position', 'absolute');
                this._elements.headerViewport.css('width', '100%');
                this._elements.headerViewport.css('height', (headerRowHeight + headerBottomBorderHeight) + 'px');

                if (viewportClientWidth > canvasWidth) {
                    this._elements.headerCanvasContainer.css('width', viewportClientWidth + 'px');
                } else {
                    this._elements.headerCanvasContainer.css('width', canvasWidth + 'px');
                }

                this._elements.headerCanvasContainer.css('height', (headerRowHeight + headerBottomBorderHeight) + 'px');
                this._elements.headerViewport.css(this._runtime.direction.front(), 0 + 'px');

                var headerBottomBorder = this._elements.headerCanvas.eq(TableView.MainCanvasIndex).find('> .msoc-list-table-header-bottom-border');

                if (headerBottomBorder.length == 0) {
                    this._elements.headerCanvas.eq(TableView.MainCanvasIndex).append('<div class="msoc-list-table-header-bottom-border"></div>');
                }

                this._runtime.updateSize();
            });
    }

    private _getRowTopStylesheet() {
        var renderRange = this._renderRange, cssText = new Support.CssTextBuilder();

        for (var rowIndex = renderRange.top(); rowIndex <= renderRange.bottom(); rowIndex++) {
            var row = this._runtime.getRowByIndex(rowIndex);

            if (!row) {
                continue;
            }

            var cellRect = this.getCellRect(rowIndex, 0);

            this._runtime.buildCssRootSelector(cssText);
            cssText.push('.msoc-list-row.msoc-list-table-row-');
            cssText.push(row.rowUniqueId);
            cssText.property('top', cellRect.top, 'px');
            cssText.property('display', 'block');
        }

        return cssText.toString();
    }

    private _getCursorUpdater() {
        return new Support.Updater(
            () => {
                var cursor = this._runtime.selection.cursor();

                return {
                    cellRect: this.getCellRect(cursor.rowIndex, cursor.columnIndex),
                    thickness: this._options.theme.value('table.cursorBorder').width,
                    color: this._options.theme.value('table.cursorBorder').color,
                    style: this._options.theme.value('table.cursorBorder').style,
                    cursor: this._options.theme.value('table.cellCursor'),
                    rtl: this._runtime.direction.rtl(),
                }
            },
            (newValue) => {
                var cellRect = newValue.cellRect,
                    thickness = newValue.thickness,
                    color = newValue.color,
                    style = newValue.style,
                    cursor = newValue.cursor,
                    canvas = this._elements.canvas.eq(TableView.CursorCanvasIndex),
                    elements = canvas.find('.msoc-list-table-cursor');

                if (elements.length == 0) {
                    elements = $('<div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div>');
                    canvas.append(elements);
                }

                if (cellRect == null || isNaN(cellRect.width) || cellRect.width < 2 * thickness || cellRect.height < 2 * thickness) {
                    elements.hide();
                } else {
                    elements.show();
                    elements.css('cursor', cursor);
                    elements.css('border', '');
                    elements.eq(0).css('top', cellRect.top + 'px');
                    elements.eq(0).css('height', thickness + 'px');
                    elements.eq(0).css(this._runtime.direction.front(), cellRect.front + 'px');
                    elements.eq(0).css(this._runtime.direction.end(), '');
                    elements.eq(0).css('width', cellRect.width + 'px');
                    elements.eq(0).css('border-top-width', thickness + 'px');
                    elements.eq(0).css('border-top-color', color);
                    elements.eq(0).css('border-top-style', style);

                    elements.eq(1).css('top', cellRect.top + 'px');
                    elements.eq(1).css('height', cellRect.height + 'px');
                    elements.eq(1).css(this._runtime.direction.front(), (cellRect.front + cellRect.width - thickness) + 'px');
                    elements.eq(1).css(this._runtime.direction.end(), '');
                    elements.eq(1).css('width', thickness + 'px');
                    elements.eq(1).css('border-' + this._runtime.direction.end() + '-width', thickness + 'px');
                    elements.eq(1).css('border-' + this._runtime.direction.end() + '-color', color);
                    elements.eq(1).css('border-' + this._runtime.direction.end() + '-style', style);

                    elements.eq(2).css('top', (cellRect.top + cellRect.height - thickness) + 'px');
                    elements.eq(2).css('height', thickness + 'px');
                    elements.eq(2).css(this._runtime.direction.front(), cellRect.front + 'px');
                    elements.eq(2).css(this._runtime.direction.end(), '');
                    elements.eq(2).css('width', cellRect.width + 'px');
                    elements.eq(2).css('border-bottom-width', thickness + 'px');
                    elements.eq(2).css('border-bottom-color', color);
                    elements.eq(2).css('border-bottom-style', style);

                    elements.eq(3).css('top', cellRect.top + 'px');
                    elements.eq(3).css('height', cellRect.height + 'px');
                    elements.eq(3).css(this._runtime.direction.front(), cellRect.front + 'px');
                    elements.eq(3).css(this._runtime.direction.end(), '');
                    elements.eq(3).css('width', thickness + 'px');
                    elements.eq(3).css('border-' + this._runtime.direction.front() + '-width', thickness + 'px');
                    elements.eq(3).css('border-' + this._runtime.direction.front() + '-color', color);
                    elements.eq(3).css('border-' + this._runtime.direction.front() + '-style', style);
                }
            });
    }

    private _getLayoutStylesheet() {
        var cssText = new Support.CssTextBuilder(),
            cellPadding = this._options.theme.value('table.cellPadding'),
            headerCellPadding = this._options.theme.value('table.headerCellPadding'),
            headerCellVBorder = this._options.theme.value('table.headerCellVBorder'),
            headerBottomBorder = this._options.theme.value('table.headerBottomBorder'),
            cellVBorder = this._options.theme.value('table.cellVBorder'),
            cellHBorder = this._options.theme.value('table.cellHBorder'),
            oddRowBackgroundColor = this._options.theme.value('table.oddRowBackgroundColor'),
            evenRowBackgroundColor = this._options.theme.value('table.evenRowBackgroundColor'),
            cellColor = this._options.theme.value('table.cellColor'),
            headerRowBackgroundColor = this._options.theme.value('table.headerRowBackgroundColor'),
            headerCellColor = this._options.theme.value('table.headerCellColor'),
            headerRowHeight = this.getHeaderRowHeight(),
            rowHeight = this.getRowHeight();

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-table-header-cell');
        cssText.property('cursor', this._options.theme.value('table.headerCursor'));
        cssText.property('font-family', this._options.theme.value('table.headerCellFontFamily'));
        cssText.property('font-size', this._options.theme.value('table.headerCellFontSize'));
        cssText.property('background-color', headerRowBackgroundColor);
        cssText.property('color', headerCellColor);
        cssText.property('height', headerRowHeight, 'px');
        cssText.property('display', 'none');

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-table-header-cell-content');
        cssText.property('top', 0, 'px');
        cssText.property(this._runtime.direction.front(), 0, 'px');
        cssText.property(this._runtime.direction.end(), 0, 'px');
        cssText.property('padding', this._runtime.direction.rtl() ? headerCellPadding.raw.rtl : headerCellPadding.raw.ltr);
        cssText.property('height', headerRowHeight, 'px');
        cssText.property('line-height', headerRowHeight, 'px');

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row');
        cssText.property('height', rowHeight, 'px');
        cssText.property('line-height', rowHeight, 'px');
        cssText.property('width', '100', '%');
        cssText.property('display', 'none');

        this._runtime.buildCssRootSelector(cssText);
        cssText.append('.msoc-list-table-row-border');
        cssText.property('height', cellHBorder.width, 'px');
        cssText.property('width', '100', '%');
        cssText.property('border-bottom', cellHBorder.raw);
        cssText.property('top', rowHeight, 'px');

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-table-cell');
        cssText.property('cursor', this._options.theme.value('table.cellCursor'));
        cssText.property('font-family', this._options.theme.value('table.cellFontFamily'));
        cssText.property('font-size', this._options.theme.value('table.cellFontSize'));
        cssText.property('color', cellColor);
        cssText.property('height', rowHeight, 'px');

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row.msoc-list-odd');
        cssText.property('background-color', oddRowBackgroundColor);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row.msoc-list-even');
        cssText.property('background-color', evenRowBackgroundColor);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-table-header-bottom-border');
        cssText.property('height', headerBottomBorder.width, 'px');
        cssText.property('border-bottom', headerBottomBorder.raw);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-table-header-cell-splitter-front');
        cssText.property(this._runtime.direction.front(), 0, 'px');
        cssText.property('width', 2, 'px');

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-table-header-cell-first > .msoc-list-table-header-cell-splitter-front');
        cssText.property('display', 'none');

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-table-header-cell-splitter-end');
        cssText.property(this._runtime.direction.end(), -cellVBorder.width, 'px');
        cssText.property('width', cellVBorder.width + 2, 'px');

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-table-cell-content');
        cssText.property('top', 0, 'px');
        cssText.property(this._runtime.direction.front(), 0, 'px');
        cssText.property(this._runtime.direction.end(), 0, 'px');
        cssText.property('padding', this._runtime.direction.rtl() ? cellPadding.raw.rtl : cellPadding.raw.ltr);
        cssText.property('height', rowHeight, 'px');
        cssText.property('line-height', rowHeight, 'px');

        for (var columnIndex = 0; columnIndex < this._visibleColumnMap.length; columnIndex++) {
            var columnUniqueId = this._visibleColumnMap[columnIndex],
                column = this._options.columns[columnUniqueId],
                headerCellRect = this.getHeaderCellRect(columnUniqueId);

            this._runtime.buildCssRootSelector(cssText);
            cssText.push('.msoc-list-table-header-cell.msoc-list-table-header-cell-');
            cssText.push(columnUniqueId);
            cssText.property(this._runtime.direction.front(), headerCellRect.front, 'px');
            cssText.property('width', headerCellRect.width, 'px');
            cssText.property('display', 'block');

            if (columnIndex != this._visibleColumnMap.length - 1) {
                this._runtime.buildCssRootSelector(cssText);
                cssText.push('.msoc-list-table-header-cell-v-border-');
                cssText.push(columnUniqueId);
                cssText.property(this._runtime.direction.front(), headerCellRect.width, 'px');
                cssText.property('width', cellVBorder.width, 'px');
                cssText.property('border-' + this._runtime.direction.end(), headerCellVBorder.raw);
            }

            this._runtime.buildCssRootSelector(cssText);
            cssText.push('.msoc-list-table-cell-');
            cssText.push(columnUniqueId);
            cssText.property(this._runtime.direction.front(), headerCellRect.front, 'px');
            cssText.property('width', headerCellRect.width, 'px');

        };

        return cssText.toString();
    }

    private _getHoverStylesheet() {
        var cssText = new Support.CssTextBuilder();

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row:hover,');
        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row:hover>.msoc-list-table-cell');
        cssText.property('background-color', this._options.theme.value('hoverBackgroundColor'));

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
        var renderedHeaderCell = this._renderContext.renderedHeaderCells[columnUniqueId];

        if (renderedHeaderCell && renderedHeaderCell.state == RenderState.Painted) {
            renderedHeaderCell.state = RenderState.OutDated;
        }
    }

    private _invalidateColumn(columnUniqueId) {
        this._invalidateHeaderCell(columnUniqueId);

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

    private _invalidateRange(range?) {
        if (range) {
            range = <any>Range.intersection(range, this._renderRange);
        } else if (this._renderRange.isValid()) {
            range = this._renderRange;
        }

        if (!range || !range.isValid()) {
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
        var range = <any>Range.intersection(range, this._renderRange);

        if (!range || !range.isValid()) {
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

    private _renderHeaderCellWorker(context) {
        var html = new Support.StringBuilder(),
            renderRange = this._renderRange;

        if (!renderRange.isValid()) {
            return;
        }

        var headerRowElment = this._elements.headerCanvas.eq(TableView.MainCanvasIndex);

        var html = new Support.StringBuilder();
        var addedColumnUniqueIds = [];
        var front = renderRange.front();
        var end = renderRange.end();

        for (var columnIndex = front; columnIndex <= end; columnIndex++) {
            var columnUniqueId = this._visibleColumnMap[columnIndex],
                column = this._options.columns[columnUniqueId];

            if (!context.renderedHeaderCells[columnUniqueId]) {
                context.renderedHeaderCells[columnUniqueId] = {
                    state: RenderState.Initial,
                    headerCellContentElement: null,
                };

                html.append('<div class="msoc-list-table-header-cell msoc-list-table-header-cell-');
                html.append(columnUniqueId);

                if (columnIndex == 0) {
                    html.append(' msoc-list-table-header-cell-first');
                }

                html.append('" data-columnUniqueId="');
                html.append(columnUniqueId);
                html.append('">');
                html.append('<div class="msoc-list-table-header-cell-content msoc-list-table-header-cell-content-');
                html.append(columnUniqueId);
                html.append('">');
                html.append('</div>');
                html.append('<div class="msoc-list-table-header-cell-v-border msoc-list-table-header-cell-v-border-');
                html.append(columnUniqueId);
                html.append('"></div>');

                html.append('<div class="msoc-list-table-header-cell-splitter msoc-list-table-header-cell-splitter-front"></div>');
                html.append('<div class="msoc-list-table-header-cell-splitter msoc-list-table-header-cell-splitter-end"></div>');
                html.append('</div>');

                addedColumnUniqueIds.push(columnUniqueId);
            }
        }

        var headerCellHtml = html.toString();

        if (headerCellHtml.length > 0) {
            headerRowElment[0].insertAdjacentHTML('beforeend', headerCellHtml);

            var headerCellContentElements = headerRowElment.find('> .msoc-list-table-header-cell > .msoc-list-table-header-cell-content');

            for (var i = 0; i < addedColumnUniqueIds.length; i++) {
                var columnUniqueId = addedColumnUniqueIds[i];

                context.renderedHeaderCells[columnUniqueId].headerCellContentElement = headerCellContentElements[headerCellContentElements.length - addedColumnUniqueIds.length + i];
            }
        }

        for (var i = <number>renderRange.front(); i<= renderRange.end(); i++) {
            var columnUniqueId = this._visibleColumnMap[i],
                column = this._options.columns[columnUniqueId];

            if (context.renderedHeaderCells[columnUniqueId].state != RenderState.Painted) {
                this._runtime.renderHeaderCellContent({
                    element: context.renderedHeaderCells[columnUniqueId].headerCellContentElement,
                    columnUniqueId: columnUniqueId,
                    rect: this.getHeaderCellRect(columnUniqueId),
                });

                context.renderedHeaderCells[columnUniqueId].state = RenderState.Painted;
            }
        }
    }

    private _renderCellWorker(context) {
        var html = new Support.StringBuilder(),
            renderRange = this._renderRange;

        if (!renderRange.isValid()) {
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
                    front: NaN,
                    end: NaN,
                    rowElement: null,
                    renderedCells: {},
                };
            }

            if (context.renderedRows[rowUniqueId].state == RenderState.Initial) {
                html.append('<div class="msoc-list-row msoc-list-table-row-');
                html.append(row.rowUniqueId);

                if (row.rowIndex % 2 == 1) {
                    html.append(' msoc-list-odd');
                } else {
                    html.append(' msoc-list-even');
                }

                html.append('"');
                html.append(' data-rowUniqueId="');
                html.append(row.rowUniqueId);
                html.append('">');

                if (rowIndex != this._options.rowCount - 1) {
                    html.append('<div class="msoc-list-table-row-border"></div>');
                }

                html.append('</div>');

                var mainCanvasDiv = this._elements.canvas[TableView.MainCanvasIndex];

                mainCanvasDiv.insertAdjacentHTML('beforeend', html.toString());
                context.renderedRows[rowUniqueId].rowElement = $(mainCanvasDiv.lastChild);
                context.renderedRows[rowUniqueId].state = RenderState.Painted;
                painted = true;
            }

            var rowElement = context.renderedRows[rowUniqueId].rowElement;
            var renderedCells = context.renderedRows[rowUniqueId].renderedCells;
            var front = renderRange.front();
            var end = renderRange.end();

            html = new Support.StringBuilder();
            var addedColumnUniqueIds = [];

            for (var columnIndex = front; columnIndex <= end; columnIndex++) {
                var columnUniqueId = this._visibleColumnMap[columnIndex],
                    column = this._options.columns[columnUniqueId];

                if (!renderedCells[columnUniqueId]) {
                    renderedCells[columnUniqueId] = {
                        state: RenderState.Initial,
                        cellContentElement: null,
                    };

                    html.append('<div class="msoc-list-table-cell msoc-list-table-cell-');
                    html.append(columnUniqueId);
                    html.append('"');
                    html.append(' data-rowUniqueId="');
                    html.append(row.rowUniqueId);
                    html.append('"');
                    html.append(' data-columnUniqueId="');
                    html.append(columnUniqueId);
                    html.append('">');
                    html.append('<div class="msoc-list-table-cell-content msoc-list-table-cell-content-');
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

                var cellContentElements = rowElement.find('> .msoc-list-table-cell > div');

                for (var i = 0; i < addedColumnUniqueIds.length; i++) {
                    var columnUniqueId = addedColumnUniqueIds[i];

                    renderedCells[columnUniqueId].cellContentElement = cellContentElements[cellContentElements.length - addedColumnUniqueIds.length + i];
                }

                painted = true;
            }

            for (var i = <number>renderRange.front(); i <= renderRange.end(); i++) {
                var columnUniqueId = this._visibleColumnMap[i],
                    column = this._options.columns[columnUniqueId];

                if (renderedCells[columnUniqueId].state != RenderState.Painted) {
                    this._runtime.renderCellContent({
                        element: renderedCells[columnUniqueId].cellContentElement,
                        row: row,
                        rowIndex: rowIndex,
                        columnUniqueId: columnUniqueId,
                        columnIndex: this._visibleColumnMap.indexOf(columnUniqueId),
                        rect: this.getCellRect(rowUniqueId, i),
                    });

                    renderedCells[columnUniqueId].state = RenderState.Painted;
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
            var row = this._runtime.getRowByUniqueId(rowUniqueId);

            if (!row) {
                // In the case a row has been deleted from table
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
                var removed = false;

                for (var columnUniqueId in renderedCells) {
                    var columnIndex = this._visibleColumnMap.indexOf(columnUniqueId);

                    if (columnIndex < this._renderRange.front() || columnIndex > this._renderRange.end()) {
                        var cellContentElement = renderedCells[columnUniqueId].cellContentElement;

                        if (cellContentElement) {
                            $(cellContentElement).parent().remove();
                        }

                        delete renderedCells[columnUniqueId];
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

