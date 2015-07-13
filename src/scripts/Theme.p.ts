// FIXME: deprecated
export class Theme {
    public static parsePadding(text) {
        var parts = text.split(' ');

        if (parts.length != 4) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', 'cannot parse ' + text + ' as padding');
        }

        if (!this._checkPixelUnit(parts[0])
            || !this._checkPixelUnit(parts[1])
            || !this._checkPixelUnit(parts[2])
            || !this._checkPixelUnit(parts[3])) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', 'padding can be in pixel only');
        }

        return {
            top: parseInt(parts[0]),
            end: parseInt(parts[1]),
            bottom: parseInt(parts[2]),
            front: parseInt(parts[3]),
            raw: {
                ltr: parts[0] + ' ' + parts[1] + ' ' + parts[2] + ' ' + parts[3],
                rtl: parts[0] + ' ' + parts[3] + ' ' + parts[2] + ' ' + parts[1],
            },
            type: 'padding',
        }
    }

    public static parseBorder(text) {
        var parts = text.split(' ');

        if (parts.length != 3) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', 'cannot parse ' + text + ' as border');
        }

        if (!/^\d+px$/.test(parts[1])) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', 'border width can be in pixel only');
        }

        return {
            style: parts[0],
            width: parseInt(parts[1]),
            color: parts[2],
            raw: text,
            type: 'border',
        }
    }

    private static _inheritMap = [
        ['cellPadding', 'headerCellPadding'],
        ['cellPadding', 'table.cellPadding', 'stack.cellPadding'],
        ['headerCellPadding', 'table.headerCellPadding', 'stack.headerCellPadding'],
        ['backgroundColor', 'rowBackgroundColor'],
        ['rowBackgroundColor', 'headerRowBackgroundColor', 'alternateRowBackgroundColor'],
        ['rowBackgroundColor', 'table.evenRowBackgroundColor', 'stack.evenRowBackgroundColor'],
        ['alternateRowBackgroundColor', 'table.oddRowBackgroundColor', 'stack.oddRowBackgroundColor'],
        ['headerRowBackgroundColor', 'table.headerRowBackgroundColor'],
        ['cellFontFamily', 'headerCellFontFamily'],
        ['cellFontSize', 'headerCellFontSize'],
        ['cellFontFamily', 'table.cellFontFamily', 'stack.cellFontFamily'],
        ['cellFontSize', 'table.cellFontSize', 'stack.cellFontSize'],
        ['headerCellFontFamily', 'table.headerCellFontFamily', 'stack.headerCellFontFamily'],
        ['headerCellFontSize', 'table.headerCellFontSize', 'stack.headerCellFontSize'],
        ['cellColor', 'table.cellColor', 'stack.cellColor'],
        ['headerCellColor', 'table.headerCellColor', 'stack.headerCellColor'],
    ];

    private static _validValueName = [
        'backgroundColor',
        'rowBackgroundColor',
        'alternateRowBackgroundColor',
        'cellColor',
        'cellFontFamily',
        'cellPadding',
        'headerRowBackgroundColor',
        'headerCellColor',
        'headerCellFontFamily',
        'headerCellFontSize',
        'headerCellPadding',
        'hoverBackgroundColor',
        'selectionBackgroundColor',
        'cellFontSize',
        'stack.oddRowBackgroundColor',
        'stack.evenRowBackgroundColor',
        'stack.cellColor',
        'stack.cellCursor',
        'stack.cellFontFamily',
        'stack.cellFontSize',
        'stack.cellHBorder',
        'stack.cellHeight',
        'stack.cellPadding',
        'stack.headerCellColor',
        'stack.headerCellPadding',
        'stack.headerCursor',
        'stack.headerEndBorder',
        'stack.headerCellFontFamily',
        'stack.headerCellFontSize',
        'stack.headerHBorder',
        'stack.rowBorder',
        'stack.rowPadding',
        'table.oddRowBackgroundColor',
        'table.evenRowBackgroundColor',
        'table.cellColor',
        'table.cellCursor',
        'table.cellFontFamily',
        'table.cellFontSize',
        'table.cellHBorder',
        'table.cellPadding',
        'table.cellVBorder',
        'table.cellWidth',
        'table.cursorBorder',
        'table.headerBottomBorder',
        'table.headerRowBackgroundColor',
        'table.headerCellColor',
        'table.headerCellPadding',
        'table.headerCellVBorder',
        'table.headerCursor',
        'table.headerCellFontFamily',
        'table.headerCellFontSize',
        'table.headerRowHeight',
        'table.rowHeight',
        'table.canvasEndMargin',
        'table.canvasBottomMargin',
        'stack.selectionIndicatorWidth',
        'stack.selectionIndicatorPadding',
    ];

    public static Default = new Theme({
        'backgroundColor': '#ffffff',
        'hoverBackgroundColor': '#fcfcfc',
        'selectionBackgroundColor': '#cde6f7',
        'cellPadding': Theme.parsePadding('1px 5px 1px 5px'),
        'cellFontFamily': '"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
        'cellFontSize': '16px',
        'cellColor': '#666666',
        'headerCellColor': '#333333',
        'headerCellFontSize': '16px',
        'rowBackgroundColor': 'transparent',
        'alternateRowBackgroundColor': '#f2f2f2',

        'stack.cellCursor': 'pointer',
        'stack.cellHBorder': Theme.parseBorder('solid 1px #cccccc'),
        'stack.cellHeight': 32,
        'stack.headerCursor': 'pointer',
        'stack.selectionIndicatorWidth': 16,
        'stack.selectionIndicatorPadding': Theme.parsePadding('4px 3px 4px 5px'),
        'stack.headerCellFontFamily': '"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
        'stack.headerEndBorder': Theme.parseBorder('solid 1px #cccccc'),
        'stack.headerHBorder': Theme.parseBorder('solid 1px #cccccc'),
        'stack.rowBorder': Theme.parseBorder('solid 1px #cccccc'),
        'stack.rowPadding': Theme.parsePadding('5px 3px 5px 3px'),

        'table.cellCursor': 'cell',
        'table.cellHBorder': Theme.parseBorder('solid 1px transparent'),
        'table.cellVBorder': Theme.parseBorder('solid 1px transparent'),
        'table.cellWidth': 100,
        'table.cursorBorder': Theme.parseBorder('none 0px transparent'),
        'table.headerBottomBorder': Theme.parseBorder('solid 1px #eaeaea'),
        'table.headerCellPadding': Theme.parsePadding('1px 1px 1px 5px'),
        'table.headerCellVBorder': Theme.parseBorder('solid 1px #eaeaea'),
        'table.headerCursor': 'pointer',
        'table.headerCellFontFamily': '"Segoe UI Semibold", "Segoe UI Web Semibold", "Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
        'table.headerRowHeight': 32,
        'table.rowHeight': 34,
        'table.canvasEndMargin': 0,
        'table.canvasBottomMargin': 0,
    });

    public static Zebra = new Theme({
        'backgroundColor': '#deb887',
        'hoverBackgroundColor': '#eee9bf',
        'selectionBackgroundColor': '#ffd700',
        'cellPadding': Theme.parsePadding('2px 6px 2px 6px'),
        'cellFontFamily': '"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
        'cellColor': '#666666',
        'cellFontSize': '13pt',
        'headerCellColor': '#333333',
        'headerCellFontSize': '13pt',

        'stack.cellCursor': 'pointer',
        'stack.cellFontFamily': '"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
        'stack.selectionIndicatorWidth': 26,
        'stack.selectionIndicatorPadding': Theme.parsePadding('10px 6px 10px 10px'),
        'stack.cellHBorder': Theme.parseBorder('solid 1px #cccccc'),
        'stack.cellHeight': 30,
        'stack.headerCursor': 'pointer',
        'stack.headerCellFontFamily': '"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
        'stack.headerHBorder': Theme.parseBorder('solid 1px #ffebcd'),
        'stack.headerEndBorder': Theme.parseBorder('solid 1px transparent'),
        'stack.rowBorder': Theme.parseBorder('solid 1px #cd8500'),
        'stack.rowPadding': Theme.parsePadding('8px 3px 8px 3px'),
        'table.cellCursor': 'cell',
        'table.cellFontFamily': '"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
        'table.cellHBorder': Theme.parseBorder('solid 2px #cd8500'),
        'table.cellVBorder': Theme.parseBorder('solid 2px #ffebcd'),
        'table.cellWidth': 150,
        'table.cursorBorder': Theme.parseBorder('dashed 2px #ffa500'),
        'table.headerBottomBorder': Theme.parseBorder('solid 2px #cd8500'),
        'table.headerCellVBorder': Theme.parseBorder('solid 2px #cd8500'),
        'table.headerCursor': 'pointer',
        'table.headerCellFontFamily': '"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif',
        'table.headerRowHeight': 28,
        'table.rowHeight': 30,
        'table.canvasEndMargin': 300,
        'table.canvasBottomMargin': 300,
    });

    private static _checkPixelUnit(text) {
        return /^\d+px$/.test(text);
    }

    private _options;

    constructor(options) {
        this._options = new Fundamental.PropertyBag(options);

        this._inherit();
        this._check();
    }

    public value(name, value?) {
        return this._options.$property({
            name: name,
            args: Array.prototype.slice.apply(arguments, [1]),
        });
    }

    private _inherit() {
        for (var i = 0; i < Theme._inheritMap.length; i++) {
            var map = Theme._inheritMap[i];

            for (var j = 1; j < map.length; j++) {
                if (!this.value(map[j])) {
                    this.value(map[j], this.value(map[0]));
                }
            }
        }
    }

    private _check() {
        for (var name in this._options) {
            if (Theme._validValueName.indexOf(name) < 0) {
                if (name == '$property') {
                    continue;
                }

                throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', name + ' is invalid');
            }
        }

        for (var i = 0; i < Theme._validValueName.length; i++) {
            var name: any = Theme._validValueName[i];
            if (typeof(this._options[name]) == 'undefined') {
                throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', 'missing ' + name);
            }
        }
    }
}

