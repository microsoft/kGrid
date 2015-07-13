export class GridRender implements Fundamental.IFeature, Fundamental.IDisposable {
    public disposer;
    private _runtime: GridRuntime;
    private _invoke;
    private _elements;
    private _uiValues;
    private _scrollbars;
    private _renderingScheduler;
    private _layoutStylesheetUpdater;
    private _cellStylesheetUpdater;
    private _rowTopStylesheetUpdater;
    private _updaters;
    private _renderRange;
    private _viewportScrollCoordinate;

    public constructor() {
        this.disposer = new Fundamental.Disposer(() => {
            this._runtime = null;
            this._invoke = null;
            this._elements = null;
            this._uiValues = null;
            this._renderingScheduler = null;
            this._layoutStylesheetUpdater = null;
            this._cellStylesheetUpdater = null;
            this._rowTopStylesheetUpdater = null;
            this._updaters = null;
            this._viewportScrollCoordinate = null;
        });
    }

    public dispose() {
        this.disposer.dispose();
    }

    public name() {
        return 'gridRender';
    }

    public initialize(runtime, $invoke) {
        this._runtime = runtime;
        this._invoke = $invoke;
        this._renderRange = Range.Null;
        this._viewportScrollCoordinate = new Fundamental.Coordinate(Fundamental.CoordinateType.ViewportRelative, 0, 0),
        this.disposer.addDisposable(this._renderingScheduler = new Fundamental.RenderingScheduler());
        this.disposer.addDisposable(this._updaters = new Fundamental.UpdaterGroup());

        this.disposer.addDisposable(this._layoutStylesheetUpdater = new Fundamental.DynamicStylesheetUpdater('msoc-list-render-layout-' + this._runtime.id));
        this._layoutStylesheetUpdater.add(() => this._getLayoutStylesheet());
        this._updaters.add(this._layoutStylesheetUpdater.getUpdater());

        this._updaters.add(this._getUIValuesUpdater());

        this.disposer.addDisposable(this._cellStylesheetUpdater = new Fundamental.DynamicStylesheetUpdater('msoc-list-render-cell-' + this._runtime.id));
        this._cellStylesheetUpdater.add(() => this._getCellStylesheet());
        this._updaters.add(this._cellStylesheetUpdater.getUpdater());

        this._updaters.add(this._getRenderRangeUpdater());

        this.disposer.addDisposable(this._rowTopStylesheetUpdater = new Fundamental.DynamicStylesheetUpdater('msoc-list-render-row-top-' + this._runtime.id));
        this._rowTopStylesheetUpdater.add(() => this._getRowTopStylesheet());
        this._updaters.add(this._rowTopStylesheetUpdater.getUpdater());


        var renderContext = {
            headerCells: [],
            renderedRows: [],
        };

        this._renderingScheduler.addWorker((context) => this._renderHeaderCellWorker(context), renderContext, 800);
        this._renderingScheduler.addWorker((context) => this._renderCellWorker(context), renderContext, 1000);
        this._renderingScheduler.addWorker((context) => this._removeCellWorker(context), renderContext, 1200);
        this.disposer.addDisposable(
            new Fundamental.EventAttacher(
                this._runtime.events,
                'propertyChange',
                (sender, args) => {
                    if (args.name == 'width' || args.name == 'height') {
                        this._updaters.update();
                    }
            }));

        this.disposer.addDisposable(
            new Fundamental.EventAttacher(
                this._runtime.dataContexts.columnsDataContext,
                'visibleColumnIdsChange',
                (sender, args) => {
                    this._updaters.update();
            }));

        this.disposer.addDisposable(
            new Fundamental.EventAttacher(
                this._runtime.dataContexts.rowsDataContext,
                'rowCountChange',
                (sender, args) => {
                    this._updaters.update();
            }));

        var root = $(
            '<div class="msoc-list ' + runtime.rootClass + '" tabindex="0" aria-labelledby="msocListScreenReader_' + runtime.id + '">' +
                '<div id="msocListScreenReader_' + runtime.id + '" class="msoc-list-screen-reader" aria-live="assertive"></div>' +
                '<div class="msoc-list-header-viewport">' +
                    '<div class="msoc-list-canvas-container">' +
                        '<div class="msoc-list-canvas"></div>' +
                        '<div class="msoc-list-canvas msoc-list-canvas-primary"></div>' +
                        '<div class="msoc-list-canvas"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="msoc-list-content-viewport">' +
                    '<div class="msoc-list-canvas-container">' +
                        '<div class="msoc-list-canvas"></div>' +
                        '<div class="msoc-list-canvas msoc-list-canvas-primary"></div>' +
                        '<div class="msoc-list-canvas"></div>' +
                    '</div>' +
                '</div>' +
            '</div>');

        var container = $(this._runtime.container);

        container.html('');
        container.append(root);

        var header = root.find('>.msoc-list-header-viewport'),
            content = root.find('>.msoc-list-content-viewport');

        this._elements = {
            root: root[0],
            header: {
                viewport: header[0],
                container: header.find('>.msoc-list-canvas-container')[0],
                canvas: header.find('.msoc-list-canvas')[0],
                mainCanvas: header.find('.msoc-list-canvas')[1],
            },
            content: {
                viewport: content[0],
                container: content.find('>.msoc-list-canvas-container')[0],
                canvas: content.find('.msoc-list-canvas')[0],
                mainCanvas: content.find('.msoc-list-canvas')[1],
            },
        };

        content.css('width', '100px');
        content.css('height', '100px');
        content.css('overflow', 'hidden');

        var originalWidth = content[0].clientWidth,
            originalHeight = content[0].clientHeight;

        content.css('overflow', 'scroll');

        this._scrollbars = {
            vWidth: originalWidth - content[0].clientWidth,
            hWidth: originalHeight - content[0].clientHeight,
        };

        content.css('width', '');
        content.css('height', '');
        content.css('overflow', '');

        this._attachEvents();
        this._updaters.update();
        this._renderingScheduler.start(true);
    }

    private _attachEvents() {
        var scrollHandler = new Fundamental.AccumulateTimeoutInvoker(() => {
            this._updaters.update();
        }, 50); // 50 = 16.67 * 3, 20 fps

        this.disposer.addDisposable(new Fundamental.EventAttacher($(this._elements.content.viewport), 'scroll',  (event) => {
            this._viewportScrollCoordinate = Fundamental.CoordinateFactory.scrollFromElement(this._runtime.direction.rtl(), this._elements.content.viewport);
            this._elements.header.viewport.scrollLeft = this._elements.content.viewport.scrollLeft;
            scrollHandler.invoke();
        }));
    }

    private _getUIValuesUpdater() {
        return new Fundamental.Updater(
            () => {
                return {
                    canvas: this._calculateCanvasRect(),
                    width: this._runtime.width,
                    height: this._runtime.height,
                }
            },
            () => {
                var viewport = $(this._elements.content.viewport);

                this._uiValues = {
                    content: {
                        viewport: {
                            width: viewport.width(),
                            height: viewport.height(),
                            clientWidth: viewport[0].clientWidth,
                            clientHeight: viewport[0].clientHeight,
                        },
                    },
                };
            });
    }

    private _getColumnWidthById(columnId) {
        var width = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId).width;

        // FIXME: default column width
        return isNaN(width) || width < 0 ? 50 : width;
    }

    private _calculateCanvasRect() {
        var visibleColumnIds = this._runtime.dataContexts.columnsDataContext.visibleColumnIds(),
            rowHeight = this._runtime.theme.values['content.row.height'].number,
            rowCount = this._runtime.dataContexts.rowsDataContext.rowCount(),
            headerRowHeight = this._runtime.theme.values['header.row.height'].number,
            headerBottomBorder = this._runtime.theme.values['header.border-bottom'].number,
            width = 0,
            cellHBorder = this._runtime.theme.values['content.cell.border-bottom'].number,
            height = rowCount == 0 ? 0 : rowCount * rowHeight + (rowCount - 1) * cellHBorder;

        for (var i = 0; i < visibleColumnIds.length; i++) {
            width += this._getColumnWidthById(visibleColumnIds[i]);
        }

        return {
            header: {
                top: 0,
                front: 0,
                width: width,
                height: headerRowHeight,
            },
            content: {
                top: headerRowHeight + headerBottomBorder,
                front: 0,
                width: width,
                height: height,
            }
        };
    }

    private _getCellStylesheet() {
        var cssText = new Fundamental.StringBuilder(),
            front = 0;

        cssText.context({
            rootClass: this._runtime.rootClass,
            theme: this._runtime.theme,
            front: this._runtime.direction.front(),
            end: this._runtime.direction.end(),
            direction: this._runtime.direction.rtl() ? 'rtl' : 'ltr',
        });

        cssText.append(".$rootClass .msoc-list-table-header-cell { cursor: ${theme.texts['header.cell.cursor']}; font-family: ${theme.texts['header.cell.font-family']}; font-size: ${theme.texts['header.cell.font-size']}; background-color: ${theme.texts['header.row.background-color']}; color: ${theme.texts['header.cell.color']}; height: ${theme.texts['header.row.height']}; }\n");
        cssText.append(".$rootClass .msoc-list-table-header-cell-content { top: 0px; $front: 0px; $end: 0px; padding: ${theme.values['header.cell.padding'][direction]}; height: ${theme.texts['header.row.height']}; line-height: ${theme.texts['header.row.height']}; }\n");
        cssText.append(".$rootClass .msoc-list-row { height: ${theme.texts['content.row.height']}; display: none; }\n");
        cssText.append(".$rootClass .msoc-list-table-row-border { height: ${theme.values['content.cell.border-bottom'].width}; width: 100%; border-bottom: ${theme.texts['content.cell.border-bottom']}; top: ${theme.texts['content.row.height']}; }\n");
        cssText.append(".$rootClass .msoc-list-table-cell { cursor: ${theme.texts['content.cell.cursor']}; font-family: ${theme.texts['content.cell.font-family']}; font-size: ${theme.texts['content.cell.font-size']}; color: ${theme.texts['content.cell.color']}; height: ${theme.texts['content.row.height']}; display: none; }\n");
        cssText.append(".$rootClass .msoc-list-odd { background-color: ${theme.texts['content.row:odd.background-color']}; }\n");
        cssText.append(".$rootClass .msoc-list-even { background-color: ${theme.texts['content.row:even.background-color']}; }\n");
        cssText.append(".$rootClass .msoc-list-table-header-bottom-border { height: ${theme.values['header.border-bottom'].width}; border-bottom: ${theme.texts['header.border-bottom']}; }\n");
        cssText.append(".$rootClass .msoc-list-table-header-cell-splitter-front { $front: 0px; width: 2px; }\n");
        cssText.append(".$rootClass .msoc-list-table-header-cell-first > .msoc-list-table-header-cell-splitter-front { display: none; }\n");
        cssText.append(".$rootClass .msoc-list-table-header-cell-splitter-end { $end: -${theme.values['content.cell.border-bottom'].width}; width: ${theme.values['content.cell.border-bottom'].number + 2}px; }\n");
        cssText.append(".$rootClass .msoc-list-table-cell-content { top: 0px; $front: 0px; $end: 0px; padding: ${theme.values['content.cell.padding'][direction]}; height: ${theme.texts['content.row.height']}; line-height: ${theme.texts['content.row.height']}; }\n");
        cssText.append(".$rootClass .msoc-list-table-header-cell, .$rootClass .msoc-list-table-cell { display: none; }\n");

        return cssText.toString();
    }

    private _getRowTopStylesheet() {
        var renderRange = this._renderRange,
            cssText = new Fundamental.StringBuilder(),
            front = 0,
            visibleColumnIds = this._runtime.dataContexts.columnsDataContext.visibleColumnIds();

        if (!renderRange.isValid()) {
            return '';
        }

        cssText.context({
            rootClass: this._runtime.rootClass,
            theme: this._runtime.theme,
            front: this._runtime.direction.front(),
            end: this._runtime.direction.end(),
        });

        for (var rowIndex = renderRange.top(); rowIndex <= renderRange.bottom(); rowIndex++) {
            var row = this._runtime.dataContexts.rowsDataContext.getRowByIndex(rowIndex),
                rowId = this._runtime.dataContexts.rowsDataContext.getRowIdByIndex(rowIndex);

            if (!row) {
                continue;
            }

            cssText.context().rowId = rowId;
            cssText.context().rowIndex = rowIndex;

            cssText.append(".$rootClass .msoc-list-row.msoc-list-row-$rowId { height: ${theme.texts['content.row.height']}; line-height: ${theme.texts['content.row.height']}; top: ${(rowIndex * theme.values['content.row.height'].number + rowIndex * theme.values['content.cell.border-bottom'].number)}px; display: block; }\n");
        }

        $.each(visibleColumnIds, (index, columnId) => {
            if (index >= renderRange.front() && index <= renderRange.end()) {
                cssText.context().width = this._getColumnWidthById(columnId);
                cssText.context().columnId = columnId;
                cssText.context().frontWidth = front;

                cssText.append(".$rootClass .msoc-list-table-header-cell.msoc-list-table-header-cell-$columnId, .$rootClass .msoc-list-table-cell.msoc-list-table-cell-$columnId { $front: ${frontWidth}px; width: ${width}px; display: block; }\n");

                if (index != visibleColumnIds.length - 1) {
                    cssText.append(".$rootClass .msoc-list-table-header-cell-v-border-$columnId { $front: ${width}px; width: ${theme.values['content.cell.border-right'].width}; border-$end: ${theme.values['header.cell.border-right'].width}; }\n");
                }
            }

            front += this._getColumnWidthById(columnId);
        });

        return cssText.toString();
    }

    private _getLayoutStylesheet() {
        var cssText = new Fundamental.StringBuilder(),
            canvas = this._calculateCanvasRect();

        cssText.context({
            canvas: canvas,
            minCanvasWidth: canvas.content.height > this._runtime.height ? this._runtime.width - this._scrollbars.vWidth : this._runtime.width,
            rootClass: this._runtime.rootClass,
            theme: this._runtime.theme,
            front: this._runtime.direction.front(),
            end: this._runtime.direction.end(),
            runtime: this._runtime,
        });

        cssText.append('.$rootClass { width: ${runtime.width}px; height: ${runtime.height}px; background-color: ${theme.texts["background-color"]}; }\n');
        cssText.append('.$rootClass .msoc-list-content-viewport { overflow: auto; position: absolute; top: ${canvas.content.top}px; $front: 0px; $end: 0px; bottom: 0px; }\n');
        cssText.append('.$rootClass .msoc-list-content-viewport .msoc-list-canvas-container { overflow: hidden; position: relative; width: ${canvas.content.width}px; height: ${canvas.content.height}px; min-width: ${minCanvasWidth}px; }\n');

        // FIXME: should put here?
        cssText.append(".$rootClass .msoc-list-row { width: ${canvas.content.width}px; min-width: ${minCanvasWidth}px; }\n");
        cssText.append('.$rootClass .msoc-list-header-viewport { overflow: hidden; position: absolute; width: 100%; height: ${canvas.content.top}px; }\n');
        cssText.append('.$rootClass .msoc-list-header-viewport .msoc-list-canvas-container { overflow: hidden; position: relative; width: ${canvas.header.width}px; height: ${canvas.header.height}px; min-width: ${minCanvasWidth}px; }\n');
        cssText.append('.$rootClass .msoc-list-row:hover > .msoc-list-table-cell { background-color: ${theme.texts["content.row:hover.background-color"]}; }');

        // cssText.append('.$rootClass .msoc-list-header-viewport .msoc-list-canvas-container.msoc-list-canvas-main > .msoc-list-table-header-bottom-border');

        return cssText.toString();
    }

    private _getRenderRangeUpdater() {
        var __getRenderRange = () => {
            var visibleColumnIds = this._runtime.dataContexts.columnsDataContext.visibleColumnIds(),
                rowCount = this._runtime.dataContexts.rowsDataContext.rowCount();

            var topRowIndex,
                bottomRowIndex,
                columnFront = 0,
                frontColumnIndex = 0,
                front = 0,
                rowHeight = this._runtime.theme.values['content.row.height'].number,
                endColumnIndex = visibleColumnIds.length - 1;

            topRowIndex = Math.floor(this._viewportScrollCoordinate.top() / (rowHeight + this._runtime.theme.values['content.cell.border-bottom'].number));
            topRowIndex = Math.max(0, topRowIndex);
            bottomRowIndex = Math.floor((this._viewportScrollCoordinate.top() + this._uiValues.content.viewport.height) / (rowHeight + this._runtime.theme.values['content.cell.border-bottom'].number));
            bottomRowIndex = Math.min(this._runtime.dataContexts.rowsDataContext.rowCount() - 1, bottomRowIndex);
            bottomRowIndex = Math.max(0, bottomRowIndex);

            for (var columnIndex = 0; columnIndex < visibleColumnIds.length; columnIndex++) {
                front += this._getColumnWidthById(visibleColumnIds[columnIndex]);

                if (front <= this._viewportScrollCoordinate.front()) {
                    frontColumnIndex = columnIndex;
                }

                if (front < this._viewportScrollCoordinate.front() + this._uiValues.content.viewport.width) {
                    endColumnIndex = columnIndex;
                } else {
                    break;
                }
            }

            if (rowCount == 0) {
                return new Range(RangeType.Column, NaN, NaN, frontColumnIndex, endColumnIndex);
            } else {
                return new Range(RangeType.Range, topRowIndex, bottomRowIndex, frontColumnIndex, endColumnIndex);
            }
        };

        var eventSender = new Fundamental.AccumulateTimeoutInvoker(() => {
            if (this._renderRange.isValid()) {
                // this._runtime.events.emit(
                //     'table.beforeRender',
                //     this,
                //     {
                //         renderRange: this._renderRange,
                //     });
            }
        }, 16.67);

        return new Fundamental.Updater(
            () => {
                var renderRange = __getRenderRange();
                var rowIds = [];

                if (renderRange.isValid()) {
                    for (var rowIndex = renderRange.top(); rowIndex <= renderRange.bottom(); rowIndex++) {
                        var rowId = this._runtime.dataContexts.rowsDataContext.getRowIdByIndex(rowIndex);

                        if (rowId) {
                            rowIds.push(rowId);
                        }
                    }

                    rowIds.sort();
                }

                return {
                    renderRange: renderRange,
                    rowIds: rowIds,
                }
            },
            (newValue) => {
                var renderRange = newValue.renderRange;

                this._renderRange = renderRange;

                eventSender.invoke();
            });
    }

    private _renderHeaderCellWorker(context) {
        var renderRange = this._renderRange;

        if (!renderRange.isValid()) {
            return;
        }

        var headerMainCanvas = $(this._elements.header.mainCanvas),
            html = new Fundamental.StringBuilder(),
            addedColumnIds = [],
            visibleColumnIds = this._runtime.dataContexts.columnsDataContext.visibleColumnIds(),
            front = renderRange.front(),
            end = renderRange.end();

        for (var columnIndex = front; columnIndex <= end; columnIndex++) {
            var columnId = visibleColumnIds[columnIndex],
                column = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId);

            if (!context.headerCells[columnId]) {
                context.headerCells[columnId] = {
                    state: RenderState.Initial,
                    contentElement: null,
                };

                html.context().columnId = columnId;

                html.append('<div class="msoc-list-table-header-cell msoc-list-table-header-cell-$columnId" data-columnId="$columnId">');
                html.append('<div class="msoc-list-table-header-cell-content msoc-list-table-header-cell-content-$columnId"></div>');
                html.append('<div class="msoc-list-table-header-cell-v-border msoc-list-table-header-cell-v-border-$columnId"></div>');
                html.append('<div class="msoc-list-table-header-cell-splitter msoc-list-table-header-cell-splitter-front"></div>');
                html.append('<div class="msoc-list-table-header-cell-splitter msoc-list-table-header-cell-splitter-end"></div>');
                html.append('</div>');

                addedColumnIds.push(columnId);
            }
        }

        var headerCellHtml = html.toString();

        if (headerCellHtml.length > 0) {
            headerMainCanvas[0].insertAdjacentHTML('beforeend', headerCellHtml);

            var contentElements = headerMainCanvas.find('> .msoc-list-table-header-cell > .msoc-list-table-header-cell-content');

            for (var i = 0; i < addedColumnIds.length; i++) {
                var columnId = addedColumnIds[i];

                context.headerCells[columnId].contentElement = contentElements[contentElements.length - addedColumnIds.length + i];
            }
        }

        for (var i = <number>renderRange.front(); i<= renderRange.end(); i++) {
            var columnId = visibleColumnIds[i],
                column = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId);

            if (context.headerCells[columnId].state != RenderState.Painted) {
                var render = column.headerRender || SimpleTextHeaderRender.Instance();

                render.render({
                    columnId: columnId,
                    column: column,
                    element: context.headerCells[columnId].contentElement,
                    data: column.data,
                    // height: rect.height,
                    // width: rect.width,
                    rtl: this._runtime.direction.rtl(),
                    theme: this._runtime.theme,
                });

                context.headerCells[columnId].state = RenderState.Painted;
            }
        }
    }

    private _renderCellWorker(context) {
        var html = new Fundamental.StringBuilder(),
            renderRange = this._renderRange;

        if (!renderRange.isValid()) {
            return;
        }

        for (var rowIndex = renderRange.top(); rowIndex <= renderRange.bottom(); rowIndex++) {
            var row = this._runtime.dataContexts.rowsDataContext.getRowByIndex(rowIndex);

            if (!row) {
                continue;
            }

            var rowId = this._runtime.dataContexts.rowsDataContext.getRowIdByIndex(rowIndex),
                painted = false;

            html.context().rowId = rowId;

            if (!context.renderedRows[rowId]) {
                context.renderedRows[rowId] = {
                    state: RenderState.Initial,
                    rowElement: null,
                    renderedCells: {},
                };
            }

            if (context.renderedRows[rowId].state == RenderState.Initial) {
                if (rowIndex % 2 == 1) {
                    html.append('<div class="msoc-list-row msoc-list-row-$rowId msoc-list-odd" data-rowId="$rowId">');
                } else {
                    html.append('<div class="msoc-list-row msoc-list-row-$rowId msoc-list-even" data-rowId="$rowId">');
                }

                if (rowIndex != this._runtime.dataContexts.rowsDataContext.rowCount() - 1) {
                    html.append('<div class="msoc-list-table-row-border"></div>');
                }

                html.append('</div>');

                this._elements.content.mainCanvas.insertAdjacentHTML('beforeend', html.toString());
                context.renderedRows[rowId].rowElement = $(this._elements.content.mainCanvas.lastChild);
                context.renderedRows[rowId].state = RenderState.Painted;
                painted = true;
            }

            var rowElement = context.renderedRows[rowId].rowElement;
            var renderedCells = context.renderedRows[rowId].renderedCells;
            var front = renderRange.front();
            var end = renderRange.end();

            html = new Fundamental.StringBuilder();
            var addedColumnIds = [];

            for (var columnIndex = front; columnIndex <= end; columnIndex++) {
                var columnId = this._runtime.dataContexts.columnsDataContext.getColumnIdByIndex(columnIndex),
                    column = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId);

                html.context().columnId = columnId;
                html.context().rowId = rowId;

                if (!renderedCells[columnId]) {
                    renderedCells[columnId] = {
                        state: RenderState.Initial,
                        contentElement: null,
                    };

                    html.append('<div class="msoc-list-table-cell msoc-list-table-cell-$columnId" data-rowId="$rowId" data-columnId="$columnId">');
                    html.append('<div class="msoc-list-table-cell-content msoc-list-table-cell-content-$columnId"></div>');
                    html.append('</div>');

                    addedColumnIds.push(columnId);
                }
            }

            var cellHtml = html.toString();

            if (cellHtml.length > 0) {
                rowElement[0].insertAdjacentHTML('beforeend', html.toString());

                var contentElements = rowElement.find('> .msoc-list-table-cell > div');

                for (var i = 0; i < addedColumnIds.length; i++) {
                    var columnId = addedColumnIds[i];

                    renderedCells[columnId].contentElement = contentElements[contentElements.length - addedColumnIds.length + i];
                }

                painted = true;
            }

            for (var columnIndex = renderRange.front(); columnIndex <= renderRange.end(); columnIndex++) {
                var columnId = this._runtime.dataContexts.columnsDataContext.getColumnIdByIndex(columnIndex),
                    column = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId);

                if (renderedCells[columnId].state != RenderState.Painted) {
                    var render = column.cellRender || SimpleTextCellRender.Instance();

                    render.render({
                        columnId: columnId,
                        column: column,
                        element: renderedCells[columnId].contentElement,
                        cellData: row[column.field],
                        // height: rect.height,
                        // width: rect.width,
                        rtl: this._runtime.direction.rtl(),
                        theme: this._runtime.theme,
                    });

                    renderedCells[columnId].state = RenderState.Painted;
                    painted = true;
                }
            }

            if (painted) {
                return true;
            }
        }
    }

    private _removeCellWorker(context) {
        for (var rowId in context.renderedRows) {
            var rowIndex = this._runtime.dataContexts.rowsDataContext.getRowIndexById(rowId),
                row = this._runtime.dataContexts.rowsDataContext.getRowById(rowId);

            if (!row) {
                // In the case a row has been deleted from table
                var rowElement = context.renderedRows[rowId].rowElement;

                if (rowElement) {
                    rowElement.remove();
                }

                delete context.renderedRows[rowId];
                return true;
            } else if (rowIndex < this._renderRange.top() || rowIndex > this._renderRange.bottom()) {
                // The row is not showed in the render area
                var rowElement = context.renderedRows[rowId].rowElement;

                if (rowElement) {
                    rowElement.remove();
                }

                delete context.renderedRows[rowId];
                return true;
            } else {
                var renderedCells = context.renderedRows[rowId].renderedCells;
                var removed = false;

                for (var columnId in renderedCells) {
                    var columnIndex = this._runtime.dataContexts.columnsDataContext.getColumnIndexById(columnId);

                    if (columnIndex < this._renderRange.front() || columnIndex > this._renderRange.end()) {
                        var contentElement = renderedCells[columnId].contentElement;

                        if (contentElement) {
                            $(contentElement).parent().remove();
                        }

                        delete renderedCells[columnId];
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

