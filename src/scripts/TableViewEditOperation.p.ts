class TableViewEditOperation implements IOperation {
    public disposer;
    private _runtime;
    private _tableView: TableView;
    private _row;
    private _resources;
    private _rowIndex;
    private _columnUniqueId;
    private _columnIndex;
    private _editor;
    private _editElement;
    private _events;
    private _deferred;
    private _stylesheet;

    constructor() {
        this.disposer = new Support.Disposer(() => {
            this._events.emit('close', this, null);

            if (this._deferred.state() == 'pending') {
                this._deferred.reject();
            }

            this._resources.dispose();

            if (this._editElement) {
                this._editElement.remove();
            }
        });
    }

    public start(tableView, runtime, rowIndex, columnIndex) {
        this._tableView = tableView;
        this._runtime = runtime;
        this._resources = new Support.ResourceGroup();
        this._rowIndex = rowIndex;
        this._columnUniqueId = tableView.visibleColumnMap()[columnIndex];
        this._columnIndex = columnIndex;
        this._resources.add(this._events = new Support.EventSite());
        this._deferred = $.Deferred();
        var column = this._runtime.options.columns[this._columnUniqueId];

        this._editor = column.cellEditor;

        if (!this._editor) {
            this._deferred.reject();
            return this._deferred.promise();
        }

        var cellRange = this._tableView.getCellRect(this._rowIndex, this._columnIndex);

        this._editElement = $('<div class="msoc-list-table-cell-editing" tabindex=""></div>');
        this._editElement.css('top', cellRange.top);
        this._editElement.css('height', cellRange.height);
        this._editElement.css(this._runtime.direction.front(), cellRange.front);
        this._editElement.css('width', cellRange.width);

        this._runtime.elements.canvas.eq(TableView.CursorCanvasIndex).append(this._editElement);

        this._resources.add(
            new Support.EventAttacher(
                this._runtime.events,
                'beforeMouseDownFocus',
                (sender, args) => {
                    if (args.event.target == this._editElement[0]) {
                        args.element = $(event.target);
                    } else if ($.contains(this._editElement[0], args.event.target)) {
                        args.cancel = true;
                    }
                }));

        this._resources.add(this._stylesheet = new Support.DynamicStylesheet(this._runtime.id + '_edit'));

        var cssText = new Support.CssTextBuilder(),
            row = this._runtime.getRowByIndex(rowIndex);

        this._runtime.buildCssRootSelector(cssText);
        cssText.push('.msoc-list-row.msoc-list-table-row-');
        cssText.push(row.rowUniqueId);
        cssText.push('>.msoc-list-table-cell-');
        cssText.push(this._columnUniqueId);
        cssText.property('visibility', 'hidden');

        this._stylesheet.content(cssText.toString());

        var row = this._runtime.options.rows[this._rowIndex];
        var cellData = row[column.raw.field];

        this._editor.edit({
            element: this._editElement[0],
            keepRect: (height, width) => {
                var cellRect = this._tableView.getCellRect(this._rowIndex, this._columnIndex);

                this._runtime.scrollIntoView(cellRect.top, cellRect.front, Math.max(cellRect.height, height), Math.max(cellRect.width, width));
            },
            events: this._events,
            width: cellRange.width,
            height: cellRange.height,
            row: row,
            rowIndex: this._rowIndex,
            column: column.raw,
            columnIndex: this._tableView.getColumnIndexById(this._columnUniqueId),
            columnId: this._columnUniqueId,
            cellData: cellData,
        });

        this._resources.add(new Support.EventAttacher(this._events, 'accept', (sender, args) => this._deferred.resolve(args)));
        this._resources.add(new Support.EventAttacher(this._events, 'reject', () => this._deferred.reject()));

        return this._deferred.promise();
    }

    public dispose() {
        this.disposer.dispose();
    }

    // FIXME: [low][1 day] hide the cursor
}

