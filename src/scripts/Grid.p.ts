export class Grid {
    public disposer;
    private _runtime: GridRuntime;
    private _invoke;

    public constructor(container, $invoke) {
        this.disposer = new Fundamental.Disposer(() => {
            this._runtime = null;
        });

        if (!$invoke) {
            this._invoke = invoke.inherit();
        } else {
            this._invoke = $invoke.inherit();
        }

        this._runtime = new GridRuntime();
        this._runtime.width = $(container).width();
        this._runtime.height = $(container).height();
        this._runtime.dataContexts = {};
        this._runtime.container = container;
        this._runtime.id = (new Date()).valueOf();
        this._runtime.theme = Theme.Default;
        this._runtime.selectionMode = SelectionMode.SingleRow;
        this._runtime.events = null;
        this._runtime.rootClass = 'msoc-list-' + this._runtime.id;
        this._runtime.elements = {};
        this._runtime.direction = new Fundamental.TextDirection(Fundamental.TextDirection.LTR);
        this._runtime.viewportScrollCoordinate = new Microsoft.Office.Controls.Fundamental.Coordinate(Microsoft.Office.Controls.Fundamental.CoordinateType.ViewportRelative, 0, 0),
        this.disposer.addDisposable(this._runtime.updaters = new Microsoft.Office.Controls.Fundamental.UpdaterGroup());
        this.disposer.addDisposable(this._runtime.renderingScheduler = new Microsoft.Office.Controls.Fundamental.RenderingScheduler());

        // FIXME: initialize the injection

        this._invoke.inject('grid', this);
        this._invoke.inject('runtime', this._runtime);
        this._invoke.injectFactory('rootElement', (runtime) => {
            return $(
                '<div class="msoc-list ' + runtime.rootClass + '" tabindex="0" aria-labelledby="msocListScreenReader_' + runtime.id + '">' +
                    '<div id="msocListScreenReader_' + runtime.id + '" class="msoc-list-screen-reader" aria-live="assertive"></div>' +
                    '<div class="msoc-list-header-viewport">' +
                        '<div class="msoc-list-canvas-container">' +
                            '<div class="msoc-list-canvas"></div>' +
                            '<div class="msoc-list-canvas"></div>' +
                            '<div class="msoc-list-canvas"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="msoc-list-content-viewport">' +
                        '<div class="msoc-list-canvas-container">' +
                            '<div class="msoc-list-canvas"></div>' +
                            '<div class="msoc-list-canvas"></div>' +
                            '<div class="msoc-list-canvas"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>')[0];
        });

        // FIXME: initillize the plug-ins

        this._invoke((rootElement) => {
            var layoutStylesheetUpdater,
                container = $(this._runtime.container);

            this._runtime.rootElement = rootElement;


            container.html('');
            container.append(rootElement);
            this._updateElements();
            this._updateUIValues();
            this.disposer.addDisposable(layoutStylesheetUpdater = new Microsoft.Office.Controls.Fundamental.DynamicStylesheetUpdater(this._runtime.id));
            layoutStylesheetUpdater.add(() => this._getLayoutStylesheet());
            this._runtime.updaters.add(layoutStylesheetUpdater.getUpdater());
            this._runtime.updaters.add(this._getRenderRangeUpdater());

            var renderContext = {
                headerCells: [],
            };

            this._runtime.renderingScheduler.addWorker((context) => this._renderHeaderCellWorker(context), renderContext, 800);

            window.setTimeout(() => {
                this._runtime.updaters.update();
                this._runtime.renderingScheduler.start(true);

                // FIXME: [low][1 day] Add a firefox checker
                // Workaround FireFox bug https://bugzilla.mozilla.org/show_bug.cgi?id=706792
                // this._elements.canvasContainer.css('width', '1000000px');
                // this._elements.canvasContainer.css('height', '1000000px');
                // this._elements.viewport.scrollLeft(0);
                // this._elements.viewport.scrollTop(0);
                // this._elements.canvasContainer.css('width', '');
                // this._elements.canvasContainer.css('height', '');
                // this._elements.headerCanvasContainer.css('width', '1000000px');
                // this._elements.headerCanvasContainer.css('height', '1000000px');
                // this._elements.headerViewport.scrollLeft(0);
                // this._elements.headerViewport.scrollTop(0);
                // this._elements.headerCanvasContainer.css('width', '');
                // this._elements.headerCanvasContainer.css('height', '');
            });
        });
    }

    public dispose() {
        this.disposer.dispose();
    }

    public rowsDataContext(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime.dataContexts,
            name: 'rowsDataContext',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }

    public columnsDataContext(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime.dataContexts,
            name: 'columnsDataContext',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }

    public width(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime,
            name: 'width',
            args: arguments,
            afterChange: (sender, args) => {
                this._updateUIValues();
            },
        });
    }

    public height(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime,
            name: 'height',
            args: arguments,
            afterChange: (sender, args) => {
                this._updateUIValues();
            },
        });
    }

    private _updateElements() {
        var root = $(this._runtime.rootElement),
            header = root.find('>.msoc-list-header-viewport'),
            content = root.find('>.msoc-list-content-viewport');

        this._runtime.elements = {
            root: this._runtime.rootElement,
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
            },
        };
    }

    private _updateUIValues() {
        var viewport = $(this._runtime.elements.content.viewport);
        var canvas = $(this._runtime.elements.content.canvas);

        this._runtime.uiValues = {
            content: {
                viewport: {
                    width: viewport.width(),
                    height: viewport.height(),
                    clientWidth: viewport[0].clientWidth,
                    clientHeight: viewport[0].clientHeight,
                },
                canvas: {
                    width: canvas.width(),
                    height: canvas.height(),
                }
            },
        };
    }

    private _getRowHeight() {
        return this._runtime.theme.value('table.rowHeight');
    }

    private _getRenderRange() {
        var topRowIndex,
            bottomRowIndex,
            columnFront = 0,
            visibleColumnIds = this._runtime.dataContexts.columnsDataContext.visibleColumnIds(),
            frontColumnIndex = 0,
            front = 0,
            endColumnIndex = visibleColumnIds.length - 1;

        topRowIndex = Math.floor(this._runtime.viewportScrollCoordinate.top() / (this._getRowHeight() + this._runtime.theme.value('table.cellHBorder').width));
        topRowIndex = Math.max(0, topRowIndex);
        bottomRowIndex = Math.floor((this._runtime.viewportScrollCoordinate.top() + this._runtime.uiValues.content.viewport.height) / (this._getRowHeight() + this._runtime.theme.value('table.cellHBorder').width));
        bottomRowIndex = Math.min(this._runtime.dataContexts.rowsDataContext.rowCount() - 1, bottomRowIndex);

        for (var columnIndex = 0; columnIndex < visibleColumnIds.length; columnIndex++) {
            var column = this._runtime.dataContexts.columnsDataContext.getColumnById(visibleColumnIds[columnIndex]);

            if (!isNaN(column.width) && column.width > 0) {
                front += column.width;
            } else {
                // FIXME: default column width
                front += 50;
            }

            if (front <= this._runtime.viewportScrollCoordinate.front()) {
                frontColumnIndex = columnIndex;
            }

            if (front < this._runtime.viewportScrollCoordinate.front() + this._runtime.uiValues.content.viewport.clientWidth) {
                endColumnIndex = columnIndex;
            } else {
                break;
            }
        }

        return new Range(RangeType.Range, topRowIndex, bottomRowIndex, frontColumnIndex, endColumnIndex);
    }

    private _getRenderRangeUpdater() {
        var eventSender = new Microsoft.Office.Controls.Fundamental.AccumulateTimeoutInvoker(() => {
            if (this._runtime.renderRange.isValid()) {
                // this._runtime.events.emit(
                //     'table.beforeRender',
                //     this,
                //     {
                //         renderRange: this._runtime.renderRange,
                //     });
            }
        }, 16.67);

        return new Microsoft.Office.Controls.Fundamental.Updater(
            () => {
                var renderRange = this._getRenderRange();
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

                this._runtime.renderRange = renderRange;

                eventSender.invoke();
            });
    }

    private _getLayoutStylesheet() {
        var cssText = new Microsoft.Office.Controls.Fundamental.CssTextBuilder();

        cssText.push('.');
        cssText.push(this._runtime.rootClass);
        cssText.property('width', this._runtime.width, 'px');
        cssText.property('height', this._runtime.height, 'px');
        cssText.property('background-color', this._runtime.theme.value('backgroundColor'));

        return cssText.toString();
    }

    private _renderHeaderCellWorker(context) {
        var renderRange = this._runtime.renderRange;

        if (!renderRange.isValid()) {
            return;
        }

        var headerMainCanvas = $(this._runtime.elements.header.mainCanvas),
            html = new Microsoft.Office.Controls.Fundamental.StringBuilder(),
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

                html.append('<div class="msoc-list-table-header-cell msoc-list-table-header-cell-');
                html.append(columnId);

                html.append('" data-columnId="');
                html.append(columnId);
                html.append('">');
                html.append('<div class="msoc-list-table-header-cell-content msoc-list-table-header-cell-content-');
                html.append(columnId);
                html.append('">');
                html.append('</div>');
                html.append('<div class="msoc-list-table-header-cell-v-border msoc-list-table-header-cell-v-border-');
                html.append(columnId);
                html.append('"></div>');

                html.append('<div class="msoc-list-table-header-cell-splitter msoc-list-table-header-cell-splitter-front"></div>');
                html.append('<div class="msoc-list-table-header-cell-splitter msoc-list-table-header-cell-splitter-end"></div>');
                html.append('</div>');

                addedColumnIds.push(columnId);
            }
        }

        var headerCellHtml = html.toString();

        if (headerCellHtml.length > 0) {
            headerMainCanvas[0].insertAdjacentHTML('beforeend', headerCellHtml);

            var headerCellContentElements = headerMainCanvas.find('> .msoc-list-table-header-cell > .msoc-list-table-header-cell-content');

            for (var i = 0; i < addedColumnIds.length; i++) {
                var columnId = addedColumnIds[i];

                context.headerCells[columnId].contentElement = headerCellContentElements[headerCellContentElements.length - addedColumnIds.length + i];
            }
        }

        for (var i = <number>renderRange.front(); i<= renderRange.end(); i++) {
            var columnId = visibleColumnIds[i],
                column = this._runtime.dataContexts.columnsDataContext.getColumnById(columnId);

            if (context.headerCells[columnId].state != RenderState.Painted) {
                var render = column.headerRender || SimpleTextHeaderRender.instance();

                render.render({
                    columnId: columnId,
                    column: column.raw,
                    element: context.headerCells[columnId].contentElement,
                    data: column.raw.data,
                    // height: rect.height,
                    // width: rect.width,
                    rtl: this._runtime.direction.rtl(),
                    theme: this._runtime.theme,
                });

                context.headerCells[columnId].state = RenderState.Painted;
            }
        }
    }
}

