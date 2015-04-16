class TableViewResizeColumnOperation implements IOperation {
    public disposer;
    private _deferred;
    private _resources;
    private _tableView: TableView;
    private _runtime;
    private _resizeColumnUniqueId;
    private _isTouch;
    private _pointerId;
    private _selectionStylesheet;
    private _selectionStylesheetText;
    private _splitters;
    private _startPointToHeaderViewportCoordinate;
    private _baseScrollCoordinate;
    private _initialFront;
    private _initialWidth;
    private _oldCanvasContainerWidth;
    private _oldHeaderCanvasContainerWidth;
    private _lastWidth;
    private _rtl;
    private _headerCanvasWidth;
    private _headerViewportCoordinate;
    private _headerCellElement;

    constructor() {
        this.disposer = new Support.Disposer(() => {
            this._selectionStylesheet.content(this._selectionStylesheetText);
            this._splitters[0].remove();
            this._splitters[1].remove();
            this._runtime.elements.canvasContainer.css('width', this._oldCanvasContainerWidth);
            this._runtime.elements.headerCanvasContainer.css('width', this._oldHeaderCanvasContainerWidth);
            // this._runtime.scrollTo(NaN, this._baseScrollCoordinate.front());
            this._headerCellElement.removeClass('msoc-list-table-header-cell-resizing');
            this._headerCellElement.attr('style', '');
            this._resources.dispose();
        });
    }

    public start(tableView: TableView, runtime, columnUniqueId, isTouch, pointerId, pointers, initialFront, initialWidth, selectionStylesheet): JQueryPromise<any> {
        this._resources = new Support.ResourceGroup();
        this._deferred = $.Deferred();
        this._tableView = tableView;
        this._runtime = runtime;
        this._resizeColumnUniqueId = columnUniqueId;
        this._headerCellElement = this._tableView.getHeaderCellElement(this._resizeColumnUniqueId);
        this._isTouch = isTouch;
        this._pointerId = pointerId;
        this._rtl = this._runtime.direction.rtl();
        this._startPointToHeaderViewportCoordinate = Support.CoordinateFactory.fromElement(this._rtl, this._runtime.elements.headerViewport).minus(pointers[pointerId]);
        this._startPointToHeaderViewportCoordinate.rtl(this._rtl);
        this._selectionStylesheet = selectionStylesheet;
        this._initialFront = initialFront;
        this._initialWidth = this._lastWidth = initialWidth;
        this._oldCanvasContainerWidth = this._runtime.elements.canvasContainer.css('width');
        this._oldHeaderCanvasContainerWidth = this._runtime.elements.canvasContainer.css('width');
        this._baseScrollCoordinate = Support.CoordinateFactory.scrollFromElement(this._rtl, this._runtime.elements.viewport);
        this._headerCellElement.addClass('msoc-list-table-header-cell-resizing');
        this._selectionStylesheetText = this._selectionStylesheet.content();
        this._selectionStylesheet.content('');
        this._resources.add(new Support.EventAttacher($(window), this._isTouch ? 'touchend' : 'mouseup', (event) => this._onPointerUp(event)));
        this._resources.add(new Support.EventAttacher($(window), this._isTouch ? 'touchmove' : 'mousemove', (event) => this._onPointerMove(event)));
        this._splitters = [$('<div class="msoc-list-table-resizer"></div>'), $('<div class="msoc-list-table-resizer"></div>')];
        this._runtime.elements.headerCanvas.eq(TableView.CursorCanvasIndex).append(this._splitters[0]);
        this._runtime.elements.canvas.eq(TableView.CursorCanvasIndex).append(this._splitters[1]);
        var scrollFrontCoordinate = Support.CoordinateFactory.scrollFromElement(this._rtl, this._runtime.elements.viewport);
        var baseResizerCoordinate = scrollFrontCoordinate.add(this._startPointToHeaderViewportCoordinate);

        this._splitters[0].css(this._runtime.direction.front(), baseResizerCoordinate.front() + 'px');
        this._splitters[0].css('height', this._runtime.elements.headerCanvasContainer.height() + 'px');
        this._splitters[1].css(this._runtime.direction.front(), baseResizerCoordinate.front() + 'px');
        this._splitters[1].css('height', this._runtime.elements.canvasContainer.height() + 'px');
        this._headerCanvasWidth = this._runtime.canvasWidth;
        this._headerViewportCoordinate = Support.CoordinateFactory.fromElement(this._rtl, this._runtime.elements.headerViewport);
        return this._deferred.promise();
    }

    public dispose() {
        this.disposer.dispose();
    }

    private _onPointerUp(event) {
        if (event.which == 1 || this._isTouch) {
            if (this._lastWidth >= 43 && this._lastWidth != this._initialWidth) {
                this._deferred.resolve(this._resizeColumnUniqueId, this._lastWidth);
            } else {
                this._deferred.reject();
            }
        }
    }

    private _onPointerMove(event) {
        var headerWidth = this._runtime.viewportWidth;
        var pointerCoordinate = Support.CoordinateFactory.fromEvent(this._rtl, event)[this._pointerId].minus(this._headerViewportCoordinate);
        var scrollCoordinate = Support.CoordinateFactory.scrollFromElement(this._rtl, this._runtime.elements.headerViewport);

        if (pointerCoordinate.front() < headerWidth * Constants.RatioToOperationScrollArea) {
            if (scrollCoordinate.front() - Constants.OperationScrollNumber > this._baseScrollCoordinate.front()) {
                // Do not scroll front when we are already scroll to the position we started with
                this._runtime.scroll(0, -Constants.OperationScrollNumber);
            } else if (scrollCoordinate.front() > this._baseScrollCoordinate.front()) {
                this._runtime.scroll(0, scrollCoordinate.front() - this._baseScrollCoordinate.front());
            }
        } else if (pointerCoordinate.front() > headerWidth * (1 - Constants.RatioToOperationScrollArea)) {
            if (this._headerCanvasWidth < scrollCoordinate.front() + this._runtime.viewportClientWidth + Constants.OperationScrollNumber) {
                // Extend the canvas when we hit the end of it
                this._runtime.elements.canvasContainer.css('width', (this._headerCanvasWidth + Constants.OperationScrollNumber) + 'px');
                this._runtime.elements.headerCanvasContainer.css('width', (this._headerCanvasWidth + Constants.OperationScrollNumber) + 'px');
                this._headerCanvasWidth += Constants.OperationScrollNumber;
            }

            this._runtime.scroll(0, Constants.OperationScrollNumber);
        }

        var minResizeFront = this._initialFront + 43;

        var resizerFront = Math.max(scrollCoordinate.front() + pointerCoordinate.front(), minResizeFront);

        var newWidth = resizerFront - this._initialFront;

        this._lastWidth = newWidth;
        this._headerCellElement.css('width', newWidth + 'px');
        this._headerCellElement.css('z-index', 1);
        this._headerCellElement.css('filter', 'alpha(opacity=90)');
        this._headerCellElement.css('-moz-opacity', 0.9);
        this._headerCellElement.css('-khtml-opacity', 0.9);
        this._headerCellElement.css('opacity', 0.9);

        this._splitters[0].css(this._runtime.direction.front(), resizerFront + 'px');
        this._splitters[1].css(this._runtime.direction.front(), resizerFront + 'px');
    }
}

