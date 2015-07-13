export class GridSelection implements Fundamental.IFeature, Fundamental.IDisposable {
    public disposer;
    private _runtime: GridRuntime;
    private _invoke;
    private _selection;
    private _updaters;
    private _cursorUpdater;
    private _positionService : IGridPosition;
    private _elementService : IGridElement;

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

    public inject($invoke) {
    }

    public initialize(runtime, $invoke, positionService, elementService) {
        this._runtime = runtime;
        this._invoke = $invoke;
        this._positionService = positionService;
        this._elementService = elementService;
        this._selection = new Selection();
        this.selectionMode(SelectionMode.Range);

        this.disposer.addDisposable(this._updaters = new Microsoft.Office.Controls.Fundamental.UpdaterGroup());
        this._updaters.add(this._cursorUpdater = this._getCursorUpdater());

        this._selection.rowCount(this._runtime.dataContexts.rowsDataContext.rowCount());
        this._selection.columnCount(this._runtime.dataContexts.columnsDataContext.visibleColumnIds().length);

        this._attachEvents();
        this._updaters.update();
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

    private _attachEvents() {
        this.disposer.addDisposable(new Fundamental.EventAttacher(this._runtime.dataContexts.rowsDataContext, 'rowCountChange',  (sender, args) => {
            this._selection.rowCount(args.newValue);
            this._updaters.update();
        }));
        this.disposer.addDisposable(new Fundamental.EventAttacher(this._runtime.dataContexts.columnsDataContext, 'visibleColumnIdsChange',  (sender, args) => {
            this._selection.columnCount(args.newValue.length);
            this._updaters.update();
        }));
    }

    private _getCursorUpdater() {
        return new Microsoft.Office.Controls.Fundamental.Updater(
            () => {
                var cursor = this._selection.cursor();

                return {
                    cellRect: this._positionService.getRect(cursor.rowIndex, cursor.columnIndex, cursor.rowIndex, cursor.columnIndex),
                    thickness: this._runtime.theme.values['content.cursor.border'].number,
                    color: this._runtime.theme.values['content.cursor.border'].color,
                    style: this._runtime.theme.values['content.cursor.border'].style,
                    cursor: this._runtime.theme.texts['content.cell.cursor'],
                    rtl: this._runtime.direction.rtl(),
                }
            },
            (newValue) => {
                var cellRect = newValue.cellRect,
                    thickness = newValue.thickness,
                    color = newValue.color,
                    style = newValue.style,
                    cursor = newValue.cursor,
                    canvas = $(this._elementService.getFrontContentCanvas()),
                    elements = canvas.find('.msoc-list-table-cursor');

                if (elements.length == 0) {
                    elements = $('<div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div><div class="msoc-list-table-cursor"></div>');
                    canvas.append(elements);
                }

                if (cellRect == Fundamental.Rect.Null || cellRect.width < 2 * thickness || cellRect.height < 2 * thickness) {
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
}

