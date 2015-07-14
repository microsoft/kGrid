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
    private _renderContext;
    private _viewportScrollCoordinate;
    private _positionService : IGridPosition;

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
        return 'render';
    }

    public inject($invoke) {
        $invoke.inject('viewportService', {
            frontContentCanvas: () => this._elements.content.canvases[0],
            contentViewport: () => this._elements.content.viewport,
            rootElement: () => this._elements.root,
            scrollIntoView: (rect) => this._scrollIntoView(rect.top, rect.front, rect.height, rect.width),
            scrollTo: (point) => this._scrollTo(point.top, point.front),
            scroll: (topOffset, frontOffset) => this._scroll(topOffset, frontOffset),
            getCellPositionByEvent: (event) => this._getCellPositionByEvent(event),
        });
    }

    public initialize(runtime, $invoke, positionService) {
        this._runtime = runtime;
        this._invoke = $invoke;
        this._positionService = positionService;
        this._renderRange = Range.Null;
        this._viewportScrollCoordinate = new Fundamental.Coordinate(Fundamental.CoordinateType.ViewportRelative, 0, 0),
        this.disposer.addDisposable(this._renderingScheduler = new Fundamental.RenderingScheduler());
        this.disposer.addDisposable(this._updaters = new Fundamental.UpdaterGroup());

        this.disposer.addDisposable(this._layoutStylesheetUpdater = new Fundamental.DynamicStylesheetUpdater('msoc-list-render-layout-' + this._runtime.id));
        this._layoutStylesheetUpdater.add(() => this._getLayoutStylesheet());
        this._updaters.add(this._layoutStylesheetUpdater.getUpdater());

        this._updaters.add(this._getUIValuesUpdater());
        this._updaters.add(this._getRenderRangeUpdater());

        this.disposer.addDisposable(this._cellStylesheetUpdater = new Fundamental.DynamicStylesheetUpdater('msoc-list-render-cell-' + this._runtime.id));
        this._cellStylesheetUpdater.add(() => this._getCellStylesheet());
        this._updaters.add(this._cellStylesheetUpdater.getUpdater());

        this.disposer.addDisposable(this._rowTopStylesheetUpdater = new Fundamental.DynamicStylesheetUpdater('msoc-list-render-row-top-' + this._runtime.id));
        this._rowTopStylesheetUpdater.add(() => this._getRowTopStylesheet());
        this._updaters.add(this._rowTopStylesheetUpdater.getUpdater());


        this._renderContext = {
            header: {
                rows: [{ cells: [] }],
            },
            content: {
                rows: [],
            },
        };

        this._renderingScheduler.addWorker((context) => this._renderHeaderCellWorker(context), this._renderContext, 800);
        this._renderingScheduler.addWorker((context) => this._renderCellWorker(context), this._renderContext, 1000);
        this._renderingScheduler.addWorker((context) => this._removeCellWorker(context), this._renderContext, 1200);
        this.disposer.addDisposable(
            new Fundamental.EventAttacher(
                this._runtime.events.internal,
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
                        '<div class="msoc-list-canvas msoc-list-front"></div>' +
                        '<div class="msoc-list-canvas msoc-list-canvas-primary"></div>' +
                        '<div class="msoc-list-canvas msoc-list-back"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="msoc-list-content-viewport">' +
                    '<div class="msoc-list-canvas-container">' +
                        '<div class="msoc-list-canvas msoc-list-front"></div>' +
                        '<div class="msoc-list-canvas msoc-list-canvas-primary"></div>' +
                        '<div class="msoc-list-canvas msoc-list-back"></div>' +
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
                canvases: header.find('.msoc-list-canvas'),
                mainCanvas: header.find('.msoc-list-canvas')[1],
            },
            content: {
                viewport: content[0],
                container: content.find('>.msoc-list-canvas-container')[0],
                canvases: content.find('.msoc-list-canvas'),
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
        this.disposer.addDisposable(new Fundamental.EventAttacher(this._runtime.dataContexts.rowsDataContext, 'removeRows insertRows',  (sender, args) => {
            this._onRemoveInsertRows(sender, args);
        }));
        this.disposer.addDisposable(new Fundamental.EventAttacher(this._runtime.dataContexts.rowsDataContext, 'updateRows',  (sender, args) => {
            this._onUpdateRows(sender, args);
        }));
    }

    private _getCellPositionByEvent(event) {
        var cell;

        cell = $(event.target).closest('.msoc-list-content-cell');

        if (cell[0]) {
            var rowId = cell.attr('data-rowId'),
                columnId = cell.attr('data-columnId'),
                rowIndex = this._runtime.dataContexts.rowsDataContext.getRowIndexById(rowId),
                columnIndex = this._runtime.dataContexts.columnsDataContext.getColumnIndexById(columnId);

            return {
                type: 'content',
                position: new Position(rowIndex, columnIndex),
            };
        }

        cell = $(event.target).closest('.msoc-list-header-cell');

        if (cell[0]) {
            var columnId = cell.attr('columnId'),
                columnIndex = this._runtime.dataContexts.columnsDataContext.getColumnIndexById(columnId);

            return {
                type: 'header',
                position: new Position(0, columnIndex),
            };
        }
    }

    private _onUpdateRows(sender, args) {
        this._updaters.update();
        this._invalidateRows('content', args.range);
    }

    private _onRemoveInsertRows(sender, args) {
        this._updaters.update();

        if (args.range.top() <= this._renderRange.bottom()) {
            this._adjustOddEvenRow();
        }
    }

    private _invalidateRange(type, range?) {
        if (type == 'content') {
            if (range) {
                range = <any>Range.intersection(range, this._renderRange);
            } else if (this._renderRange.isValid()) {
                range = this._renderRange;
            }

            if (!range || !range.isValid()) {
                return;
            }

            for (var rowIndex = range.top(); rowIndex <= range.bottom(); rowIndex++) {
                for (var columnIndex = range.front(); columnIndex <= range.end(); columnIndex++) {
                    this._invalidateCell(type, rowIndex, columnIndex);
                }
            }
        } else {
            if (!range) {
                range = new Range(RangeType.Range, 0, 0, 0, this._runtime.dataContexts.columnsDataContext.visibleColumnIds().length - 1);
            }

            if (!range.isValid()) {
                return;
            }

            for (var columnIndex = range.front(); columnIndex <= range.end(); columnIndex++) {
                this._invalidateCell(type, 0, columnIndex);
            }
        }
    }

    private _invalidateRows(type, range) {
        if (type == 'content') {
            var range = <any>Range.intersection(range, this._renderRange);

            if (!range || !range.isValid()) {
                return;
            }

            for (var rowIndex = range.top(); rowIndex <= range.bottom(); rowIndex++) {
                this._invalidateRow(type, rowIndex);
            }
        } else {
            this._invalidateRow(type, 0);
        }
    }

    private _invalidateRow(type, rowIndex) {
        if (type == 'content') {
            var rowId = this._runtime.dataContexts.rowsDataContext.getRowIndexById(rowIndex),
                renderedRow = this._renderContext.content.rows[rowId];

            if (!renderedRow) {
                return;
            }

            for (var i in renderedRow.cells) {
                var cell = renderedRow.cells[i];

                if (cell.state == RenderState.Painted) {
                    cell.state = RenderState.OutDated;
                }
            }
        } else {
            for (var i in this._renderContext.header.rows[0].cells) {
                var cell = this._renderContext.header.rows[0].cells[i];

                if (cell && cell.state == RenderState.Painted) {
                    cell.state = RenderState.OutDated;
                }
            }
        }
    }

    private _invalidateCell(type, rowIndex, columnIndex) {
        var rowId = this._runtime.dataContexts.rowsDataContext.getRowIdByIndex(rowIndex),
            columnId = this._runtime.dataContexts.columnsDataContext.getColumnIdByIndex(columnIndex);

        if (type == 'content') {
            var cell = this._renderContext.content.rows[rowId] ? this._renderContext.content.rows[rowId].cells[columnId] : null;

            if (cell && cell.state == RenderState.Painted) {
                cell.state = RenderState.OutDated;
            }
        } else {
            var cell = this._renderContext.header.rows[0].cells[columnId];

            if (cell && cell.state == RenderState.Painted) {
                cell.state = RenderState.OutDated;
            }
        }
    }

    private _adjustOddEvenRow() {
        for (var rowId in this._renderContext.content.rows) {
            if (this._renderContext.content.rows[rowId].state == RenderState.Painted) {
                var rowElement = this._renderContext.content.rows[rowId].rowElement,
                    rowIndex = this._runtime.dataContexts.rowsDataContext.getRowIndexById(rowId);

                if (!isNaN(rowIndex)) {
                    rowElement.removeClass('msoc-list-odd msoc-list-even');

                    if (rowIndex % 2 == 1) {
                        rowElement.addClass('msoc-list-odd');
                    } else {
                        rowElement.addClass('msoc-list-even');
                    }
                }
            }
        }
    }

    private _scrollIntoView(top, front, height, width) {
        var canvasRect = this._canvasRect().content,
            scrollWidth = canvasRect.width,
            scrollHeight = canvasRect.height,
            scrollFront = this._viewportScrollCoordinate.front(),
            scrollTop = this._viewportScrollCoordinate.top(),
            clientWidth = this._uiValues.content.viewport.clientWidth,
            clientHeight = this._uiValues.content.viewport.clientHeight,
            bottom = top + height,
            end = front + width;

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
        var canvasRect = this._canvasRect().content;

        top = parseFloat(top);
        front = parseFloat(front);

        if (!isNaN(front)) {
            var scrollWidth = canvasRect.width,
                clientWidth = canvasRect.height;

            front = Math.max(0, Math.min(front, scrollWidth));

            if (this._runtime.direction.rtl()) {
                if (Fundamental.TextDirection.zeroEnd() == 'front' && Fundamental.TextDirection.scrollFrontDirection() == -1) {
                    // FireFox
                    this._elements.header.viewport.scrollLeft = -front;
                    this._elements.content.viewport.scrollLeft = -front;
                } else if (Fundamental.TextDirection.zeroEnd() == 'end' && Fundamental.TextDirection.scrollFrontDirection() == 1) {
                    // Chrome
                    this._elements.header.viewport.scrollLeft = scrollWidth - clientWidth - front;
                    this._elements.content.viewport.scrollLeft = scrollWidth - clientWidth - front;
                } else if (Fundamental.TextDirection.zeroEnd() == 'front' && Fundamental.TextDirection.scrollFrontDirection() == 1) {
                    // IE
                    this._elements.header.viewport.scrollLeft = front;
                    this._elements.content.viewport.scrollLeft = front;
                } else {
                    // Unknown??
                    this._elements.header.viewport.scrollLeft = front - scrollWidth + clientWidth;
                    this._elements.content.viewport.scrollLeft = front - scrollWidth + clientWidth;
                }
            } else {
                this._elements.header.viewport.scrollLeft = front;
                this._elements.content.viewport.scrollLeft = front;
            }
        }

        if (!isNaN(top)) {
            this._elements.content.viewport.scrollTop = Math.max(0, Math.min(top, canvasRect.height));
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

            var scrollLeft = this._elements.content.viewport.scrollLeft + frontOffset;

            this._elements.content.viewport.scrollLeft = scrollLeft;
            this._elements.header.viewport.scrollLeft = scrollLeft;
        }

        if (!!topOffset) {
            this._elements.content.viewport.scrollTop = this._elements.content.viewport.scrollTop + topOffset;
        }
    }

    private _getUIValuesUpdater() {
        return new Fundamental.Updater(
            () => {
                return {
                    canvas: this._canvasRect(),
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

    private _canvasRect() {
        var visibleColumnIds = this._runtime.dataContexts.columnsDataContext.visibleColumnIds(),
            rowHeight = this._runtime.theme.values['content.row.height'].number,
            rowCount = this._runtime.dataContexts.rowsDataContext.rowCount(),
            headerRowHeight = this._runtime.theme.values['header.row.height'].number,
            headerBottomBorder = this._runtime.theme.values['header.border-bottom'].number,
            width = 0,
            cellHBorder = this._runtime.theme.values['content.cell.border-bottom'].number,
            height = rowCount == 0 ? 0 : rowCount * rowHeight + (rowCount - 1) * cellHBorder;

        for (var i = 0; i < visibleColumnIds.length; i++) {
            width += this._positionService.getColumnWidthById(visibleColumnIds[i]);
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

        cssText.append(".$rootClass .msoc-list-header-cell { cursor: ${theme.texts['header.cell.cursor']}; font-family: ${theme.texts['header.cell.font-family']}; font-size: ${theme.texts['header.cell.font-size']}; background-color: ${theme.texts['header.row.background-color']}; color: ${theme.texts['header.cell.color']}; height: ${theme.texts['header.row.height']}; }\n");
        cssText.append(".$rootClass .msoc-list-header-cell-content { top: 0px; $front: 0px; $end: 0px; padding: ${theme.values['header.cell.padding'][direction]}; height: ${theme.texts['header.row.height']}; line-height: ${theme.texts['header.row.height']}; }\n");
        cssText.append(".$rootClass .msoc-list-row { height: ${theme.texts['content.row.height']}; display: none; }\n");
        cssText.append(".$rootClass .msoc-list-row-border { height: ${theme.values['content.cell.border-bottom'].width}; width: 100%; border-bottom: ${theme.texts['content.cell.border-bottom']}; top: ${theme.texts['content.row.height']}; }\n");
        cssText.append(".$rootClass .msoc-list-content-cell { cursor: ${theme.texts['content.cell.cursor']}; font-family: ${theme.texts['content.cell.font-family']}; font-size: ${theme.texts['content.cell.font-size']}; color: ${theme.texts['content.cell.color']}; height: ${theme.texts['content.row.height']}; display: none; }\n");
        cssText.append(".$rootClass .msoc-list-odd { background-color: ${theme.texts['content.row:odd.background-color']}; }\n");
        cssText.append(".$rootClass .msoc-list-even { background-color: ${theme.texts['content.row:even.background-color']}; }\n");
        cssText.append(".$rootClass .msoc-list-header-bottom-border { height: ${theme.values['header.border-bottom'].width}; border-bottom: ${theme.texts['header.border-bottom']}; }\n");
        cssText.append(".$rootClass .msoc-list-header-cell-splitter-front { $front: 0px; width: 2px; }\n");
        cssText.append(".$rootClass .msoc-list-header-cell-first > .msoc-list-header-cell-splitter-front { display: none; }\n");
        cssText.append(".$rootClass .msoc-list-header-cell-splitter-end { $end: -${theme.values['content.cell.border-bottom'].width}; width: ${theme.values['content.cell.border-bottom'].number + 2}px; }\n");
        cssText.append(".$rootClass .msoc-list-content-cell-content { top: 0px; $front: 0px; $end: 0px; padding: ${theme.values['content.cell.padding'][direction]}; height: ${theme.texts['content.row.height']}; line-height: ${theme.texts['content.row.height']}; }\n");
        cssText.append(".$rootClass .msoc-list-header-cell, .$rootClass .msoc-list-content-cell { display: none; }\n");

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
                cssText.context().width = this._positionService.getColumnWidthById(columnId);
                cssText.context().columnId = columnId;
                cssText.context().frontWidth = front;

                cssText.append(".$rootClass .msoc-list-header-cell.msoc-list-header-cell-$columnId, .$rootClass .msoc-list-content-cell.msoc-list-content-cell-$columnId { $front: ${frontWidth}px; width: ${width}px; display: block; }\n");

                if (index != visibleColumnIds.length - 1) {
                    cssText.append(".$rootClass .msoc-list-header-cell-v-border-$columnId { $front: ${width}px; width: ${theme.values['content.cell.border-right'].width}; border-$end: ${theme.values['header.cell.border-right'].width}; }\n");
                }
            }

            front += this._positionService.getColumnWidthById(columnId);
        });

        return cssText.toString();
    }

    private _getLayoutStylesheet() {
        var cssText = new Fundamental.StringBuilder(),
            canvas = this._canvasRect();

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
        cssText.append('.$rootClass .msoc-list-canvas.msoc-list-front { z-index: 100; }\n');
        cssText.append('.$rootClass .msoc-list-canvas.msoc-list-back { z-index: 100; }\n');

        // FIXME: should put here?
        cssText.append(".$rootClass .msoc-list-row { width: ${canvas.content.width}px; min-width: ${minCanvasWidth}px; }\n");
        cssText.append('.$rootClass .msoc-list-header-viewport { overflow: hidden; position: absolute; width: 100%; height: ${canvas.content.top}px; }\n');
        cssText.append('.$rootClass .msoc-list-header-viewport .msoc-list-canvas-container { overflow: hidden; position: relative; width: ${canvas.header.width}px; height: ${canvas.header.height}px; min-width: ${minCanvasWidth}px; }\n');
        cssText.append('.$rootClass .msoc-list-row:hover > .msoc-list-content-cell { background-color: ${theme.texts["content.row:hover.background-color"]}; }');

        // cssText.append('.$rootClass .msoc-list-header-viewport .msoc-list-canvas-container.msoc-list-canvas-main > .msoc-list-header-bottom-border');

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
                front += this._positionService.getColumnWidthById(visibleColumnIds[columnIndex]);

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

            if (!context.header.rows[0].cells[columnId]) {
                context.header.rows[0].cells[columnId] = {
                    state: RenderState.Initial,
                    contentElement: null,
                };

                html.context().columnId = columnId;

                html.append('<div class="msoc-list-header-cell msoc-list-header-cell-$columnId" data-rowId="0" data-columnId="$columnId">');
                html.append('<div class="msoc-list-header-cell-content msoc-list-header-cell-content-$columnId"></div>');
                html.append('<div class="msoc-list-header-cell-v-border msoc-list-header-cell-v-border-$columnId"></div>');
                html.append('<div class="msoc-list-header-cell-splitter msoc-list-header-cell-splitter-front"></div>');
                html.append('<div class="msoc-list-header-cell-splitter msoc-list-header-cell-splitter-end"></div>');
                html.append('</div>');

                addedColumnIds.push(columnId);
            }
        }

        var headerCellHtml = html.toString();

        if (headerCellHtml.length > 0) {
            headerMainCanvas[0].insertAdjacentHTML('beforeend', headerCellHtml);

            var contentElements = headerMainCanvas.find('> .msoc-list-header-cell > .msoc-list-header-cell-content');

            for (var i = 0; i < addedColumnIds.length; i++) {
                var columnId = addedColumnIds[i];

                context.header.rows[0].cells[columnId].contentElement = contentElements[contentElements.length - addedColumnIds.length + i];
            }
        }

        for (var i = <number>renderRange.front(); i<= renderRange.end(); i++) {
            var columnId = visibleColumnIds[i],
                column = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId);

            if (context.header.rows[0].cells[columnId].state != RenderState.Painted) {
                var render = column.headerRender || SimpleTextHeaderRender.Instance();

                render.render({
                    columnId: columnId,
                    column: column,
                    element: context.header.rows[0].cells[columnId].contentElement,
                    data: column.data,
                    // height: rect.height,
                    // width: rect.width,
                    rtl: this._runtime.direction.rtl(),
                    theme: this._runtime.theme,
                });

                context.header.rows[0].cells[columnId].state = RenderState.Painted;
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

            if (!context.content.rows[rowId]) {
                context.content.rows[rowId] = {
                    state: RenderState.Initial,
                    rowElement: null,
                    cells: {},
                };
            }

            if (context.content.rows[rowId].state == RenderState.Initial) {
                if (rowIndex % 2 == 1) {
                    html.append('<div class="msoc-list-row msoc-list-row-$rowId msoc-list-odd" data-rowId="$rowId">');
                } else {
                    html.append('<div class="msoc-list-row msoc-list-row-$rowId msoc-list-even" data-rowId="$rowId">');
                }

                if (rowIndex != this._runtime.dataContexts.rowsDataContext.rowCount() - 1) {
                    html.append('<div class="msoc-list-row-border"></div>');
                }

                html.append('</div>');

                this._elements.content.mainCanvas.insertAdjacentHTML('beforeend', html.toString());
                context.content.rows[rowId].rowElement = $(this._elements.content.mainCanvas.lastChild);
                context.content.rows[rowId].state = RenderState.Painted;
                painted = true;
            }

            var rowElement = context.content.rows[rowId].rowElement;
            var cells = context.content.rows[rowId].cells;
            var front = renderRange.front();
            var end = renderRange.end();

            html = new Fundamental.StringBuilder();
            var addedColumnIds = [];

            for (var columnIndex = front; columnIndex <= end; columnIndex++) {
                var columnId = this._runtime.dataContexts.columnsDataContext.getColumnIdByIndex(columnIndex),
                    column = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId);

                html.context().columnId = columnId;
                html.context().rowId = rowId;

                if (!cells[columnId]) {
                    cells[columnId] = {
                        state: RenderState.Initial,
                        contentElement: null,
                    };

                    html.append('<div class="msoc-list-content-cell msoc-list-content-cell-$columnId" data-rowId="$rowId" data-columnId="$columnId">');
                    html.append('<div class="msoc-list-content-cell-content msoc-list-content-cell-content-$columnId"></div>');
                    html.append('</div>');

                    addedColumnIds.push(columnId);
                }
            }

            var cellHtml = html.toString();

            if (cellHtml.length > 0) {
                rowElement[0].insertAdjacentHTML('beforeend', html.toString());

                var contentElements = rowElement.find('> .msoc-list-content-cell > div');

                for (var i = 0; i < addedColumnIds.length; i++) {
                    var columnId = addedColumnIds[i];

                    cells[columnId].contentElement = contentElements[contentElements.length - addedColumnIds.length + i];
                }

                painted = true;
            }

            for (var columnIndex = renderRange.front(); columnIndex <= renderRange.end(); columnIndex++) {
                var columnId = this._runtime.dataContexts.columnsDataContext.getColumnIdByIndex(columnIndex),
                    column = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId);

                if (cells[columnId].state != RenderState.Painted) {
                    var render = column.cellRender || SimpleTextCellRender.Instance();

                    render.render({
                        columnId: columnId,
                        column: column,
                        element: cells[columnId].contentElement,
                        cellData: row[column.field],
                        // height: rect.height,
                        // width: rect.width,
                        rtl: this._runtime.direction.rtl(),
                        theme: this._runtime.theme,
                    });

                    cells[columnId].state = RenderState.Painted;
                    painted = true;
                }
            }

            if (painted) {
                return true;
            }
        }
    }

    private _removeCellWorker(context) {
        for (var rowId in context.content.rows) {
            var rowIndex = this._runtime.dataContexts.rowsDataContext.getRowIndexById(rowId),
                row = this._runtime.dataContexts.rowsDataContext.getRowById(rowId);

            if (!row) {
                // In the case a row has been deleted from table
                var rowElement = context.content.rows[rowId].rowElement;

                if (rowElement) {
                    rowElement.remove();
                }

                delete context.content.rows[rowId];
                return true;
            } else if (rowIndex < this._renderRange.top() || rowIndex > this._renderRange.bottom()) {
                // The row is not showed in the render area
                var rowElement = context.content.rows[rowId].rowElement;

                if (rowElement) {
                    rowElement.remove();
                }

                delete context.content.rows[rowId];
                return true;
            } else {
                var cells = context.content.rows[rowId].cells;
                var removed = false;

                for (var columnId in cells) {
                    var columnIndex = this._runtime.dataContexts.columnsDataContext.getColumnIndexById(columnId);

                    if (columnIndex < this._renderRange.front() || columnIndex > this._renderRange.end()) {
                        var contentElement = cells[columnId].contentElement;

                        if (contentElement) {
                            $(contentElement).parent().remove();
                        }

                        delete cells[columnId];
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

