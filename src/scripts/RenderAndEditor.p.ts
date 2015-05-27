export class SimpleTextHeaderRender implements IRender {
    private _alignToEnd;
    private _getter;

    constructor(getter = null, alignToEnd = false) {
        this._getter = getter;
        this._alignToEnd = alignToEnd;
    }

    public title(args) {
        return this._getValue(args);
    }

    public render(args) {
        var value = this._getValue(args);

        args.element.textContent = value;
        $(args.element).attr('title', value);

        var align;

        if (this._alignToEnd && args.view != ViewType.Stack) {
            align = args.rtl ? 'left' : 'right';
        } else {
            align = args.rtl ? 'right' : 'left';
        }

        $(args.element).css('text-align', align);
    }

    private _getValue(args) {
        if (this._getter) {
            return this._getter({
                data: args.data,
            });
        } else {
            return args.data;
        }
    }
}

export class SimpleTextCellRender implements IRender {
    private _alignToEnd;
    private _getter;

    constructor(getter = null, alignToEnd = false) {
        this._getter = getter;
        this._alignToEnd = alignToEnd;
    }

    public title(args) {
        return this._getValue(args);
    }

    public render(args) {
        var value = this._getValue(args);

        if (typeof(value) != undefined && value != null && value !== '') {
            args.element.textContent = value;
            args.element.setAttribute('title', value);


            if (this._alignToEnd && args.view != ViewType.Stack) {
                args.element.style.textAlign = args.rtl ? 'left' : 'right';
            }
        }
    }

    private _getValue(args) {
        if (this._getter) {
            return this._getter({
                rowData: args.rowData,
                cellData: args.cellData,
            });
        } else {
            return args.cellData;
        }
    }
}

export class SimpleTextCellEditor implements IEditor {
    constructor() {
    }

    public edit(args) {
        var element = args.element,
            accept = args.accept,
            reject = args.reject,
            width = args.width,
            height = args.height,
            row = args.row,
            cellData = args.cellData,
            rtl = args.rtl,
            disposer = new Fundamental.Disposer();

        var input = $('<input style="position:absolute; left: 0px; top: 0px; width: 100%; height: 100%; border: 0px; outline: 0px;"></input>');

        $(element).append(input);
        input.val(cellData);
        input.focus();

        disposer.addDisposable(new Support.EventAttacher(input, 'focusout', () => {
            disposer.dispose();
            accept(input.val());
        }));

        disposer.addDisposable(new Support.EventAttacher(input, 'keydown', (event) => {
            if (event.which == 27) {
                disposer.dispose();
                reject();
            }
        }));
    }
}

export class SimpleCellEditor implements IEditor {
    private _externalEditor;
    private _keepWidth;
    private _keepHeight;

    constructor(externalEditor, keepHeight?, keepWidth?) {
        this._externalEditor = externalEditor;
        this._keepWidth = keepWidth || 0;
        this._keepHeight = keepHeight || 0;
    }

    public edit(args) {
        var element = args.element,
            events = args.events,
            row = args.row,
            rtl = args.rtl,
            width = args.width,
            height = args.height,
            cellData = args.cellData;

        if (this._keepWidth || this._keepWidth) {
            window.setTimeout(() => args.keepRect(this._keepHeight, this._keepWidth), 150);
        }

        this._externalEditor({
            element: element,
            cellData: cellData,
            row: row,
            rtl: rtl,
        })
        .done((value) => events.emit('accept', this, value))
        .fail(() => events.emit('reject', this, null));
    }
}

