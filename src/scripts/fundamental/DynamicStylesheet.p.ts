export class DynamicStylesheet {
    public disposer;
    private _element;
    private _stylesheetText;

    /**
     * This class is used to add dynamic stylesheet to the document. You can change the content of
     * the stylesheet in any time. The stylesheet is removed once the object is disposed. By changing
     * the content of the stylesheet, we can change a bunch of style in one time to improve the performance.
     *
     * @constructor Microsoft.Office.Controls.Fundamental.DynamicStylesheet
     * @param {string=} id - The id of the newly created stylesheet element
     */
    constructor(id) {
        this._element = $('<style type="text/css"></style>');

        if (id) {
            this._element.attr('id', id);
        }

        $(document.head).append(this._element);
        this._stylesheetText = '';
        this.disposer = new Fundamental.Disposer(() => {
            this._element.remove();
            this._element = null;
            this._stylesheetText = null;
        });
    }

    /**
     * @method Microsoft.Office.Controls.Fundamental.DynamicStylesheet#content
     * @param {string=} stylesheetText - Set/get the content of the stylesheet
     */
    public content(stylesheetText) {
        if (this.disposer.isDisposed) {
            // FIXME: throw exception here!
            return;
        }

        if (arguments.length == 0) {
            return this._stylesheetText;
        } else {
            if (!stylesheetText) {
                stylesheetText = '';
            }

            if (this._stylesheetText != stylesheetText) {
                this._stylesheetText = stylesheetText;

                if (this._element[0].styleSheet && !this._element[0].sheet) {
                    this._element[0].styleSheet.cssText = this._stylesheetText;
                } else {
                    this._element.html(this._stylesheetText);
                }
            }
        }
    }
}
