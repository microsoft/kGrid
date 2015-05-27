class TableViewKeySelectOperation implements IOperation {
    public disposer;
    private _tableView: TableView;
    private _visibleColumnMap;
    private _runtime;

    constructor() {
        this.disposer = new Fundamental.Disposer(() => {
        });
    }

    public start(tableView, runtime, event, selectionUpdater) {
        this._tableView = tableView;
        this._visibleColumnMap = this._tableView.visibleColumnMap();
        this._runtime = runtime;

        var shiftKey = event.shiftKey,
            deferred = $.Deferred();

        if (this._runtime.selection.selectionMode() == SelectionMode.SingleRow
            && this._runtime.selection.selectionMode() == SelectionMode.Cell) {
            deferred.reject();
            return deferred.promise();
        }

        if (!this._runtime.selection.cursor().isValid()) {
            deferred.reject();
            return deferred.promise();
        }

        var selectedRange = this._runtime.selection.rangeOfCursor();

        if (event.type == 'keypress' && event.keyCode == 32) {
            switch (this._runtime.selection.selectionMode()) {
                case SelectionMode.MultipleRows:
                    if (selectedRange) {
                        deferred.resolve({
                            action: 'deselect',
                            range: new Range(RangeType.Row, this._runtime.selection.cursor().rowIndex, this._runtime.selection.cursor().rowIndex, NaN, NaN),
                        });
                    } else {
                        deferred.resolve({
                            action: 'select',
                            range: new Range(RangeType.Row, this._runtime.selection.cursor().rowIndex, this._runtime.selection.cursor().rowIndex, NaN, NaN),
                        });
                    }

                    return deferred.promise();

                case SelectionMode.Range:
                    if (selectedRange) {
                        deferred.resolve({
                            action: 'deselect',
                            range: selectedRange,
                        });
                    } else {
                        deferred.resolve({
                            action: 'select',
                            range: new Range(RangeType.Range, this._runtime.selection.cursor().rowIndex, this._runtime.selection.cursor().rowIndex, this._runtime.selection.cursor().columnIndex, this._runtime.selection.cursor().columnIndex),
                        });
                    }

                    return deferred.promise();
            }
        }

        if (!shiftKey) {
            deferred.reject();
            return deferred.promise();
        }

        return deferred.promise();
    }

    public dispose() {
        this.disposer.dispose();
    }

    // FIXME: [high][3 days] Add shift key select mode
}

