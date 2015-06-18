export class TextDirection {
    public static RTL = 1;
    public static LTR = 0;
    private static _staticInitialized = false;
    private static _zeroEnd;
    private static _scrollFrontDirection;
    private _rtl;
    private _front;
    private _end;

    /**
     *
     * @constructor Microsoft.Office.Controls.Fundamental.TextDirection
     * @param {boolean} rtl - A boolean value indicates if it is in rtl environment, true indicates rtl.
     */
    constructor(rtl) {
        this._rtl = !!rtl;

        if (this._rtl) {
            this._front = 'right';
            this._end = 'left';
        } else {
            this._front = 'left';
            this._end = 'right';
        }
    }

    private static _staticInitialize() {
        if (TextDirection._staticInitialized) {
            return;
        }

        var div = $('<div style="direction: rtl; posistion:absolute; left: 0px; right: 0px; width: 50px; height: 50px; overflow: auto"><div style="posistion:absolute; left: 0px; right: 0px; width: 51px; height: 50px"></div></div>');

        $(document.body).append(div);

        TextDirection._zeroEnd = div.scrollLeft() == 0 ? 'front' : 'end';

        div.scrollLeft(1);

        if (div.scrollLeft() == 1) {
            TextDirection._scrollFrontDirection = 1;
        } else {
            TextDirection._scrollFrontDirection = -1;
        }

        div.remove();

        TextDirection._staticInitialized = true;
    }

    public static zeroEnd() {
        TextDirection._staticInitialize();
        return TextDirection._zeroEnd;
    }

    public static scrollFrontDirection() {
        TextDirection._staticInitialize();
        return TextDirection._scrollFrontDirection;
    }

    public rtl() {
        return this._rtl;
    }

    public front() {
        return this._front;
    }

    public end(value = undefined) {
        return this._end;
    }
}

