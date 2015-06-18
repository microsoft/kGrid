class TableViewReorderColumnOperation implements IOperation {
    public disposer: Fundamental.Disposer;
    private _deferred;
    private _tableView: TableView;
    private _runtime;
    private _rtl;
    private _headerCellElement;
    private _headerCellCoverElement;
    private _reorderColumnUniqueId;
    private _reorderColumnIndex;
    private _isTouch;
    private _pointerId;
    private _pointerDownCoordinate;
    private _startPointToHeaderElement;
    private _transitionStylesheet;
    private _movingStylesheet;
    private _currentColumnStylesheet;
    private _selectionStylesheet;
    private _selectionStylesheetText;
    private _lastNewPlaceIndex;
    private _headerViewportCoordinate;
    private _visibleColumnMap;
    private _started;

    constructor() {
        this.disposer = new Fundamental.Disposer(() => {
            this._runtime.elements.root.removeClass('msoc-list-table-operation-ReorderColumn');
            this._runtime.elements.canvas.eq(TableView.CursorCanvasIndex).show();
            this._selectionStylesheet.content(this._selectionStylesheetText);
            this._headerCellElement.removeClass('msoc-list-table-header-cell-moving');

            if (this._headerCellCoverElement) {
                this._headerCellCoverElement.remove();
            }
        });
    }

    public start(tableView, runtime, headerCellElement, isTouch, pointerId, pointerDownCoordinate, selectionStylesheet): JQueryPromise<any> {
        this._deferred = $.Deferred();
        this._tableView = tableView;
        this._runtime = runtime;
        this._runtime.elements.root.addClass('msoc-list-table-operation-ReorderColumn');
        this._selectionStylesheet = selectionStylesheet;
        this._rtl = this._runtime.direction.rtl();
        this._headerCellElement = headerCellElement;
        this._isTouch = isTouch;
        this._pointerId = pointerId;
        this._startPointToHeaderElement = Support.CoordinateFactory.fromElement(this._rtl, this._headerCellElement).minus(pointerDownCoordinate);
        this._pointerDownCoordinate = pointerDownCoordinate;
        this._startPointToHeaderElement.rtl(this._rtl);
        this._started = false;
        this._visibleColumnMap = this._tableView.visibleColumnMap();
        this._reorderColumnUniqueId = this._headerCellElement.attr('data-columnUniqueId');
        this._reorderColumnIndex = this._visibleColumnMap.indexOf(this._reorderColumnUniqueId);
        this._selectionStylesheetText = this._selectionStylesheet.content();

        var args = {
            fromColumnIndex: this._reorderColumnIndex,
            cancel: false,
        };

        this._runtime.events.emit('table.beforeColumnReorder', this, args);

        if (!!args.cancel) {
            this._deferred.reject();
            return this._deferred.promise();
        }

        this.disposer.addDisposable(this._transitionStylesheet = new Microsoft.Office.Controls.Fundamental.DynamicStylesheet(this._runtime.id + '_moving_column_transition'));
        this.disposer.addDisposable(this._movingStylesheet = new Microsoft.Office.Controls.Fundamental.DynamicStylesheet(this._runtime.id + '_moving_column'));
        this.disposer.addDisposable(this._currentColumnStylesheet = new Microsoft.Office.Controls.Fundamental.DynamicStylesheet(this._runtime.id + '_moving_current_column'));
        this._runtime.elements.canvas.eq(TableView.CursorCanvasIndex).hide();
        this._lastNewPlaceIndex = -1;

        this._selectionStylesheet.content('');

        var cssText = new Support.CssTextBuilder();

        this._runtime.buildCssRootSelector(cssText, '.msoc-list-table-operation-ReorderColumn');
        cssText.push('.msoc-list-table-header-cell');
        cssText.property('transition', this._runtime.direction.front() + ' 200ms');

        this._runtime.buildCssRootSelector(cssText, '.msoc-list-table-operation-ReorderColumn');
        cssText.push('.msoc-list-table-header-cell.msoc-list-table-header-cell-');
        cssText.push(this._reorderColumnUniqueId);
        cssText.property('transition', 'none');

        this._runtime.buildCssRootSelector(cssText, '.msoc-list-table-operation-ReorderColumn');
        cssText.push('.msoc-list-table-header-cell-v-border-');
        cssText.push(this._reorderColumnUniqueId);
        cssText.property('display', 'none');

        this._transitionStylesheet.content(cssText.toString());

        this.disposer.addDisposable(new Fundamental.EventAttacher($(window), this._isTouch ? 'touchend' : 'mouseup', (event) => this._onPointerUp(event)));
        this.disposer.addDisposable(new Fundamental.EventAttacher($(window), this._isTouch ? 'touchmove' : 'mousemove', (event) => this._onPointerMove(event)));

        this._headerViewportCoordinate = Support.CoordinateFactory.fromElement(this._rtl, this._runtime.elements.headerViewport);
        return this._deferred.promise();
    }

    private _onPointerUp(event) {
        if (event.which == 1 || (this._isTouch && Support.BrowserDetector.getChangedPointerIdentifier(event).indexOf(this._pointerId) >= 0)) {
            if (this._started && this._lastNewPlaceIndex >= 0 && this._lastNewPlaceIndex != this._reorderColumnIndex) {
                this._deferred.resolve(this._reorderColumnIndex, this._lastNewPlaceIndex);
            } else {
                this._deferred.reject();
            }
        }
    }

    private _onPointerMove(event) {
        var pointerCoordinate = Support.CoordinateFactory.fromEvent(this._rtl, event)[this._pointerId];

        if (!this._started) {
            var offsetMovement = pointerCoordinate.minus(this._pointerDownCoordinate);

            if (offsetMovement.x() > 5 || offsetMovement.x() < -5 || offsetMovement.y() > 5 || offsetMovement.y() < -5)
            {
                this._started = true;
            } else {
                return;
            }
        }

        var headerWidth = this._runtime.elements.headerViewport.width();
        var pointerToHeaderViewCoordinate = pointerCoordinate.minus(this._headerViewportCoordinate);

        this._headerCellElement.addClass('msoc-list-table-header-cell-moving');

        if (!this._headerCellCoverElement) {
            this._headerCellElement.append(this._headerCellCoverElement = $('<div></div>'));
            this._headerCellCoverElement.css('position', 'absolute');
            this._headerCellCoverElement.css('top', '0px');
            this._headerCellCoverElement.css('bottom', '0px');
            this._headerCellCoverElement.css('left', '0px');
            this._headerCellCoverElement.css('right', '0px');
        }

        pointerToHeaderViewCoordinate.rtl(this._rtl);

        if (pointerToHeaderViewCoordinate.front() < headerWidth * Constants.RatioToOperationScrollArea) {
            this._runtime.scroll(0, -Constants.OperationScrollNumber);
        } else if (pointerToHeaderViewCoordinate.front() > headerWidth * (1 - Constants.RatioToOperationScrollArea)) {
            this._runtime.scroll(0, Constants.OperationScrollNumber);
        }

        var pointerCoordinate = Support.CoordinateFactory.scrollFromElement(this._rtl, this._runtime.elements.headerViewport).add(pointerToHeaderViewCoordinate);
        var currentColumnCssText = new Support.CssTextBuilder();
        var headerCellRect = this._tableView.getHeaderCellRect(this._reorderColumnUniqueId);

        this._runtime.buildCssRootSelector(currentColumnCssText, '.msoc-list-table-operation-ReorderColumn');
        currentColumnCssText.push('.msoc-list-table-header-cell-');
        currentColumnCssText.push(this._reorderColumnUniqueId);
        currentColumnCssText.property(this._runtime.direction.front(), pointerCoordinate.front() - headerCellRect.width / 2, 'px');
        currentColumnCssText.property('z-index', 1);
        currentColumnCssText.property('filter', 'alpha(opacity=90)');
        currentColumnCssText.property('-moz-opacity', 0.9);
        currentColumnCssText.property('-khtml-opacity', 0.9);
        currentColumnCssText.property('opacity', 0.9);

        this._runtime.buildCssRootSelector(currentColumnCssText, '.msoc-list-table-operation-ReorderColumn');
        currentColumnCssText.push('.msoc-list-table-header-cell-v-border-');
        currentColumnCssText.push(this._reorderColumnUniqueId);
        currentColumnCssText.property('display', 'none');

        this._currentColumnStylesheet.content(currentColumnCssText.toString());

        var newPlaceIndex = this.getNewPlaceIndex(pointerCoordinate.front());

        if (newPlaceIndex != this._lastNewPlaceIndex) {
            var args = {
                fromColumnIndex: this._reorderColumnIndex,
                toColumnIndex: newPlaceIndex,
                cancel: false,
            };

            this._runtime.events.emit('table.beforeColumnReorder', this, args);

            if (!args.cancel) {
                this._lastNewPlaceIndex = newPlaceIndex;

                if (newPlaceIndex != this._reorderColumnIndex) {
                    var movingToFront = this._reorderColumnIndex > newPlaceIndex,
                        fromIndex = movingToFront ? newPlaceIndex : this._reorderColumnIndex,
                        toIndex = movingToFront ? this._reorderColumnIndex : newPlaceIndex,
                        front = this._runtime.options.columns[this._visibleColumnMap[fromIndex]].table.front;

                    if (movingToFront) {
                        front += this._tableView.getColumnWidth(this._reorderColumnUniqueId) + this._runtime.options.theme.value('table.cellVBorder').width;
                    }

                    var cssText = new Support.CssTextBuilder();

                    for (var i = <number>fromIndex; i < toIndex; i++) {
                        if (i == this._reorderColumnIndex) {
                            continue;
                        }

                        var width = this._tableView.getColumnWidth(this._visibleColumnMap[i]);

                        this._runtime.buildCssRootSelector(cssText, '.msoc-list-table-operation-ReorderColumn');
                        cssText.push('.msoc-list-table-header-cell-');
                        cssText.push(this._visibleColumnMap[i]);
                        cssText.property(this._runtime.direction.front(), front, 'px');

                        front += width + this._runtime.options.theme.value('table.cellVBorder').width;
                    }

                    this._movingStylesheet.content(cssText.toString());
                }
            }
        }
    }

    private getNewPlaceIndex(x) {
        var newPlaceIndex = this._visibleColumnMap.length;

        for (var i = 0; i < this._visibleColumnMap.length; i++) {
            var column = this._runtime.options.columns[this._visibleColumnMap[i]];

            if (column.table.front + this._tableView.getColumnWidth(this._visibleColumnMap[i]) * 0.3 > x) {
                newPlaceIndex = i;
                break;
            }
        }

        return newPlaceIndex;
    }

    public dispose() {
        this.disposer.dispose();
    }
}

