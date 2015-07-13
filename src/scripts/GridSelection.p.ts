export class GridSelection implements Fundamental.IFeature, Fundamental.IDisposable {
    public disposer;
    private _runtime: GridRuntime;
    private _invoke;
    private _selection;
    private _updaters;
    private _cursorUpdater;
    private _gridPosition : IGridPosition;

    public constructor() {
        this.disposer = new Fundamental.Disposer(() => {
            this._runtime = null;
            this._invoke = null;
        });
    }

    public dispose() {
        this.disposer.dispose();
    }

    public name() {
        return 'gridSelection';
    }

    public initialize(runtime, $invoke, gridPosition) {
        this._runtime = runtime;
        this._invoke = $invoke;
        this._selection = new Selection();
        this.selectionMode(SelectionMode.Range);

        this.disposer.addDisposable(this._updaters = new Microsoft.Office.Controls.Fundamental.UpdaterGroup());

        // this._updaters.add(this._cursorUpdater = this._getCursorUpdater());
    }

    public selectionMode(value?) {
        return Fundamental.PropertyBag.property({
            target: this,
            name: '_selectionMode',
            args: arguments,
            afterChange: (sender, args) => {
                this._selection.selectionMode(args.newValue);
            }
        });
    }

    private _getCursorUpdater() {
        // return new Microsoft.Office.Controls.Fundamental.Updater(
        //     () => {
        //         var cursor = this._runtime.selection.cursor();

        //         return {
        //             cellRect: this.getCellRect(cursor.rowIndex, cursor.columnIndex),
        //             thickness: this._options.theme.value('table.cursorBorder').width,
        //             color: this._options.theme.value('table.cursorBorder').color,
        //             style: this._options.theme.value('table.cursorBorder').style,
        //             cursor: this._options.theme.value('table.cellCursor'),
        //             rtl: this._runtime.direction.rtl(),
        //         }
        //     },
        //     (newValue) => {
        //         var cellRect = newValue.cellRect,
        //             thickness = newValue.thickness,
        //             color = newValue.color,
        //             style = newValue.style,
        //             cursor = newValue.cursor,
        //             canvas = this._elements.canvas.eq(TableView.CursorCanvasIndex),
        //             elements = canvas.find('.msoc-list-table-cursor');

        //         if (elements.length == 0) {
        //             elements = $('<div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div>');
        //             canvas.append(elements);
        //         }

        //         if (cellRect == null || isNaN(cellRect.width) || cellRect.width < 2 * thickness || cellRect.height < 2 * thickness) {
        //             elements.hide();
        //         } else {
        //             elements.show();
        //             elements.css('cursor', cursor);
        //             elements.css('border', '');
        //             elements.eq(0).css('top', cellRect.top + 'px');
        //             elements.eq(0).css('height', thickness + 'px');
        //             elements.eq(0).css(this._runtime.direction.front(), cellRect.front + 'px');
        //             elements.eq(0).css(this._runtime.direction.end(), '');
        //             elements.eq(0).css('width', cellRect.width + 'px');
        //             elements.eq(0).css('border-top-width', thickness + 'px');
        //             elements.eq(0).css('border-top-color', color);
        //             elements.eq(0).css('border-top-style', style);

        //             elements.eq(1).css('top', cellRect.top + 'px');
        //             elements.eq(1).css('height', cellRect.height + 'px');
        //             elements.eq(1).css(this._runtime.direction.front(), (cellRect.front + cellRect.width - thickness) + 'px');
        //             elements.eq(1).css(this._runtime.direction.end(), '');
        //             elements.eq(1).css('width', thickness + 'px');
        //             elements.eq(1).css('border-' + this._runtime.direction.end() + '-width', thickness + 'px');
        //             elements.eq(1).css('border-' + this._runtime.direction.end() + '-color', color);
        //             elements.eq(1).css('border-' + this._runtime.direction.end() + '-style', style);

        //             elements.eq(2).css('top', (cellRect.top + cellRect.height - thickness) + 'px');
        //             elements.eq(2).css('height', thickness + 'px');
        //             elements.eq(2).css(this._runtime.direction.front(), cellRect.front + 'px');
        //             elements.eq(2).css(this._runtime.direction.end(), '');
        //             elements.eq(2).css('width', cellRect.width + 'px');
        //             elements.eq(2).css('border-bottom-width', thickness + 'px');
        //             elements.eq(2).css('border-bottom-color', color);
        //             elements.eq(2).css('border-bottom-style', style);

        //             elements.eq(3).css('top', cellRect.top + 'px');
        //             elements.eq(3).css('height', cellRect.height + 'px');
        //             elements.eq(3).css(this._runtime.direction.front(), cellRect.front + 'px');
        //             elements.eq(3).css(this._runtime.direction.end(), '');
        //             elements.eq(3).css('width', thickness + 'px');
        //             elements.eq(3).css('border-' + this._runtime.direction.front() + '-width', thickness + 'px');
        //             elements.eq(3).css('border-' + this._runtime.direction.front() + '-color', color);
        //             elements.eq(3).css('border-' + this._runtime.direction.front() + '-style', style);
        //         }
        //     });
    }
}

